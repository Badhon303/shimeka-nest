import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryStatus, ReviewStatus } from '@shimeka/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPaginationParams,
  PaginationQueryDto,
} from '../../common/pagination';
import { CreateReviewDto } from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // Public: approved reviews for a product.
  async listForProduct(productId: string, query: PaginationQueryDto) {
    const { skip, take, page, pageSize } = getPaginationParams(query);
    const where = { productId, status: ReviewStatus.APPROVED };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
      this.prisma.review.count({ where }),
    ]);
    return buildPaginated(rows.map((r) => this.serialize(r)), total, page, pageSize);
  }

  // Customer: create a review (verified purchase required).
  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    // Verified purchase: a delivered order containing this product.
    const purchasedItem = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: { userId, deliveryStatus: DeliveryStatus.DELIVERED },
      },
    });
    if (!purchasedItem) {
      throw new BadRequestException(
        'You can only review products from your delivered orders',
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId: dto.productId, userId } },
    });
    if (existing) throw new ConflictException('You have already reviewed this product');

    const review = await this.prisma.review.create({
      data: {
        productId: dto.productId,
        userId,
        orderItemId: purchasedItem.id,
        orderId: purchasedItem.orderId,
        rating: dto.rating,
        comment: dto.comment ?? null,
        images: dto.images ?? [],
        status: ReviewStatus.PENDING,
      },
      include: { user: { select: { name: true } } },
    });
    return this.serialize(review);
  }

  async listMine(userId: string) {
    const rows = await this.prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } },
    });
    return rows.map((r) => ({ ...this.serialize(r), product: (r as any).product }));
  }

  // Admin: moderation
  async listAll(query: PaginationQueryDto & { status?: ReviewStatus }) {
    const { skip, take, page, pageSize } = getPaginationParams(query);
    const where: any = {};
    if (query.status) where.status = query.status;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          product: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return buildPaginated(
      rows.map((r) => ({ ...this.serialize(r), product: (r as any).product })),
      total,
      page,
      pageSize,
    );
  }

  async moderate(id: string, status: ReviewStatus) {
    await this.ensure(id);
    const review = await this.prisma.review.update({
      where: { id },
      data: { status },
      include: { user: { select: { name: true } } },
    });
    return this.serialize(review);
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.review.delete({ where: { id } });
    return { success: true };
  }

  private async ensure(id: string) {
    const r = await this.prisma.review.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Review not found');
    return r;
  }

  private serialize(r: any) {
    return {
      id: r.id,
      productId: r.productId,
      userName: r.user?.name ?? 'Anonymous',
      rating: r.rating,
      comment: r.comment ?? null,
      images: r.images ?? [],
      status: r.status,
      verifiedPurchase: !!r.orderItemId,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
