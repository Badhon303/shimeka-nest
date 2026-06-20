import { OrderView } from '@shimeka/shared';

export const ORDER_FULL_INCLUDE = {
  items: true,
  statusLogs: { include: { changedBy: { select: { name: true } } }, orderBy: { createdAt: 'desc' as const } },
  notes: { include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' as const } },
} as const;

export function serializeOrder(o: any): OrderView {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    userId: o.userId ?? null,
    guestEmail: o.guestEmail ?? null,
    guestPhone: o.guestPhone ?? null,
    shippingAddress: o.shippingAddress,
    items: (o.items ?? []).map((i: any) => ({
      id: i.id,
      productVariantId: i.productVariantId ?? null,
      productNameSnapshot: i.productNameSnapshot,
      variantLabelSnapshot: i.variantLabelSnapshot ?? null,
      priceSnapshot: Number(i.priceSnapshot),
      quantity: i.quantity,
      lineTotal: Number(i.priceSnapshot) * i.quantity,
    })),
    subtotal: Number(o.subtotal),
    discountAmount: Number(o.discountAmount),
    shippingFee: Number(o.shippingFee),
    total: Number(o.total),
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    deliveryStatus: o.deliveryStatus,
    couponCode: o.couponCode ?? null,
    notes: (o.notes ?? []).map((n: any) => ({
      id: n.id,
      note: n.note,
      authorName: n.author?.name ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    statusLogs: (o.statusLogs ?? []).map((l: any) => ({
      id: l.id,
      field: l.field,
      oldValue: l.oldValue ?? null,
      newValue: l.newValue,
      changedByName: l.changedBy?.name ?? null,
      note: l.note ?? null,
      createdAt: l.createdAt.toISOString(),
    })),
    createdAt: o.createdAt.toISOString(),
  };
}
