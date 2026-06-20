'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Makeup', href: '/category/makeup' },
  { label: 'Clothing', href: '/category/clothing' },
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'All Products', href: '/products' },
];

export function Header() {
  const router = useRouter();
  const { itemCount } = useCart();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100/70 bg-cream/90 backdrop-blur">
      <div className="container-x flex h-16 items-center gap-4">
        <button
          className="md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-brand-700">
          Shimeka
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink/70 transition hover:text-brand-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 sm:block">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="input pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-2">
          <Link href={user ? '/account/wishlist' : '/login'} className="btn-ghost p-2" aria-label="Wishlist">
            <Heart size={20} />
          </Link>
          <Link href={user ? '/account' : '/login'} className="btn-ghost p-2" aria-label="Account">
            <User size={20} />
          </Link>
          <Link href="/cart" className="relative btn-ghost p-2" aria-label="Cart">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden border-t border-brand-100/70 bg-cream md:hidden',
          mobileOpen ? 'max-h-96' : 'max-h-0',
          'transition-[max-height] duration-300',
        )}
      >
        <div className="container-x flex flex-col gap-1 py-3">
          <form onSubmit={submitSearch} className="mb-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="input"
            />
          </form>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink/80 hover:bg-brand-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
