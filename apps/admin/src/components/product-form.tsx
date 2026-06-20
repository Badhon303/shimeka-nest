'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiUpload, API_URL } from '@/lib/api';
import type { CategoryView, ProductView } from '@shimeka/shared';

interface Props {
  product?: ProductView;
}

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '');
  const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? ''));
  const [status, setStatus] = useState<string>(product?.status ?? 'PUBLISHED');
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(product?.thumbnailImage ?? '');

  useEffect(() => {
    api<CategoryView[]>('/categories/tree').then(setCategories);
  }, []);

  // Flatten categories for select
  function flattenCategories(cats: CategoryView[], depth = 0): { id: string; name: string; depth: number }[] {
    const result: { id: string; name: string; depth: number }[] = [];
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, depth });
      if (cat.children?.length) {
        result.push(...flattenCategories(cat.children, depth + 1));
      }
    }
    return result;
  }

  function autoSlug(val: string) {
    return val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let thumbnail = product?.thumbnailImage ?? null;

      // Upload thumbnail if changed
      if (thumbnailFile) {
        const fd = new FormData();
        fd.append('file', thumbnailFile);
        const res = await apiUpload<{ url: string }>('/admin/uploads/image', fd);
        thumbnail = res.url;
      }

      const body = {
        name,
        slug,
        description: description || null,
        categoryId,
        basePrice: Number(basePrice),
        status,
        isFeatured,
        thumbnailImage: thumbnail,
      };

      if (product) {
        await api(`/admin/products/${product.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await api('/admin/products', { method: 'POST', body: JSON.stringify(body) });
      }

      router.push('/products');
    } catch (err: any) {
      setError(err.message ?? 'Failed to save product');
    } finally {
      setLoading(false);
    }
  }

  const flatCats = flattenCategories(categories);

  return (
    <form onSubmit={handleSubmit} className="card max-w-3xl space-y-6 p-6">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!product) setSlug(autoSlug(e.target.value));
            }}
            required
          />
        </div>
        <div>
          <label className="label">Slug</label>
          <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[100px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select…</option>
            {flatCats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {'—'.repeat(cat.depth)} {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Base Price (৳)</label>
          <input
            type="number"
            className="input"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            min="0"
            step="1"
            required
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="featured"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="featured" className="text-sm font-medium text-ink/80">Featured product</label>
      </div>

      <div>
        <label className="label">Thumbnail Image</label>
        <div className="flex items-center gap-4">
          {thumbnailPreview && (
            <img src={thumbnailPreview} alt="" className="h-16 w-16 rounded-md object-cover" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setThumbnailFile(f);
                setThumbnailPreview(URL.createObjectURL(f));
              }
            }}
            className="text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : product ? 'Update Product' : 'Create Product'}
        </button>
        <button type="button" className="btn-outline" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
