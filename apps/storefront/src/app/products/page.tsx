import Link from 'next/link';
import type { Metadata } from 'next';
import { Filters } from '@/components/filters';
import { ProductGrid } from '@/components/product-grid';
import { getProducts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse all makeup and clothing products at Shimeka.',
};

type SearchParams = Record<string, string | string[] | undefined>;

function buildQuery(sp: SearchParams): string {
  const allowed = ['category', 'search', 'minPrice', 'maxPrice', 'sort', 'inStock', 'featured', 'page'];
  const q = new URLSearchParams();
  for (const key of allowed) {
    const v = sp[key];
    if (typeof v === 'string' && v) q.set(key, v);
  }
  q.set('pageSize', '12');
  return q.toString();
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = buildQuery(searchParams);
  let result;
  try {
    result = await getProducts(query);
  } catch {
    result = { data: [], meta: { total: 0, page: 1, pageSize: 12, totalPages: 1 } };
  }

  const page = result.meta.page;
  const totalPages = result.meta.totalPages;
  const baseParams = new URLSearchParams(query);

  const pageLink = (p: number) => {
    const next = new URLSearchParams(baseParams.toString());
    next.set('page', String(p));
    return `/products?${next.toString()}`;
  };

  return (
    <div className="container-x py-10">
      <h1 className="mb-2 font-serif text-3xl font-bold">All Products</h1>
      <p className="mb-8 text-sm text-ink/60">{result.meta.total} products</p>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="card h-fit p-5">
          <Filters />
        </aside>

        <div>
          <ProductGrid products={result.data} />

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageLink(p)}
                  className={
                    p === page
                      ? 'btn-primary px-4 py-2'
                      : 'btn-outline px-4 py-2'
                  }
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
