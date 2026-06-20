'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { Paginated, UserView } from '@shimeka/shared';
import { Search } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<UserView[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  function load(page = 1) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (search) params.set('search', search);
    api<Paginated<UserView>>(`/admin/users/customers?${params}`)
      .then((res) => {
        setCustomers(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(1);
  }

  async function toggleBlock(user: UserView) {
    const action = user.isBlocked ? 'unblock' : 'block';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.name ?? user.email}?`)) return;
    await api(`/admin/users/customers/${user.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked: !user.isBlocked }),
    });
    load(meta.page);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Customers</h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            className="input pl-9"
            placeholder="Search customers…"
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
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Phone</th>
                <th className="th">Status</th>
                <th className="th">Joined</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="td text-center py-10"><div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="td text-center text-ink/50 py-10">No customers found</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="td font-medium">{c.name ?? '—'}</td>
                    <td className="td">{c.email ?? '—'}</td>
                    <td className="td">{c.phone ?? '—'}</td>
                    <td className="td">
                      <span className={`badge ${c.isBlocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {c.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="td text-ink/60">{formatDateTime(c.createdAt)}</td>
                    <td className="td">
                      <button
                        onClick={() => toggleBlock(c)}
                        className={`text-sm ${c.isBlocked ? 'text-green-600 hover:underline' : 'text-red-600 hover:underline'}`}
                      >
                        {c.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-ink/60">{meta.total} customers total</p>
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
