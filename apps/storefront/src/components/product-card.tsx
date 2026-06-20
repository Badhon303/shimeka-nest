'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ProductView } from '@shimeka/shared';
import { formatBDT } from '@/lib/utils';

export function ProductCard({ product, index = 0 }: { product: ProductView; index?: number }) {
  const prices = product.variants.map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : product.basePrice;
  const inStock = product.variants.some((v) => v.stockQuantity > 0);
  const rating = product.avgRating ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link href={`/product/${product.slug}`} className="group block">
        <div className="card overflow-hidden">
          <div className="relative aspect-square overflow-hidden bg-brand-50">
            {product.thumbnailImage ? (
              <Image
                src={product.thumbnailImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-brand-300">No image</div>
            )}
            {!inStock && (
              <span className="badge absolute left-3 top-3 bg-ink/80 text-white">Sold out</span>
            )}
            {product.isFeatured && inStock && (
              <span className="badge absolute left-3 top-3 bg-brand-600 text-white">Featured</span>
            )}
          </div>
          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-brand-500">
              {product.category?.name ?? ''}
            </p>
            <h3 className="mt-1 line-clamp-1 font-medium text-ink group-hover:text-brand-700">
              {product.name}
            </h3>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-semibold text-brand-700">{formatBDT(minPrice)}</span>
              {rating > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-500">
                  ★ <span className="text-ink/60">{rating.toFixed(1)}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
