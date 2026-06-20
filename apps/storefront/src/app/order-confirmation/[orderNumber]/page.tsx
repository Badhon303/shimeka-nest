'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { OrderView } from '@shimeka/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { formatBDT } from '@/lib/utils';

export default function OrderConfirmationPage() {
  const params = useParams<{ orderNumber: string }>();
  const search = useSearchParams();
  const { token, ready } = useAuth();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const orderNumber = params.orderNumber;
    const contact = search.get('contact');
    const load = token
      ? apiFetch<OrderView>(`/orders/mine/${orderNumber}`, { token })
      : apiFetch<OrderView>(
          `/orders/lookup?orderNumber=${encodeURIComponent(orderNumber)}&contact=${encodeURIComponent(contact ?? '')}`,
        );
    load.then(setOrder).catch((e) => setError(e instanceof Error ? e.message : 'Order not found'));
  }, [ready, token, params.orderNumber, search]);

  if (error) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="font-serif text-2xl font-bold">Order placed!</h1>
        <p className="mt-2 text-ink/60">
          Your order <strong>{params.orderNumber}</strong> was received. {error}
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">Continue shopping</Link>
      </div>
    );
  }

  if (!order) {
    return <div className="container-x py-20 text-center text-ink/50">Loading order...</div>;
  }

  const addr = order.shippingAddress as any;

  return (
    <div className="container-x max-w-2xl py-14">
      <div className="text-center">
        <CheckCircle2 className="mx-auto text-green-500" size={56} />
        <h1 className="mt-4 font-serif text-3xl font-bold">Thank you for your order!</h1>
        <p className="mt-2 text-ink/60">
          Order number <strong className="text-brand-700">{order.orderNumber}</strong>
        </p>
      </div>

      <div className="card mt-8 p-6">
        <div className="space-y-2">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between text-sm">
              <span className="text-ink/70">
                {i.productNameSnapshot}
                {i.variantLabelSnapshot ? ` (${i.variantLabelSnapshot})` : ''} × {i.quantity}
              </span>
              <span>{formatBDT(i.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-brand-100 pt-4 text-sm">
          <div className="flex justify-between"><span className="text-ink/60">Subtotal</span><span>{formatBDT(order.subtotal)}</span></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatBDT(order.discountAmount)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-ink/60">Shipping</span><span>{formatBDT(order.shippingFee)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Total</span><span className="text-brand-700">{formatBDT(order.total)}</span></div>
        </div>
        <div className="mt-4 border-t border-brand-100 pt-4 text-sm text-ink/70">
          <p><strong>Payment:</strong> {order.paymentMethod} · {order.paymentStatus}</p>
          <p><strong>Delivery:</strong> {order.deliveryStatus}</p>
          <p className="mt-2">
            <strong>Ship to:</strong> {addr?.fullName}, {addr?.addressLine1}, {addr?.city}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link href="/products" className="btn-outline">Continue shopping</Link>
        {token && <Link href="/account/orders" className="btn-primary">View my orders</Link>}
      </div>
    </div>
  );
}
