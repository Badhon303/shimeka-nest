'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { formatBDT } from '@/lib/utils';

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart();

  if (loading) {
    return <div className="container-x py-20 text-center text-ink/50">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="font-serif text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-ink/60">Start shopping to add items to your cart.</p>
        <Link href="/products" className="btn-primary mt-6 inline-flex">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 font-serif text-3xl font-bold">Shopping Cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="card flex gap-4 p-4">
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-brand-50">
                {item.image && (
                  <Image src={item.image} alt={item.productName} fill sizes="96px" className="object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <Link href={`/product/${item.productSlug}`} className="font-medium hover:text-brand-700">
                  {item.productName}
                </Link>
                {item.variantLabel && (
                  <p className="text-sm text-ink/50">{item.variantLabel}</p>
                )}
                <p className="mt-1 font-semibold text-brand-700">{formatBDT(item.unitPrice)}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-brand-200">
                    <button onClick={() => updateItem(item.id, item.quantity - 1)} className="p-2">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateItem(item.id, Math.min(item.stockQuantity, item.quantity + 1))}
                      className="p-2"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-ink/40 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="hidden font-semibold sm:block">
                {formatBDT(item.unitPrice * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <div className="card h-fit p-6">
          <h2 className="mb-4 font-semibold">Order Summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-ink/60">Subtotal</span>
            <span className="font-medium">{formatBDT(cart.subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-ink/50">Shipping calculated at checkout.</p>
          <Link href="/checkout" className="btn-primary mt-6 w-full">
            Proceed to Checkout
          </Link>
          <Link href="/products" className="btn-ghost mt-2 w-full">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
