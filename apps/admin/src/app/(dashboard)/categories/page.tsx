'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CategoryView } from '@shimeka/shared';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryView[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api<CategoryView[]>('/admin/categories')
      .then(setCategories)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return;
    await api(`/admin/categories/${id}`, { method: 'DELETE' });
    load();
  }

  function renderRows(cats: CategoryView[], depth = 0): React.ReactNode[] {
    const rows: React.ReactNode[] = [];
    for (const cat of cats) {
      rows.push(
        <tr key={cat.id} className="hover:bg-gray-50/50">
          <td className="td">
            <span style={{ paddingLeft: depth * 20 }} className="flex items-center gap-2">
              {cat.image && <img src={cat.image} alt="" className="h-8 w-8 rounded object-cover" />}
              <span className="font-medium">{cat.name}</span>
            </span>
          </td>
          <td className="td text-ink/60">{cat.slug}</td>
          <td className="td">
            <span className="badge bg-gray-100 text-gray-700">{cat.type}</span>
          </td>
          <td className="td">{cat.sortOrder}</td>
          <td className="td">
            <div className="flex gap-2">
              <Link href={`/categories/${cat.id}`} className="text-brand-600 hover:text-brand-700">
                <Pencil className="h-4 w-4" />
              </Link>
              <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      );
      if (cat.children?.length) {
        rows.push(...renderRows(cat.children, depth + 1));
      }
    }
    return rows;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Categories</h1>
        <Link href="/categories/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add Category
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">Slug</th>
                <th className="th">Type</th>
                <th className="th">Order</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="td text-center py-10"><div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={5} className="td text-center text-ink/50 py-10">No categories</td></tr>
              ) : (
                renderRows(categories)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
