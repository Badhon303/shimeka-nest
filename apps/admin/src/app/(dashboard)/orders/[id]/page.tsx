'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatBDT, formatDateTime } from '@/lib/utils';
import type { OrderView } from '@shimeka/shared';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update state
  const [paymentStatus, setPaymentStatus] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<OrderView>(`/admin/orders/${id}`)
      .then((o) => {
        setOrder(o);
        setPaymentStatus(o.paymentStatus);
        setDeliveryStatus(o.deliveryStatus);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function updatePayment() {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await api<OrderView>(`/admin/orders/${id}/payment-status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: paymentStatus }),
      });
      setOrder(updated);
    } finally {
      setSaving(false);
    }
  }

  async function updateDelivery() {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await api<OrderView>(`/admin/orders/${id}/delivery-status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: deliveryStatus }),
      });
      setOrder(updated);
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!order || !note.trim()) return;
    setSaving(true);
    try {
      const updated = await api<OrderView>(`/admin/orders/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
      setOrder(updated);
      setNote('');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>;
  }

  if (!order) {
    return <p className="text-center text-ink/50 py-20">Order not found</p>;
  }

  const addr = order.shippingAddress;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Order #{order.orderNumber}</h1>
        <span className="text-sm text-ink/60">{formatDateTime(order.createdAt)}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold">Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="th">Product</th>
                    <th className="th">Variant</th>
                    <th className="th">Price</th>
                    <th className="th">Qty</th>
                    <th className="th">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="td font-medium">{item.productNameSnapshot}</td>
                      <td className="td text-ink/60">{item.variantLabelSnapshot ?? '—'}</td>
                      <td className="td">{formatBDT(item.priceSnapshot)}</td>
                      <td className="td">{item.quantity}</td>
                      <td className="td font-medium">{formatBDT(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-6 py-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatBDT(order.subtotal)}</span></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount ({order.couponCode})</span><span>-{formatBDT(order.discountAmount)}</span></div>
              )}
              <div className="flex justify-between"><span>Shipping</span><span>{formatBDT(order.shippingFee)}</span></div>
              <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2"><span>Total</span><span>{formatBDT(order.total)}</span></div>
            </div>
          </div>

          {/* Status logs */}
          {order.statusLogs && order.statusLogs.length > 0 && (
            <div className="card p-6">
              <h2 className="mb-4 font-semibold">Status History</h2>
              <div className="space-y-3">
                {order.statusLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                    <div>
                      <p>
                        <span className="font-medium">{log.field}</span>:{' '}
                        <span className="text-ink/60">{log.oldValue ?? '—'}</span>
                        {' → '}
                        <span className="font-medium">{log.newValue}</span>
                      </p>
                      <p className="text-xs text-ink/50">
                        {log.changedByName ?? 'System'} · {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="card p-6">
            <h2 className="mb-4 font-semibold">Notes</h2>
            {order.notes && order.notes.length > 0 && (
              <div className="mb-4 space-y-2">
                {order.notes.map((n) => (
                  <div key={n.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                    <p>{n.note}</p>
                    <p className="mt-1 text-xs text-ink/50">{n.authorName ?? 'Admin'} · {formatDateTime(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} />
              <button onClick={addNote} disabled={saving || !note.trim()} className="btn-outline">Add</button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="card p-6">
            <h2 className="mb-3 font-semibold">Customer</h2>
            <div className="space-y-1 text-sm">
              <p><span className="text-ink/60">Phone:</span> {order.guestPhone ?? '—'}</p>
              <p><span className="text-ink/60">Email:</span> {order.guestEmail ?? '—'}</p>
            </div>
          </div>

          {/* Shipping address */}
          <div className="card p-6">
            <h2 className="mb-3 font-semibold">Shipping Address</h2>
            <div className="text-sm space-y-1">
              <p className="font-medium">{addr.fullName}</p>
              <p>{addr.phone}</p>
              <p>{addr.addressLine1}</p>
              {'addressLine2' in addr && addr.addressLine2 && <p>{addr.addressLine2}</p>}
              <p>{addr.city}{addr.area ? `, ${addr.area}` : ''}</p>
            </div>
          </div>

          {/* Payment status update */}
          <div className="card p-6">
            <h2 className="mb-3 font-semibold">Payment Status</h2>
            <div className="flex gap-2">
              <select className="input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <button onClick={updatePayment} disabled={saving || paymentStatus === order.paymentStatus} className="btn-primary text-xs">
                Update
              </button>
            </div>
          </div>

          {/* Delivery status update */}
          <div className="card p-6">
            <h2 className="mb-3 font-semibold">Delivery Status</h2>
            <div className="flex gap-2">
              <select className="input" value={deliveryStatus} onChange={(e) => setDeliveryStatus(e.target.value)}>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button onClick={updateDelivery} disabled={saving || deliveryStatus === order.deliveryStatus} className="btn-primary text-xs">
                Update
              </button>
            </div>
          </div>

          {/* Payment method */}
          <div className="card p-6">
            <h2 className="mb-3 font-semibold">Payment Method</h2>
            <span className="badge bg-gray-100 text-gray-700">{order.paymentMethod}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
