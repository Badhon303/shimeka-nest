import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductDetail } from '@/components/product-detail';
import { ReviewsSection } from '@/components/reviews-section';
import { ProductGrid } from '@/components/product-grid';
import { getProduct, getProductReviews, getRelated } from '@/lib/api';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const product = await getProduct(params.slug);
    const desc = product.description?.slice(0, 160) ?? `Buy ${product.name} at Shimeka.`;
    return {
      title: product.name,
      description: desc,
      openGraph: {
        title: product.name,
        description: desc,
        type: 'website',
        images: product.thumbnailImage ? [product.thumbnailImage] : [],
      },
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  let product;
  try {
    product = await getProduct(params.slug);
  } catch {
    return <div className="container-x py-20 text-center text-ink/60">Product not found.</div>;
  }

  const [related, reviews] = await Promise.all([
    getRelated(params.slug).catch(() => []),
    getProductReviews(product.id).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, pageSize: 0, totalPages: 0 },
    })),
  ]);

  // JSON-LD for SEO.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: product.thumbnailImage ?? undefined,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'BDT',
      lowPrice: Math.min(...product.variants.map((v) => v.price), product.basePrice),
      availability: product.variants.some((v) => v.stockQuantity > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="container-x py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-6 text-sm text-ink/50">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="mx-2">/</span>
        {product.category && (
          <>
            <Link href={`/category/${product.category.slug}`} className="hover:text-brand-600">
              {product.category.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-ink">{product.name}</span>
      </nav>

      <ProductDetail product={product} />

      <ReviewsSection productId={product.id} initialReviews={reviews.data} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-serif text-2xl font-bold">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
