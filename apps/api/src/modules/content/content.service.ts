import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/content.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Banners ----
  async activeBanners() {
    const now = new Date();
    const banners = await this.prisma.banner.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });
    return banners;
  }

  listBanners() {
    return this.prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  createBanner(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });
  }

  async updateBanner(id: string, dto: UpdateBannerDto) {
    await this.ensureBanner(id);
    return this.prisma.banner.update({
      where: { id },
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl === undefined ? undefined : dto.linkUrl,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
        startsAt:
          dto.startsAt === undefined ? undefined : dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt === undefined ? undefined : dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });
  }

  async deleteBanner(id: string) {
    await this.ensureBanner(id);
    await this.prisma.banner.delete({ where: { id } });
    return { success: true };
  }

  // ---- Site content / settings (key/value JSON) ----
  async getContent(key: string) {
    const row = await this.prisma.siteContent.findUnique({ where: { key } });
    return { key, value: row?.value ?? null };
  }

  setContent(key: string, value: unknown) {
    return this.prisma.siteContent.upsert({
      where: { key },
      create: { key, value: value as any },
      update: { value: value as any },
    });
  }

  listContent() {
    return this.prisma.siteContent.findMany();
  }

  private async ensureBanner(id: string) {
    const b = await this.prisma.banner.findUnique({ where: { id } });
    if (!b) throw new NotFoundException('Banner not found');
    return b;
  }
}
