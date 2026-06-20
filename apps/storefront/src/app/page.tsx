import Link from 'next/link';
import Image from 'next/image';
import { Hero } from '@/components/hero';
import { ProductGrid } from '@/components/product-grid';
import { getBanners, getCategories, getFeatured, getNewArrivals } from '@/lib/api';

export const revalidate = 60;

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const [featured, newArrivals, categories] = await Promise.all([
    safe(getFeatured(), { data: [], meta: { total: 0, page: 1, pageSize: 0, totalPages: 0 } }),
    safe(getNewArrivals(), { data: [], meta: { total: 0, page: 1, pageSize: 0, totalPages: 0 } }),
    safe(getCategories(), []),
  ]);
  await safe(getBanners(), []);

  const topCategories = categories.slice(0, 6);

  return (
    <div>
      <Hero />

      {/* Category highlights */}
      <section className="container-x py-14">
        <h2 className="mb-6 font-serif text-2xl font-bold">Shop by Category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {topCategories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-brand-100"
            >
              {c.image && (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="200px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
              <span className="absolute bottom-3 left-3 text-sm font-semibold text-white">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-x py-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-2xl font-bold">Featured Products</h2>
          <Link href="/products?featured=true" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <ProductGrid products={featured.data} />
      </section>

      {/* New arrivals */}
      <section className="container-x py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-2xl font-bold">New Arrivals</h2>
          <Link href="/products?sort=newest" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <ProductGrid products={newArrivals.data} />
      </section>
    </div>
  );
}
