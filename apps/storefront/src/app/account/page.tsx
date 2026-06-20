'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export default function ProfilePage() {
  const { token, user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) setForm({ name: user.name ?? '', email: user.email ?? '', phone: user.phone ?? '' });
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await apiFetch('/users/me', { method: 'PATCH', token: token!, body: JSON.stringify(form) });
      await refreshUser();
      setMsg('Profile updated.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    try {
      await apiFetch('/users/me/change-password', {
        method: 'POST',
        token: token!,
        body: JSON.stringify(pwd),
      });
      setPwd({ currentPassword: '', newPassword: '' });
      setPwdMsg('Password changed.');
    } catch (e) {
      setPwdMsg(e instanceof Error ? e.message : 'Change failed');
    }
  };

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Profile Details</h2>
        <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">
          <input className="input sm:col-span-2" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <div className="sm:col-span-2">
            <button className="btn-primary">Save changes</button>
            {msg && <span className="ml-3 text-sm text-brand-600">{msg}</span>}
          </div>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Change Password</h2>
        <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-2">
          <input className="input" type="password" placeholder="Current password" value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} />
          <input className="input" type="password" placeholder="New password" value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} />
          <div className="sm:col-span-2">
            <button className="btn-primary">Update password</button>
            {pwdMsg && <span className="ml-3 text-sm text-brand-600">{pwdMsg}</span>}
          </div>
        </form>
      </section>
    </div>
  );
}
