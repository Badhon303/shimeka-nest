'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Popularity' },
];

export function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
      next.delete('page');
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Sort by</label>
        <select
          className="input"
          value={params.get('sort') ?? 'newest'}
          onChange={(e) => setParam('sort', e.target.value)}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Price range (৳)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={params.get('minPrice') ?? ''}
            className="input"
            onBlur={(e) => setParam('minPrice', e.target.value || null)}
          />
          <span className="text-ink/40">—</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={params.get('maxPrice') ?? ''}
            className="input"
            onBlur={(e) => setParam('maxPrice', e.target.value || null)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={params.get('inStock') === 'true'}
          onChange={(e) => setParam('inStock', e.target.checked ? 'true' : null)}
          className="h-4 w-4 rounded border-brand-200 text-brand-600"
        />
        In stock only
      </label>

      <button
        onClick={() => router.push(pathname)}
        className="text-sm text-brand-600 hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
}
