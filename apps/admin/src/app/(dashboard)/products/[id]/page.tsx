'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ProductForm } from '@/components/product-form';
import type { ProductView } from '@shimeka/shared';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<ProductView>(`/admin/products/${id}`)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>;
  }

  if (!product) {
    return <p className="text-center text-ink/50 py-20">Product not found</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  );
}
