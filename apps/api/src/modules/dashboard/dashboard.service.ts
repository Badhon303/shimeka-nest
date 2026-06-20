import { Injectable } from '@nestjs/common';
import {
  DeliveryStatus,
  PaymentStatus,
  ProductStatus,
  UserRole,
} from '@shimeka/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { serializeOrder, ORDER_FULL_INCLUDE } from '../orders/orders.serializer';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      ordersToday,
      revenueAgg,
      pendingOrders,
      totalProducts,
      totalCustomers,
      variants,
    ] = await this.prisma.$transaction([
      this.prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: PaymentStatus.PAID, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.order.count({
        where: {
          deliveryStatus: { in: [DeliveryStatus.PENDING, DeliveryStatus.PROCESSING] },
        },
      }),
      this.prisma.product.count({ where: { status: ProductStatus.PUBLISHED } }),
      this.prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      this.prisma.productVariant.findMany({
        select: { stockQuantity: true, lowStockThreshold: true },
      }),
    ]);

    const lowStockCount = variants.filter(
      (v) => v.stockQuantity <= v.lowStockThreshold,
    ).length;

    return {
      ordersToday,
      revenueThisMonth: Number(revenueAgg._sum.total ?? 0),
      pendingOrders,
      lowStockCount,
      totalProducts,
      totalCustomers,
    };
  }

  async recentOrders(limit = 10) {
    const rows = await this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: ORDER_FULL_INCLUDE,
    });
    return rows.map(serializeOrder);
  }

  // Simple sales series for the last N days (count + revenue per day).
  async salesSeries(days = 14) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, total: true, paymentStatus: true },
    });
    const buckets = new Map<string, { orders: number; revenue: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      buckets.set(d.toISOString().slice(0, 10), { orders: 0, revenue: 0 });
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.orders += 1;
        if (o.paymentStatus === PaymentStatus.PAID) bucket.revenue += Number(o.total);
      }
    }
    return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
  }
}
