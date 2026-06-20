import {
  CategoryType,
  CouponType,
  DeliveryStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  ReviewStatus,
  UserRole,
} from "./enums";

// ---- Generic API shapes ----

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ---- Domain DTO-ish view models (serialized API responses) ----

export interface UserView {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: UserRole;
  isBlocked: boolean;
  createdAt: string;
}

export interface AddressView {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  area: string | null;
  postalCode: string | null;
  isDefault: boolean;
}

export interface CategoryView {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  image: string | null;
  sortOrder: number;
  type: CategoryType;
  children?: CategoryView[];
}

export interface ProductImageView {
  id: string;
  url: string;
  sortOrder: number;
}

export interface VariantAttributeValueView {
  id: string;
  value: string;
  attributeId: string;
  attributeName: string;
}

export interface ProductVariantView {
  id: string;
  sku: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  attributeValues: VariantAttributeValueView[];
  images: string[];
}

export interface VariantAttributeView {
  id: string;
  name: string;
  values: { id: string; value: string; swatchHex?: string | null }[];
}

export interface ProductView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  category?: CategoryView;
  basePrice: number;
  status: ProductStatus;
  thumbnailImage: string | null;
  isFeatured?: boolean;
  tags?: string[];
  images: ProductImageView[];
  attributes: VariantAttributeView[];
  variants: ProductVariantView[];
  avgRating?: number;
  reviewCount?: number;
  createdAt: string;
}

export interface CartItemView {
  id: string;
  productVariantId: string;
  quantity: number;
  productId: string;
  productName: string;
  productSlug: string;
  variantLabel: string;
  unitPrice: number;
  image: string | null;
  stockQuantity: number;
}

export interface CartView {
  id: string;
  items: CartItemView[];
  subtotal: number;
  itemCount: number;
}

export interface OrderItemView {
  id: string;
  productVariantId: string | null;
  productNameSnapshot: string;
  variantLabelSnapshot: string | null;
  priceSnapshot: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderView {
  id: string;
  orderNumber: string;
  userId: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  shippingAddress: AddressView | OrderShippingSnapshot;
  items: OrderItemView[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  couponCode: string | null;
  notes?: OrderNoteView[];
  statusLogs?: OrderStatusLogView[];
  createdAt: string;
}

export interface OrderShippingSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  area?: string | null;
  postalCode?: string | null;
}

export interface OrderNoteView {
  id: string;
  note: string;
  authorName: string | null;
  createdAt: string;
}

export interface OrderStatusLogView {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string;
  changedByName: string | null;
  note: string | null;
  createdAt: string;
}

export interface ReviewView {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string | null;
  images: string[];
  status: ReviewStatus;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface CouponView {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

export interface BannerView {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface DashboardSummary {
  ordersToday: number;
  revenueThisMonth: number;
  pendingOrders: number;
  lowStockCount: number;
  totalProducts: number;
  totalCustomers: number;
}
