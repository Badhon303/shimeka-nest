'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { CouponView } from '@shimeka/shared';

interface Props {
  coupon?: CouponView;
}

export function CouponForm({ coupon }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [code, setCode] = useState(coupon?.code ?? '');
  const [type, setType] = useState<string>(coupon?.type ?? 'PERCENTAGE');
  const [value, setValue] = useState(String(coupon?.value ?? ''));
  const [minOrderValue, setMinOrderValue] = useState(String(coupon?.minOrderValue ?? ''));
  const [maxUses, setMaxUses] = useState(String(coupon?.maxUses ?? ''));
  const [expiresAt, setExpiresAt] = useState(coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : '');
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = {
        code: code.toUpperCase(),
        type,
        value: Number(value),
        minOrderValue: minOrderValue ? Number(minOrderValue) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive,
      };

      if (coupon) {
        await api(`/admin/coupons/${coupon.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await api('/admin/coupons', { method: 'POST', body: JSON.stringify(body) });
      }

      router.push('/coupons');
    } catch (err: any) {
      setError(err.message ?? 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl space-y-6 p-6">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="label">Code</label>
          <input
            className="input font-mono uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed Amount</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label className="label">Value {type === 'PERCENTAGE' ? '(%)' : '(৳)'}</label>
          <input
            type="number"
            className="input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            min="0"
            required
          />
        </div>
        <div>
          <label className="label">Min Order (৳)</label>
          <input
            type="number"
            className="input"
            value={minOrderValue}
            onChange={(e) => setMinOrderValue(e.target.value)}
            min="0"
            placeholder="No minimum"
          />
        </div>
        <div>
          <label className="label">Max Uses</label>
          <input
            type="number"
            className="input"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            min="0"
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="label">Expires At</label>
          <input
            type="date"
            className="input"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-ink/80">Active</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : coupon ? 'Update Coupon' : 'Create Coupon'}
        </button>
        <button type="button" className="btn-outline" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
