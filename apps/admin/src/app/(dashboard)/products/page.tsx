'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatBDT } from '@/lib/utils';
import type { Paginated, ProductView } from '@shimeka/shared';
import { Plus, Search } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductView[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  function load(page = 1, q = search) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (q) params.set('search', q);
    api<Paginated<ProductView>>(`/admin/products?${params}`)
      .then((res) => {
        setProducts(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(1, search);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-ink">Products</h1>
        <Link href="/products/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            className="input pl-9"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-outline">Search</button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="th">Image</th>
                <th className="th">Name</th>
                <th className="th">Category</th>
                <th className="th">Price</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="td text-center py-10"><div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="td text-center text-ink/50 py-10">No products found</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="td">
                      {p.thumbnailImage ? (
                        <img src={p.thumbnailImage} alt="" className="h-10 w-10 rounded-md object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-100" />
                      )}
                    </td>
                    <td className="td font-medium">{p.name}</td>
                    <td className="td text-ink/60">{p.category?.name ?? '—'}</td>
                    <td className="td">{formatBDT(p.basePrice)}</td>
                    <td className="td">
                      <span className={`badge ${p.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="td">
                      <Link href={`/products/${p.id}`} className="text-sm text-brand-600 hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-ink/60">{meta.total} products total</p>
            <div className="flex gap-1">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                <button
                  key={p}
                  onClick={() => load(p)}
                  className={`rounded px-3 py-1 text-sm ${p === meta.page ? 'bg-brand-600 text-white' : 'hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
