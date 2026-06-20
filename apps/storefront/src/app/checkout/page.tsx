'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  PaymentMethod,
  PAYMENT_INSTRUCTIONS,
  SHIPPING_ZONES,
  type AddressView,
} from '@shimeka/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { cn, formatBDT } from '@/lib/utils';

const PAYMENT_OPTIONS = [
  { value: PaymentMethod.COD, ...PAYMENT_INSTRUCTIONS.COD },
  { value: PaymentMethod.BANK_TRANSFER, ...PAYMENT_INSTRUCTIONS.BANK_TRANSFER },
  { value: PaymentMethod.MOBILE_BANKING, ...PAYMENT_INSTRUCTIONS.MOBILE_BANKING },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { cart, loading, refresh } = useCart();

  const [savedAddresses, setSavedAddresses] = useState<AddressView[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [zone, setZone] = useState<string>(SHIPPING_ZONES[0].id);
  const [paymentMethod, setPaymentMethod] = useState<string>(PaymentMethod.COD);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    area: '',
    postalCode: '',
  });

  useEffect(() => {
    if (token) {
      apiFetch<AddressView[]>('/users/me/addresses', { token })
        .then((addrs) => {
          setSavedAddresses(addrs);
          const def = addrs.find((a) => a.isDefault) ?? addrs[0];
          if (def) setSelectedAddressId(def.id);
        })
        .catch(() => undefined);
    }
  }, [token]);

  const subtotal = cart?.subtotal ?? 0;
  const shippingFee = SHIPPING_ZONES.find((z) => z.id === zone)?.fee ?? 0;
  const total = Math.max(0, subtotal - discount) + shippingFee;

  const applyCoupon = async () => {
    setCouponMsg(null);
    if (!couponCode.trim()) return;
    try {
      const res = await apiFetch<{ discount: number }>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      setDiscount(res.discount);
      setCouponMsg(`Coupon applied — you saved ${formatBDT(res.discount)}`);
    } catch (e) {
      setDiscount(0);
      setCouponMsg(e instanceof Error ? e.message : 'Invalid coupon');
    }
  };

  const placeOrder = async () => {
    setError(null);
    if (!cart || cart.items.length === 0) {
      setError('Your cart is empty');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        items: cart.items.map((i) => ({ productVariantId: i.productVariantId, quantity: i.quantity })),
        paymentMethod,
        shippingZone: zone,
        couponCode: couponCode.trim() || undefined,
      };

      if (token && selectedAddressId) {
        body.addressId = selectedAddressId;
      } else {
        body.shippingAddress = {
          fullName: form.fullName,
          phone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || undefined,
          city: form.city,
          area: form.area || undefined,
          postalCode: form.postalCode || undefined,
        };
        if (!token) {
          body.guestEmail = form.email || undefined;
          body.guestPhone = form.phone;
        }
      }

      const order = await apiFetch<{ orderNumber: string }>('/orders', {
        method: 'POST',
        token: token ?? undefined,
        sessionId: token ? undefined : (typeof window !== 'undefined' ? localStorage.getItem('shimeka_cart_session') ?? undefined : undefined),
        body: JSON.stringify(body),
      });
      await refresh();
      const contact = token ? '' : `?contact=${encodeURIComponent(form.phone)}`;
      router.push(`/order-confirmation/${order.orderNumber}${contact}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container-x py-20 text-center text-ink/50">Loading...</div>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-x py-20 text-center">
        <p className="text-ink/60">Your cart is empty.</p>
      </div>
    );
  }

  const useSaved = !!(token && selectedAddressId && savedAddresses.length > 0);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 font-serif text-3xl font-bold">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* Address */}
          <section className="card p-6">
            <h2 className="mb-4 font-semibold">Shipping Address</h2>
            {token && savedAddresses.length > 0 && (
              <div className="mb-4 space-y-2">
                {savedAddresses.map((a) => (
                  <label
                    key={a.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3',
                      selectedAddressId === a.id ? 'border-brand-500 bg-brand-50' : 'border-brand-100',
                    )}
                  >
                    <input
                      type="radio"
                      checked={selectedAddressId === a.id}
                      onChange={() => setSelectedAddressId(a.id)}
                      className="mt-1"
                    />
                    <span className="text-sm">
                      <strong>{a.fullName}</strong> · {a.phone}
                      <br />
                      {a.addressLine1}, {a.area ? `${a.area}, ` : ''}{a.city}
                    </span>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedAddressId('')}
                  className="text-sm text-brand-600 hover:underline"
                >
                  + Use a new address
                </button>
              </div>
            )}

            {!useSaved && (
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input" placeholder="Full name *" value={form.fullName} onChange={set('fullName')} />
                <input className="input" placeholder="Phone *" value={form.phone} onChange={set('phone')} />
                {!token && (
                  <input className="input sm:col-span-2" placeholder="Email (optional)" value={form.email} onChange={set('email')} />
                )}
                <input className="input sm:col-span-2" placeholder="Address line 1 *" value={form.addressLine1} onChange={set('addressLine1')} />
                <input className="input sm:col-span-2" placeholder="Address line 2" value={form.addressLine2} onChange={set('addressLine2')} />
                <input className="input" placeholder="City *" value={form.city} onChange={set('city')} />
                <input className="input" placeholder="Area" value={form.area} onChange={set('area')} />
                <input className="input" placeholder="Postal code" value={form.postalCode} onChange={set('postalCode')} />
              </div>
            )}
          </section>

          {/* Shipping zone */}
          <section className="card p-6">
            <h2 className="mb-4 font-semibold">Delivery</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SHIPPING_ZONES.map((z) => (
                <label
                  key={z.id}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm',
                    zone === z.id ? 'border-brand-500 bg-brand-50' : 'border-brand-100',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <input type="radio" checked={zone === z.id} onChange={() => setZone(z.id)} />
                    {z.label}
                  </span>
                  <span className="font-medium">{formatBDT(z.fee)}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="card p-6">
            <h2 className="mb-4 font-semibold">Payment Method</h2>
            <div className="space-y-3">
              {PAYMENT_OPTIONS.map((opt) => (
                <div key={opt.value}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm',
                      paymentMethod === opt.value ? 'border-brand-500 bg-brand-50' : 'border-brand-100',
                    )}
                  >
                    <input
                      type="radio"
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)}
                    />
                    <span>
                      <strong>{opt.label}</strong>
                      <br />
                      <span className="text-ink/60">{opt.description}</span>
                    </span>
                  </label>
                  {paymentMethod === opt.value && 'details' in opt && opt.details && (
                    <div className="mt-2 rounded-xl bg-brand-50 p-3 text-sm">
                      {opt.details.map((d) => (
                        <div key={d.label} className="flex justify-between">
                          <span className="text-ink/60">{d.label}</span>
                          <span className="font-medium">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="card h-fit p-6">
          <h2 className="mb-4 font-semibold">Order Summary</h2>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {cart.items.map((i) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-ink/70">
                  {i.productName} × {i.quantity}
                </span>
                <span>{formatBDT(i.unitPrice * i.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              className="input"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button onClick={applyCoupon} className="btn-outline whitespace-nowrap">Apply</button>
          </div>
          {couponMsg && <p className="mt-2 text-xs text-brand-600">{couponMsg}</p>}

          <div className="mt-4 space-y-2 border-t border-brand-100 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-ink/60">Subtotal</span><span>{formatBDT(subtotal)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatBDT(discount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-ink/60">Shipping</span><span>{formatBDT(shippingFee)}</span></div>
            <div className="flex justify-between border-t border-brand-100 pt-2 text-base font-bold">
              <span>Total</span><span className="text-brand-700">{formatBDT(total)}</span>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <button onClick={placeOrder} disabled={submitting} className="btn-primary mt-5 w-full">
            {submitting ? 'Placing order...' : 'Place Order'}
          </button>
          {!user && (
            <p className="mt-3 text-center text-xs text-ink/50">
              Checking out as guest. Your phone is used to track the order.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
