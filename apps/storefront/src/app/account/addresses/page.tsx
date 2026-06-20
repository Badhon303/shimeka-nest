'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { AddressView } from '@shimeka/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

const EMPTY = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  area: '',
  postalCode: '',
  isDefault: false,
};

export default function AddressesPage() {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<AddressView[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiFetch<AddressView[]>('/users/me/addresses', { token: token! })
      .then(setAddresses)
      .catch(() => setAddresses([]));
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/users/me/addresses', { method: 'POST', token: token!, body: JSON.stringify(form) });
      setForm(EMPTY);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add address');
    }
  };

  const remove = async (id: string) => {
    await apiFetch(`/users/me/addresses/${id}`, { method: 'DELETE', token: token! });
    load();
  };

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        {addresses.length === 0 && <p className="text-sm text-ink/50">No saved addresses yet.</p>}
        {addresses.map((a) => (
          <div key={a.id} className="card flex items-start justify-between p-4">
            <div className="text-sm">
              <p className="font-medium">
                {a.fullName} {a.isDefault && <span className="badge bg-brand-50 text-brand-700">Default</span>}
              </p>
              <p className="text-ink/60">{a.phone}</p>
              <p className="text-ink/60">
                {a.addressLine1}{a.area ? `, ${a.area}` : ''}, {a.city} {a.postalCode}
              </p>
            </div>
            <button onClick={() => remove(a.id)} className="text-ink/40 hover:text-red-500">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Add a new address</h2>
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <input className="input" placeholder="Full name *" value={form.fullName} onChange={set('fullName')} />
          <input className="input" placeholder="Phone *" value={form.phone} onChange={set('phone')} />
          <input className="input sm:col-span-2" placeholder="Address line 1 *" value={form.addressLine1} onChange={set('addressLine1')} />
          <input className="input sm:col-span-2" placeholder="Address line 2" value={form.addressLine2} onChange={set('addressLine2')} />
          <input className="input" placeholder="City *" value={form.city} onChange={set('city')} />
          <input className="input" placeholder="Area" value={form.area} onChange={set('area')} />
          <input className="input" placeholder="Postal code" value={form.postalCode} onChange={set('postalCode')} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Set as default
          </label>
          {error && <p className="text-sm text-red-500 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button className="btn-primary">Add address</button>
          </div>
        </form>
      </section>
    </div>
  );
}
