import { ProductView } from '@shimeka/shared';

// Converts a Prisma product (with relations) to the shared ProductView shape.
// Decimal fields are converted to plain numbers for JSON transport.
export function serializeProduct(
  p: any,
  extra?: { avgRating?: number; reviewCount?: number },
): ProductView {
  const attrNameById = new Map<string, string>();
  for (const attr of p.attributes ?? []) {
    attrNameById.set(attr.id, attr.name);
  }

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    categoryId: p.categoryId,
    category: p.category
      ? {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
          parentId: p.category.parentId ?? null,
          image: p.category.image ?? null,
          sortOrder: p.category.sortOrder,
          type: p.category.type,
        }
      : undefined,
    basePrice: Number(p.basePrice),
    status: p.status,
    thumbnailImage: p.thumbnailImage ?? null,
    isFeatured: p.isFeatured ?? false,
    tags: p.tags ?? [],
    images: (p.images ?? [])
      .slice()
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map((img: any) => ({ id: img.id, url: img.url, sortOrder: img.sortOrder })),
    attributes: (p.attributes ?? []).map((attr: any) => ({
      id: attr.id,
      name: attr.name,
      values: (attr.values ?? [])
        .slice()
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .map((v: any) => ({ id: v.id, value: v.value, swatchHex: v.swatchHex ?? null })),
    })),
    variants: (p.variants ?? []).map((variant: any) => ({
      id: variant.id,
      sku: variant.sku,
      price: Number(variant.price),
      stockQuantity: variant.stockQuantity,
      lowStockThreshold: variant.lowStockThreshold,
      images: variant.images ?? [],
      attributeValues: (variant.attributeValues ?? []).map((av: any) => ({
        id: av.id,
        value: av.value,
        attributeId: av.variantAttributeId,
        attributeName:
          attrNameById.get(av.variantAttributeId) ??
          av.variantAttribute?.name ??
          '',
      })),
    })),
    avgRating: extra?.avgRating ?? 0,
    reviewCount: extra?.reviewCount ?? 0,
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
  };
}

export const PRODUCT_FULL_INCLUDE = {
  category: true,
  images: true,
  attributes: { include: { values: true } },
  variants: {
    include: {
      attributeValues: { include: { variantAttribute: true } },
    },
  },
} as const;
