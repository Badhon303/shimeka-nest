import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-brand-100 bg-white">
      <div className="container-x grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <h3 className="font-serif text-xl font-bold text-brand-700">Shimeka</h3>
          <p className="mt-2 text-sm text-ink/60">
            Beauty &amp; Style, Delivered. Curated makeup and clothing for the modern woman.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Shop</h4>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><Link href="/category/makeup" className="hover:text-brand-700">Makeup</Link></li>
            <li><Link href="/category/clothing" className="hover:text-brand-700">Clothing</Link></li>
            <li><Link href="/products?sort=newest" className="hover:text-brand-700">New Arrivals</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Help</h4>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><Link href="/pages/shipping" className="hover:text-brand-700">Shipping Policy</Link></li>
            <li><Link href="/pages/returns" className="hover:text-brand-700">Return Policy</Link></li>
            <li><Link href="/order-lookup" className="hover:text-brand-700">Track Order</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><Link href="/pages/about" className="hover:text-brand-700">About Us</Link></li>
            <li><span className="text-ink/40">Inside Dhaka ৳60 · Outside ৳100</span></li>
            <li><span className="text-ink/40">COD · bKash · Nagad · Bank</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-100 py-4 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} Shimeka. All rights reserved.
      </div>
    </footer>
  );
}
