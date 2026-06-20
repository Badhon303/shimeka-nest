import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductStatus } from '@shimeka/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPaginationParams,
} from '../../common/pagination';
import { toSlug, uniqueSlug } from '../../common/slug';
import {
  AdminProductFilterDto,
  CreateProductDto,
  ProductFilterDto,
  StockAdjustmentDto,
  UpdateProductDto,
} from './dto/products.dto';
import { PRODUCT_FULL_INCLUDE, serializeProduct } from './products.serializer';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // Public
  // -------------------------------------------------------------------------

  async listPublic(filter: ProductFilterDto) {
    const { skip, take, page, pageSize } = getPaginationParams(filter);

    const where: any = { status: ProductStatus.PUBLISHED };

    if (filter.category) {
      // Include products in the category or any of its descendants.
      const categoryIds = await this.collectCategoryIds(filter.category);
      where.categoryId = { in: categoryIds };
    }
    if (filter.featured) where.isFeatured = true;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { tags: { has: filter.search.toLowerCase() } },
      ];
    }

    // Variant-level constraints (price range, in-stock, attribute values).
    const variantSome: any = {};
    if (filter.minPrice != null || filter.maxPrice != null) {
      variantSome.price = {};
      if (filter.minPrice != null) variantSome.price.gte = filter.minPrice;
      if (filter.maxPrice != null) variantSome.price.lte = filter.maxPrice;
    }
    if (filter.inStock) variantSome.stockQuantity = { gt: 0 };
    if (filter.attributes) {
      const pairs = filter.attributes
        .split(',')
        .map((p) => p.split(':'))
        .filter((p) => p.length === 2);
      if (pairs.length) {
        variantSome.attributeValues = {
          some: {
            OR: pairs.map(([name, value]) => ({
              value,
              variantAttribute: { name },
            })),
          },
        };
      }
    }
    if (Object.keys(variantSome).length) {
      where.variants = { some: variantSome };
    }

    const orderBy = this.resolveSort(filter.sort);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: PRODUCT_FULL_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);

    const withRatings = await this.attachRatings(rows);
    return buildPaginated(withRatings, total, page, pageSize);
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.PUBLISHED },
      include: PRODUCT_FULL_INCLUDE,
    });
    if (!product) throw new NotFoundException('Product not found');
    const [view] = await this.attachRatings([product]);
    return view;
  }

  async related(slug: string, limit = 8) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) throw new NotFoundException('Product not found');
    const rows = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        categoryId: product.categoryId,
        NOT: { id: product.id },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: PRODUCT_FULL_INCLUDE,
    });
    return this.attachRatings(rows);
  }

  async search(q: string, limit = 8) {
    if (!q?.trim()) return [];
    const rows = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { tags: { has: q.toLowerCase() } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, slug: true, thumbnailImage: true, basePrice: true },
    });
    return rows.map((r) => ({ ...r, basePrice: Number(r.basePrice) }));
  }

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------

  async listAdmin(filter: AdminProductFilterDto) {
    const { skip, take, page, pageSize } = getPaginationParams(filter);
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: filter.search, mode: 'insensitive' } } } },
      ];
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: PRODUCT_FULL_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);
    return buildPaginated(
      rows.map((r) => serializeProduct(r)),
      total,
      page,
      pageSize,
    );
  }

  async findByIdAdmin(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_FULL_INCLUDE,
    });
    if (!product) throw new NotFoundException('Product not found');
    const [view] = await this.attachRatings([product]);
    return view;
  }

  async create(dto: CreateProductDto) {
    await this.ensureCategory(dto.categoryId);
    this.validateVariants(dto);

    const slug = dto.slug
      ? toSlug(dto.slug)
      : await uniqueSlug(dto.name, (s) => this.slugExists(s));

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description ?? null,
          tags: (dto.tags ?? []).map((t) => t.toLowerCase()),
          categoryId: dto.categoryId,
          basePrice: dto.basePrice,
          status: dto.status ?? ProductStatus.DRAFT,
          thumbnailImage: dto.thumbnailImage ?? null,
          isFeatured: dto.isFeatured ?? false,
          images: {
            create: (dto.images ?? []).map((url, i) => ({ url, sortOrder: i })),
          },
        },
      });

      // Create attributes + values, building a lookup of (attrName|value) -> valueId.
      const valueIdMap = await this.createAttributes(tx, product.id, dto.attributes ?? []);

      // Create variants linking to attribute value IDs.
      for (const v of dto.variants) {
        const valueIds = v.attributeValues.map((ref) => {
          const key = `${ref.attributeName}|${ref.value}`;
          const id = valueIdMap.get(key);
          if (!id) {
            throw new BadRequestException(
              `Variant references undefined attribute value: ${ref.attributeName} = ${ref.value}`,
            );
          }
          return id;
        });
        await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: v.sku,
            price: v.price,
            stockQuantity: v.stockQuantity,
            lowStockThreshold: v.lowStockThreshold ?? 5,
            images: v.images ?? [],
            attributeValues: { connect: valueIds.map((id) => ({ id })) },
          },
        });
      }

      const full = await tx.product.findUnique({
        where: { id: product.id },
        include: PRODUCT_FULL_INCLUDE,
      });
      return serializeProduct(full);
    });
  }

  // Full replace of product + attributes + variants (simpler & predictable for admin).
  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');
    await this.ensureCategory(dto.categoryId);
    this.validateVariants(dto);

    let slug = existing.slug;
    if (dto.slug && toSlug(dto.slug) !== existing.slug) {
      slug = toSlug(dto.slug);
    }

    return this.prisma.$transaction(async (tx) => {
      // Remove existing attributes (cascade values) and variants, then recreate.
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.variantAttribute.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });

      await tx.product.update({
        where: { id },
        data: {
          name: dto.name,
          slug,
          description: dto.description ?? null,
          tags: (dto.tags ?? []).map((t) => t.toLowerCase()),
          categoryId: dto.categoryId,
          basePrice: dto.basePrice,
          status: dto.status ?? existing.status,
          thumbnailImage: dto.thumbnailImage ?? null,
          isFeatured: dto.isFeatured ?? false,
          images: {
            create: (dto.images ?? []).map((url, i) => ({ url, sortOrder: i })),
          },
        },
      });

      const valueIdMap = await this.createAttributes(tx, id, dto.attributes ?? []);

      for (const v of dto.variants) {
        const valueIds = v.attributeValues.map((ref) => {
          const key = `${ref.attributeName}|${ref.value}`;
          const vid = valueIdMap.get(key);
          if (!vid) {
            throw new BadRequestException(
              `Variant references undefined attribute value: ${ref.attributeName} = ${ref.value}`,
            );
          }
          return vid;
        });
        await tx.productVariant.create({
          data: {
            productId: id,
            sku: v.sku,
            price: v.price,
            stockQuantity: v.stockQuantity,
            lowStockThreshold: v.lowStockThreshold ?? 5,
            images: v.images ?? [],
            attributeValues: { connect: valueIds.map((vId) => ({ id: vId })) },
          },
        });
      }

      const full = await tx.product.findUnique({
        where: { id },
        include: PRODUCT_FULL_INCLUDE,
      });
      return serializeProduct(full);
    });
  }

  async setStatus(id: string, status: ProductStatus) {
    await this.ensureProduct(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { status },
      include: PRODUCT_FULL_INCLUDE,
    });
    return serializeProduct(product);
  }

  async remove(id: string) {
    await this.ensureProduct(id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // Inventory
  // -------------------------------------------------------------------------

  async adjustStock(variantId: string, dto: StockAdjustmentDto, userId?: string) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    const newQuantity = variant.stockQuantity + dto.change;
    if (newQuantity < 0) {
      throw new BadRequestException('Adjustment would result in negative stock');
    }
    const [updated] = await this.prisma.$transaction([
      this.prisma.productVariant.update({
        where: { id: variantId },
        data: { stockQuantity: newQuantity },
      }),
      this.prisma.stockAdjustment.create({
        data: {
          variantId,
          change: dto.change,
          newQuantity,
          reason: dto.reason,
          adjustedById: userId ?? null,
        },
      }),
    ]);
    return updated;
  }

  async lowStock() {
    const variants = await this.prisma.productVariant.findMany({
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: { stockQuantity: 'asc' },
    });
    return variants
      .filter((v) => v.stockQuantity <= v.lowStockThreshold)
      .map((v) => ({
        id: v.id,
        sku: v.sku,
        stockQuantity: v.stockQuantity,
        lowStockThreshold: v.lowStockThreshold,
        product: v.product,
      }));
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private resolveSort(sort?: string): any {
    switch (sort) {
      case 'price_asc':
        return { basePrice: 'asc' };
      case 'price_desc':
        return { basePrice: 'desc' };
      case 'popularity':
        return { reviews: { _count: 'desc' } };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }

  private async createAttributes(
    tx: any,
    productId: string,
    attributes: { name: string; values: { value: string; swatchHex?: string; sortOrder?: number }[] }[],
  ): Promise<Map<string, string>> {
    const valueIdMap = new Map<string, string>();
    let attrIndex = 0;
    for (const attr of attributes) {
      const created = await tx.variantAttribute.create({
        data: {
          productId,
          name: attr.name,
          sortOrder: attrIndex++,
          values: {
            create: attr.values.map((val, i) => ({
              value: val.value,
              swatchHex: val.swatchHex ?? null,
              sortOrder: val.sortOrder ?? i,
            })),
          },
        },
        include: { values: true },
      });
      for (const v of created.values) {
        valueIdMap.set(`${attr.name}|${v.value}`, v.id);
      }
    }
    return valueIdMap;
  }

  private validateVariants(dto: CreateProductDto) {
    if (!dto.variants?.length) {
      throw new BadRequestException('At least one variant is required');
    }
    const skus = dto.variants.map((v) => v.sku);
    if (new Set(skus).size !== skus.length) {
      throw new BadRequestException('Duplicate SKUs within product');
    }
  }

  private async collectCategoryIds(slug: string): Promise<string[]> {
    const root = await this.prisma.category.findUnique({ where: { slug } });
    if (!root) throw new NotFoundException('Category not found');
    const all = await this.prisma.category.findMany({ select: { id: true, parentId: true } });
    const childrenOf = new Map<string, string[]>();
    for (const c of all) {
      if (!c.parentId) continue;
      if (!childrenOf.has(c.parentId)) childrenOf.set(c.parentId, []);
      childrenOf.get(c.parentId)!.push(c.id);
    }
    const ids: string[] = [];
    const stack = [root.id];
    while (stack.length) {
      const id = stack.pop()!;
      ids.push(id);
      stack.push(...(childrenOf.get(id) ?? []));
    }
    return ids;
  }

  private async attachRatings(rows: any[]) {
    if (!rows.length) return [];
    const productIds = rows.map((r) => r.id);
    const grouped = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds }, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const map = new Map(
      grouped.map((g) => [
        g.productId,
        { avg: g._avg.rating ?? 0, count: g._count.rating },
      ]),
    );
    return rows.map((r) =>
      serializeProduct(r, {
        avgRating: map.get(r.id)?.avg ?? 0,
        reviewCount: map.get(r.id)?.count ?? 0,
      }),
    );
  }

  private async ensureProduct(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  private async ensureCategory(id: string) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new BadRequestException('Invalid category');
    return c;
  }

  private async slugExists(slug: string): Promise<boolean> {
    return (await this.prisma.product.count({ where: { slug } })) > 0;
  }
}
