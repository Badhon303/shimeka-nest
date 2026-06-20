'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { ProductView, ProductVariantView } from '@shimeka/shared';
import { useCart } from '@/context/cart-context';
import { cn, formatBDT } from '@/lib/utils';

export function ProductDetail({ product }: { product: ProductView }) {
  const { addItem } = useCart();

  // Selected attribute value per attribute name.
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const attr of product.attributes) {
      if (attr.values[0]) init[attr.name] = attr.values[0].value;
    }
    return init;
  });
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Resolve the variant matching the selected attribute values.
  const variant: ProductVariantView | undefined = useMemo(() => {
    return product.variants.find((v) =>
      v.attributeValues.every((av) => selected[av.attributeName] === av.value),
    );
  }, [product.variants, selected]);

  const gallery = useMemo(() => {
    const imgs = [
      ...(product.thumbnailImage ? [product.thumbnailImage] : []),
      ...product.images.map((i) => i.url),
      ...(variant?.images ?? []),
    ];
    return Array.from(new Set(imgs));
  }, [product, variant]);

  const price = variant?.price ?? product.basePrice;
  const inStock = (variant?.stockQuantity ?? 0) > 0;

  const handleAdd = async () => {
    if (!variant) {
      setError('Please select an available option');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await addItem(variant.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-brand-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={gallery[activeImage]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              {gallery[activeImage] && (
                <Image
                  src={gallery[activeImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        {gallery.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar">
            {gallery.map((img, i) => (
              <button
                key={img}
                onClick={() => setActiveImage(i)}
                className={cn(
                  'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2',
                  i === activeImage ? 'border-brand-500' : 'border-transparent',
                )}
              >
                <Image src={img} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-sm uppercase tracking-wide text-brand-500">
          {product.category?.name}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold">{product.name}</h1>

        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-brand-700">{formatBDT(price)}</span>
          {(product.reviewCount ?? 0) > 0 && (
            <span className="text-sm text-amber-500">
              ★ {product.avgRating?.toFixed(1)}{' '}
              <span className="text-ink/50">({product.reviewCount})</span>
            </span>
          )}
        </div>

        {/* Variant selectors */}
        <div className="mt-6 space-y-5">
          {product.attributes.map((attr) => (
            <div key={attr.id}>
              <p className="mb-2 text-sm font-medium">
                {attr.name}: <span className="text-ink/60">{selected[attr.name]}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {attr.values.map((val) => {
                  const isSwatch = !!val.swatchHex;
                  const isActive = selected[attr.name] === val.value;
                  return (
                    <button
                      key={val.id}
                      onClick={() => setSelected((s) => ({ ...s, [attr.name]: val.value }))}
                      title={val.value}
                      className={cn(
                        'rounded-full border-2 transition',
                        isSwatch ? 'h-9 w-9' : 'px-4 py-1.5 text-sm',
                        isActive
                          ? 'border-brand-600 ring-2 ring-brand-100'
                          : 'border-brand-200 hover:border-brand-400',
                      )}
                      style={isSwatch ? { backgroundColor: val.swatchHex ?? undefined } : undefined}
                    >
                      {!isSwatch && val.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Stock + SKU */}
        <div className="mt-5 text-sm">
          {variant ? (
            inStock ? (
              <span className="text-green-600">
                In stock ({variant.stockQuantity}) · SKU {variant.sku}
              </span>
            ) : (
              <span className="text-red-500">Out of stock</span>
            )
          ) : (
            <span className="text-ink/50">Select options</span>
          )}
        </div>

        {/* Quantity + add */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center rounded-full border border-brand-200">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-2.5">
              <Minus size={16} />
            </button>
            <span className="w-10 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(variant?.stockQuantity ?? 99, q + 1))}
              className="p-2.5"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={!inStock || loading}
            className="btn-primary flex-1"
          >
            {added ? (
              <>
                <Check size={18} /> Added to cart
              </>
            ) : (
              <>
                <ShoppingBag size={18} /> {loading ? 'Adding...' : 'Add to cart'}
              </>
            )}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        {product.description && (
          <div className="mt-8 border-t border-brand-100 pt-6">
            <h2 className="mb-2 font-semibold">Description</h2>
            <p className="text-sm leading-relaxed text-ink/70">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
