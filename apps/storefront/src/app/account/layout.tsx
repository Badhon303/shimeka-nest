'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Heart, LogOut, MapPin, Package, User } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/account', label: 'Profile', icon: User },
  { href: '/account/orders', label: 'My Orders', icon: Package },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  if (!ready || !user) {
    return <div className="container-x py-20 text-center text-ink/50">Loading...</div>;
  }

  return (
    <div className="container-x py-10">
      <h1 className="mb-6 font-serif text-3xl font-bold">My Account</h1>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="card h-fit p-3">
          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                    active ? 'bg-brand-50 text-brand-700' : 'text-ink/70 hover:bg-brand-50',
                  )}
                >
                  <Icon size={18} /> {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
            >
              <LogOut size={18} /> Log out
            </button>
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
