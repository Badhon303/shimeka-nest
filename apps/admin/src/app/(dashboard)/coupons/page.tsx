'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatBDT, formatDateTime } from '@/lib/utils';
import type { CouponView } from '@shimeka/shared';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponView[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api<CouponView[]>('/admin/coupons')
      .then(setCoupons)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon?')) return;
    await api(`/admin/coupons/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Coupons</h1>
        <Link href="/coupons/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add Coupon
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="th">Code</th>
                <th className="th">Type</th>
                <th className="th">Value</th>
                <th className="th">Min Order</th>
                <th className="th">Uses</th>
                <th className="th">Expires</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="td text-center py-10"><div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={8} className="td text-center text-ink/50 py-10">No coupons</td></tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="td font-mono font-medium">{c.code}</td>
                    <td className="td">{c.type}</td>
                    <td className="td">{c.type === 'PERCENTAGE' ? `${c.value}%` : formatBDT(c.value)}</td>
                    <td className="td">{c.minOrderValue ? formatBDT(c.minOrderValue) : '—'}</td>
                    <td className="td">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</td>
                    <td className="td text-ink/60">{c.expiresAt ? formatDateTime(c.expiresAt) : 'Never'}</td>
                    <td className="td">
                      <span className={`badge ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex gap-2">
                        <Link href={`/coupons/${c.id}`} className="text-brand-600 hover:text-brand-700">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
