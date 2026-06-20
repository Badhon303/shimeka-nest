'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CouponForm } from '@/components/coupon-form';
import type { CouponView } from '@shimeka/shared';

export default function EditCouponPage() {
  const { id } = useParams<{ id: string }>();
  const [coupon, setCoupon] = useState<CouponView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<CouponView[]>('/admin/coupons')
      .then((all) => setCoupon(all.find((c) => c.id === id) ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>;
  }

  if (!coupon) {
    return <p className="text-center text-ink/50 py-20">Coupon not found</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Edit Coupon</h1>
      <CouponForm coupon={coupon} />
    </div>
  );
}
