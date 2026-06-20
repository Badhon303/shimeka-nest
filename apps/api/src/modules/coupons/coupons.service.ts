import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CouponType } from '@shimeka/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupons.dto';

export interface CouponContextItem {
  productId: string | null;
  categoryId: string | null;
  lineTotal: number;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Core validation/calculation (reused by orders) ----
  async calculateDiscount(
    code: string,
    subtotal: number,
    items: CouponContextItem[] = [],
  ): Promise<{ coupon: any; discount: number }> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid or inactive coupon');
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (coupon.minOrderValue != null && subtotal < Number(coupon.minOrderValue)) {
      throw new BadRequestException(
        `Minimum order value of ${Number(coupon.minOrderValue)} required`,
      );
    }

    // Determine the eligible base amount (full subtotal, or only applicable items).
    const hasProductScope = (coupon.applicableProductIds ?? []).length > 0;
    const hasCategoryScope = (coupon.applicableCategoryIds ?? []).length > 0;

    let base = subtotal;
    if ((hasProductScope || hasCategoryScope) && items.length) {
      base = items
        .filter(
          (i) =>
            (i.productId && coupon.applicableProductIds.includes(i.productId)) ||
            (i.categoryId && coupon.applicableCategoryIds.includes(i.categoryId)),
        )
        .reduce((s, i) => s + i.lineTotal, 0);
      if (base <= 0) {
        throw new BadRequestException('Coupon does not apply to items in your cart');
      }
    }

    let discount =
      coupon.type === CouponType.PERCENTAGE
        ? (base * Number(coupon.value)) / 100
        : Number(coupon.value);

    discount = Math.min(discount, subtotal);
    discount = Math.round(discount * 100) / 100;

    return { coupon, discount };
  }

  async validate(code: string, subtotal: number) {
    const { coupon, discount } = await this.calculateDiscount(code, subtotal);
    return {
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discount,
    };
  }

  async incrementUsage(code: string, tx?: any) {
    const client = tx ?? this.prisma;
    await client.coupon.update({
      where: { code: code.toUpperCase() },
      data: { usedCount: { increment: 1 } },
    });
  }

  // ---- Admin CRUD ----
  list() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.toUpperCase();
    const exists = await this.prisma.coupon.findUnique({ where: { code } });
    if (exists) throw new BadRequestException('Coupon code already exists');
    if (dto.type === CouponType.PERCENTAGE && dto.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100');
    }
    return this.prisma.coupon.create({
      data: {
        code,
        type: dto.type,
        value: dto.value,
        minOrderValue: dto.minOrderValue ?? null,
        maxUses: dto.maxUses ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        applicableCategoryIds: dto.applicableCategoryIds ?? [],
        applicableProductIds: dto.applicableProductIds ?? [],
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.ensure(id);
    return this.prisma.coupon.update({
      where: { id },
      data: {
        type: dto.type,
        value: dto.value,
        minOrderValue: dto.minOrderValue === undefined ? undefined : dto.minOrderValue,
        maxUses: dto.maxUses === undefined ? undefined : dto.maxUses,
        expiresAt:
          dto.expiresAt === undefined
            ? undefined
            : dto.expiresAt
              ? new Date(dto.expiresAt)
              : null,
        applicableCategoryIds: dto.applicableCategoryIds,
        applicableProductIds: dto.applicableProductIds,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }

  private async ensure(id: string) {
    const c = await this.prisma.coupon.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Coupon not found');
    return c;
  }
}
