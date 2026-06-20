'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CategoryForm } from '@/components/category-form';
import type { CategoryView } from '@shimeka/shared';

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<CategoryView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<CategoryView[]>('/admin/categories')
      .then((cats) => {
        function find(list: CategoryView[]): CategoryView | null {
          for (const c of list) {
            if (c.id === id) return c;
            if (c.children?.length) {
              const found = find(c.children);
              if (found) return found;
            }
          }
          return null;
        }
        setCategory(find(cats));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>;
  }

  if (!category) {
    return <p className="text-center text-ink/50 py-20">Category not found</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Edit Category</h1>
      <CategoryForm category={category} />
    </div>
  );
}
