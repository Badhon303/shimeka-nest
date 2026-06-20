import Link from 'next/link';
import type { Metadata } from 'next';
import { Filters } from '@/components/filters';
import { ProductGrid } from '@/components/product-grid';
import { getCategory, getProducts } from '@/lib/api';

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const category = await getCategory(params.slug);
    return {
      title: category.name,
      description: `Shop ${category.name} at Shimeka — curated ${category.type.toLowerCase()} products delivered across Bangladesh.`,
      openGraph: { title: `${category.name} | Shimeka`, images: category.image ? [category.image] : [] },
    };
  } catch {
    return { title: 'Category' };
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: SearchParams;
}) {
  let category;
  try {
    category = await getCategory(params.slug);
  } catch {
    return (
      <div className="container-x py-20 text-center text-ink/60">Category not found.</div>
    );
  }

  const q = new URLSearchParams();
  q.set('category', params.slug);
  q.set('pageSize', '12');
  for (const key of ['minPrice', 'maxPrice', 'sort', 'inStock', 'page']) {
    const v = searchParams[key];
    if (typeof v === 'string' && v) q.set(key, v);
  }

  let result;
  try {
    result = await getProducts(q.toString());
  } catch {
    result = { data: [], meta: { total: 0, page: 1, pageSize: 12, totalPages: 1 } };
  }

  return (
    <div className="container-x py-10">
      <nav className="mb-3 text-sm text-ink/50">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{category.name}</span>
      </nav>
      <h1 className="mb-2 font-serif text-3xl font-bold">{category.name}</h1>

      {category.children && category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="badge bg-brand-50 text-brand-700 hover:bg-brand-100">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="card h-fit p-5">
          <Filters />
        </aside>
        <div>
          <p className="mb-6 text-sm text-ink/60">{result.meta.total} products</p>
          <ProductGrid products={result.data} />
        </div>
      </div>
    </div>
  );
}
