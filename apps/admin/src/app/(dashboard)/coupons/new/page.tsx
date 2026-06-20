'use client';

import { CouponForm } from '@/components/coupon-form';

export default function NewCouponPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Add Coupon</h1>
      <CouponForm />
    </div>
  );
}
