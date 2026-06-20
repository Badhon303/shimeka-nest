import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toSlug, uniqueSlug } from '../../common/slug';
import {
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from './dto/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Public: full nested tree (top-level categories with children).
  async tree() {
    const all = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const byParent = new Map<string | null, typeof all>();
    for (const c of all) {
      const key = c.parentId ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    }
    const build = (parentId: string | null): any[] =>
      (byParent.get(parentId) ?? []).map((c) => ({
        ...c,
        children: build(c.id),
      }));
    return build(null);
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { children: true, parent: true },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  // Admin: flat list
  list() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true, children: true } } },
    });
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug
      ? toSlug(dto.slug)
      : await uniqueSlug(dto.name, (s) => this.slugExists(s));
    if (dto.parentId) await this.ensureExists(dto.parentId);
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        parentId: dto.parentId ?? null,
        image: dto.image ?? null,
        sortOrder: dto.sortOrder ?? 0,
        type: dto.type,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    if (dto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }
    let slug: string | undefined;
    if (dto.slug) slug = toSlug(dto.slug);
    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug,
        parentId: dto.parentId === undefined ? undefined : dto.parentId,
        image: dto.image === undefined ? undefined : dto.image,
        sortOrder: dto.sortOrder,
        type: dto.type,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const childCount = await this.prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new BadRequestException('Remove or reassign subcategories first');
    }
    const productCount = await this.prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new BadRequestException('Reassign products before deleting this category');
    }
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  async reorder(dto: ReorderCategoriesDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    return { success: true };
  }

  private async ensureExists(id: string) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  private async slugExists(slug: string): Promise<boolean> {
    return (await this.prisma.category.count({ where: { slug } })) > 0;
  }
}
