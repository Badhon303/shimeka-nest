// Shared enums mirrored across API (Prisma), admin, and storefront.
// Keep these values in sync with prisma/schema.prisma enums.

// NOTE: Defined as `as const` objects + union types (NOT TS `enum`s) so they are
// structurally identical to Prisma's generated string-literal-union enums.
// This avoids nominal-type friction when passing Prisma rows around.

export const UserRole = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const CategoryType = {
  MAKEUP: "MAKEUP",
  CLOTHING: "CLOTHING",
  GENERAL: "GENERAL",
} as const;
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

export const ProductStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const PaymentMethod = {
  COD: "COD",
  BANK_TRANSFER: "BANK_TRANSFER",
  MOBILE_BANKING: "MOBILE_BANKING",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const DeliveryStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURNED: "RETURNED",
} as const;
export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const OrderStatusField = {
  PAYMENT: "PAYMENT",
  DELIVERY: "DELIVERY",
} as const;
export type OrderStatusField = (typeof OrderStatusField)[keyof typeof OrderStatusField];

export const ReviewStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export const CouponType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED: "FIXED",
} as const;
export type CouponType = (typeof CouponType)[keyof typeof CouponType];

// Valid forward transitions for delivery status (used to validate admin updates).
export const DELIVERY_STATUS_FLOW: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.PENDING]: [DeliveryStatus.PROCESSING, DeliveryStatus.CANCELLED],
  [DeliveryStatus.PROCESSING]: [DeliveryStatus.PACKED, DeliveryStatus.CANCELLED],
  [DeliveryStatus.PACKED]: [DeliveryStatus.SHIPPED, DeliveryStatus.CANCELLED],
  [DeliveryStatus.SHIPPED]: [DeliveryStatus.OUT_FOR_DELIVERY, DeliveryStatus.RETURNED],
  [DeliveryStatus.OUT_FOR_DELIVERY]: [DeliveryStatus.DELIVERED, DeliveryStatus.RETURNED],
  [DeliveryStatus.DELIVERED]: [DeliveryStatus.RETURNED],
  [DeliveryStatus.CANCELLED]: [],
  [DeliveryStatus.RETURNED]: [],
};
