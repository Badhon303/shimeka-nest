'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({
        name: form.name || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        password: form.password,
      });
      router.push('/account');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-serif text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-ink/60">Join Shimeka for faster checkout and order tracking.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="input" placeholder="Full name" value={form.name} onChange={set('name')} />
          <input className="input" placeholder="Email" value={form.email} onChange={set('email')} />
          <input className="input" placeholder="Phone" value={form.phone} onChange={set('phone')} />
          <input
            className="input"
            type="password"
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={set('password')}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink/60">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
