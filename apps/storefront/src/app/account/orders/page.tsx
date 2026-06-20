'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { OrderView, Paginated } from '@shimeka/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { formatBDT, formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-600',
  RETURNED: 'bg-red-50 text-red-600',
  PENDING: 'bg-amber-50 text-amber-700',
};

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiFetch<Paginated<OrderView>>('/orders/mine', { token })
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-ink/50">Loading orders...</div>;

  if (orders.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-ink/60">You have no orders yet.</p>
        <Link href="/products" className="btn-primary mt-4 inline-flex">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-brand-700">{o.orderNumber}</p>
              <p className="text-xs text-ink/50">{formatDate(o.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${STATUS_COLORS[o.deliveryStatus] ?? 'bg-brand-50 text-brand-700'}`}>
                {o.deliveryStatus}
              </span>
              <span className="badge bg-brand-50 text-brand-700">{o.paymentStatus}</span>
            </div>
          </div>
          <div className="mt-3 text-sm text-ink/70">
            {o.items.map((i) => (
              <span key={i.id}>
                {i.productNameSnapshot} × {i.quantity}
                {o.items.indexOf(i) < o.items.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-semibold">{formatBDT(o.total)}</span>
            <Link
              href={`/order-confirmation/${o.orderNumber}`}
              className="text-sm text-brand-600 hover:underline"
            >
              View details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
