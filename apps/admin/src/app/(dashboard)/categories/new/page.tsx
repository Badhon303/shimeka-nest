'use client';

import { CategoryForm } from '@/components/category-form';

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Add Category</h1>
      <CategoryForm />
    </div>
  );
}
