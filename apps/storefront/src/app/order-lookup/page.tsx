'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OrderLookupPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim() && contact.trim()) {
      router.push(
        `/order-confirmation/${orderNumber.trim()}?contact=${encodeURIComponent(contact.trim())}`,
      );
    }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-serif text-2xl font-bold">Track your order</h1>
        <p className="mt-1 text-sm text-ink/60">
          Enter your order number and the phone/email used at checkout.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            className="input"
            placeholder="Order number (e.g. SHM-20260619-1234)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
          <input
            className="input"
            placeholder="Phone or email"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <button type="submit" className="btn-primary w-full">Track Order</button>
        </form>
      </div>
    </div>
  );
}
