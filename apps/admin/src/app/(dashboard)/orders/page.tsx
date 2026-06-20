'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatBDT, formatDateTime } from '@/lib/utils';
import type { Paginated, OrderView } from '@shimeka/shared';
import { Search } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  function load(page = 1) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (search) params.set('search', search);
    if (statusFilter) params.set('deliveryStatus', statusFilter);
    api<Paginated<OrderView>>(`/admin/orders?${params}`)
      .then((res) => {
        setOrders(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(1);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Orders</h1>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            className="input pl-9"
            placeholder="Search by order # or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); }}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button type="submit" className="btn-outline">Filter</button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="th">Order #</th>
                <th className="th">Customer</th>
                <th className="th">Total</th>
                <th className="th">Payment</th>
                <th className="th">Delivery</th>
                <th className="th">Date</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="td text-center py-10"><div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="td text-center text-ink/50 py-10">No orders found</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="td font-medium">{o.orderNumber}</td>
                    <td className="td">{o.guestPhone ?? o.guestEmail ?? '—'}</td>
                    <td className="td">{formatBDT(o.total)}</td>
                    <td className="td">
                      <span className={`badge ${o.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="td">
                      <span className={`badge ${o.deliveryStatus === 'DELIVERED' ? 'bg-green-50 text-green-700' : o.deliveryStatus === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {o.deliveryStatus}
                      </span>
                    </td>
                    <td className="td text-ink/60">{formatDateTime(o.createdAt)}</td>
                    <td className="td">
                      <Link href={`/orders/${o.id}`} className="text-sm text-brand-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-ink/60">{meta.total} orders total</p>
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
