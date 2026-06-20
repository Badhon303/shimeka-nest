'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProductView } from '@shimeka/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { ProductGrid } from '@/components/product-grid';

export default function WishlistPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiFetch<ProductView[]>('/wishlist', { token })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-ink/50">Loading wishlist...</div>;

  if (products.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-ink/60">Your wishlist is empty.</p>
        <Link href="/products" className="btn-primary mt-4 inline-flex">Discover products</Link>
      </div>
    );
  }

  return <ProductGrid products={products} />;
}
