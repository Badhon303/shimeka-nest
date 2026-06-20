import type { ProductView } from '@shimeka/shared';
import { ProductCard } from './product-card';

export function ProductGrid({ products }: { products: ProductView[] }) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-200 py-16 text-center text-ink/50">
        No products found.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
