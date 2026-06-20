import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryStatus,
  DELIVERY_STATUS_FLOW,
  OrderStatusField,
  PaymentStatus,
  SHIPPING_ZONES,
} from '@shimeka/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPaginationParams,
} from '../../common/pagination';
import { CouponsService } from '../coupons/coupons.service';
import {
  AddOrderNoteDto,
  CreateOrderDto,
  OrderFilterDto,
  UpdateDeliveryStatusDto,
  UpdatePaymentStatusDto,
} from './dto/orders.dto';
import { ORDER_FULL_INCLUDE, serializeOrder } from './orders.serializer';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
  ) {}

  // -------------------------------------------------------------------------
  // Create order (customer or guest)
  // -------------------------------------------------------------------------
  async create(dto: CreateOrderDto, userId?: string) {
    if (!dto.items?.length) throw new BadRequestException('Order must contain items');

    // Guest must provide contact info.
    if (!userId && !dto.guestPhone && !dto.guestEmail) {
      throw new BadRequestException('Guest orders require an email or phone');
    }

    // Resolve shipping address snapshot.
    const shippingAddress = await this.resolveAddress(dto, userId);

    // Resolve shipping fee.
    const zone = SHIPPING_ZONES.find((z) => z.id === dto.shippingZone);
    if (!zone) throw new BadRequestException('Invalid shipping zone');
    const shippingFee = zone.fee;

    // Load variants and validate stock.
    const variantIds = dto.items.map((i) => i.productVariantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: { select: { id: true, name: true, categoryId: true } },
        attributeValues: { include: { variantAttribute: true } },
      },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let subtotal = 0;
    const lineItems = dto.items.map((item) => {
      const variant = variantMap.get(item.productVariantId);
      if (!variant) {
        throw new BadRequestException(`Variant ${item.productVariantId} not found`);
      }
      if (variant.stockQuantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${variant.product.name}`);
      }
      const price = Number(variant.price);
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      const label = variant.attributeValues
        .map((av) => `${av.variantAttribute?.name}: ${av.value}`)
        .join(', ');
      return {
        variant,
        quantity: item.quantity,
        price,
        lineTotal,
        label,
        couponContext: {
          productId: variant.product.id,
          categoryId: variant.product.categoryId,
          lineTotal,
        },
      };
    });
    subtotal = Math.round(subtotal * 100) / 100;

    // Coupon.
    let discountAmount = 0;
    let couponCode: string | null = null;
    if (dto.couponCode) {
      const { coupon, discount } = await this.couponsService.calculateDiscount(
        dto.couponCode,
        subtotal,
        lineItems.map((l) => l.couponContext),
      );
      discountAmount = discount;
      couponCode = coupon.code;
    }

    const total = Math.round((subtotal - discountAmount + shippingFee) * 100) / 100;
    const orderNumber = await this.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: userId ?? null,
          guestEmail: dto.guestEmail ?? null,
          guestPhone: dto.guestPhone ?? null,
          addressId: dto.addressId ?? null,
          shippingAddress: shippingAddress as any,
          subtotal,
          discountAmount,
          shippingFee,
          total,
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.UNPAID,
          deliveryStatus: DeliveryStatus.PENDING,
          couponCode,
          items: {
            create: lineItems.map((l) => ({
              productVariantId: l.variant.id,
              productId: l.variant.product.id,
              productNameSnapshot: l.variant.product.name,
              variantLabelSnapshot: l.label || null,
              priceSnapshot: l.price,
              quantity: l.quantity,
            })),
          },
          statusLogs: {
            create: [
              {
                field: OrderStatusField.PAYMENT,
                oldValue: null,
                newValue: PaymentStatus.UNPAID,
                changedByUserId: userId ?? null,
                note: 'Order placed',
              },
              {
                field: OrderStatusField.DELIVERY,
                oldValue: null,
                newValue: DeliveryStatus.PENDING,
                changedByUserId: userId ?? null,
                note: 'Order placed',
              },
            ],
          },
        },
        include: ORDER_FULL_INCLUDE,
      });

      // Decrement stock atomically.
      for (const l of lineItems) {
        await tx.productVariant.update({
          where: { id: l.variant.id },
          data: { stockQuantity: { decrement: l.quantity } },
        });
      }

      if (couponCode) {
        await this.couponsService.incrementUsage(couponCode, tx);
      }

      // Clear the user's cart after a successful order.
      if (userId) {
        const cart = await tx.cart.findFirst({ where: { userId } });
        if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return created;
    });

    return serializeOrder(order);
  }

  // -------------------------------------------------------------------------
  // Customer views
  // -------------------------------------------------------------------------
  async listMine(userId: string, query: OrderFilterDto) {
    const { skip, take, page, pageSize } = getPaginationParams(query);
    const where: any = { userId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: ORDER_FULL_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);
    return buildPaginated(rows.map(serializeOrder), total, page, pageSize);
  }

  async getMine(userId: string, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, userId },
      include: ORDER_FULL_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    return serializeOrder(order);
  }

  // Public order confirmation lookup (by order number + contact match).
  async lookupGuest(orderNumber: string, contact: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber,
        OR: [{ guestPhone: contact }, { guestEmail: contact }],
      },
      include: ORDER_FULL_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    return serializeOrder(order);
  }

  // -------------------------------------------------------------------------
  // Admin views & status updates
  // -------------------------------------------------------------------------
  async listAll(query: OrderFilterDto) {
    const { skip, take, page, pageSize } = getPaginationParams(query);
    const where: any = {};
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.deliveryStatus) where.deliveryStatus = query.deliveryStatus;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { guestPhone: { contains: query.search } },
        { guestEmail: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: ORDER_FULL_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);
    return buildPaginated(rows.map(serializeOrder), total, page, pageSize);
  }

  async getOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_FULL_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    return serializeOrder(order);
  }

  async updatePaymentStatus(id: string, dto: UpdatePaymentStatusDto, adminId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === dto.paymentStatus) {
      throw new BadRequestException('Payment status is already set to this value');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderStatusLog.create({
        data: {
          orderId: id,
          field: OrderStatusField.PAYMENT,
          oldValue: order.paymentStatus,
          newValue: dto.paymentStatus,
          changedByUserId: adminId,
          note: dto.note ?? null,
        },
      });
      return tx.order.update({
        where: { id },
        data: { paymentStatus: dto.paymentStatus },
        include: ORDER_FULL_INCLUDE,
      });
    });
    return serializeOrder(updated);
  }

  async updateDeliveryStatus(id: string, dto: UpdateDeliveryStatusDto, adminId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const current = order.deliveryStatus as DeliveryStatus;
    if (current === dto.deliveryStatus) {
      throw new BadRequestException('Delivery status is already set to this value');
    }
    const allowed = DELIVERY_STATUS_FLOW[current] ?? [];
    if (!allowed.includes(dto.deliveryStatus)) {
      throw new BadRequestException(
        `Cannot move delivery status from ${current} to ${dto.deliveryStatus}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderStatusLog.create({
        data: {
          orderId: id,
          field: OrderStatusField.DELIVERY,
          oldValue: current,
          newValue: dto.deliveryStatus,
          changedByUserId: adminId,
          note: dto.note ?? null,
        },
      });

      // Restock items when an order is cancelled or returned.
      if (
        dto.deliveryStatus === DeliveryStatus.CANCELLED ||
        dto.deliveryStatus === DeliveryStatus.RETURNED
      ) {
        const items = await tx.orderItem.findMany({ where: { orderId: id } });
        for (const item of items) {
          if (item.productVariantId) {
            await tx.productVariant.update({
              where: { id: item.productVariantId },
              data: { stockQuantity: { increment: item.quantity } },
            });
          }
        }
      }

      return tx.order.update({
        where: { id },
        data: { deliveryStatus: dto.deliveryStatus },
        include: ORDER_FULL_INCLUDE,
      });
    });
    return serializeOrder(updated);
  }

  async addNote(id: string, dto: AddOrderNoteDto, adminId: string) {
    await this.ensureOrder(id);
    await this.prisma.orderNote.create({
      data: { orderId: id, note: dto.note, authorId: adminId },
    });
    return this.getOne(id);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  private async resolveAddress(dto: CreateOrderDto, userId?: string) {
    if (dto.addressId) {
      const addr = await this.prisma.address.findUnique({ where: { id: dto.addressId } });
      if (!addr) throw new BadRequestException('Address not found');
      if (userId && addr.userId && addr.userId !== userId) {
        throw new ForbiddenException('Address does not belong to you');
      }
      return {
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        area: addr.area,
        postalCode: addr.postalCode,
      };
    }
    if (dto.shippingAddress) {
      return { ...dto.shippingAddress };
    }
    throw new BadRequestException('A shipping address is required');
  }

  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    // Random 4-digit suffix; retry on the rare collision.
    for (let i = 0; i < 5; i++) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const candidate = `SHM-${datePart}-${rand}`;
      const exists = await this.prisma.order.findUnique({ where: { orderNumber: candidate } });
      if (!exists) return candidate;
    }
    return `SHM-${datePart}-${Date.now().toString().slice(-5)}`;
  }

  private async ensureOrder(id: string) {
    const o = await this.prisma.order.findUnique({ where: { id } });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }
}
