'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiUpload } from '@/lib/api';
import type { CategoryView } from '@shimeka/shared';

interface Props {
  category?: CategoryView;
}

export function CategoryForm({ category }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [type, setType] = useState<string>(category?.type ?? 'GENERAL');
  const [parentId, setParentId] = useState(category?.parentId ?? '');
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(category?.image ?? '');

  useEffect(() => {
    api<CategoryView[]>('/admin/categories').then(setCategories);
  }, []);

  function flattenCategories(cats: CategoryView[], depth = 0): { id: string; name: string; depth: number }[] {
    const result: { id: string; name: string; depth: number }[] = [];
    for (const cat of cats) {
      if (cat.id === category?.id) continue;
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
      let image = category?.image ?? null;

      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const res = await apiUpload<{ url: string }>('/admin/uploads/image', fd);
        image = res.url;
      }

      const body = {
        name,
        slug,
        type,
        parentId: parentId || null,
        sortOrder: Number(sortOrder),
        image,
      };

      if (category) {
        await api(`/admin/categories/${category.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await api('/admin/categories', { method: 'POST', body: JSON.stringify(body) });
      }

      router.push('/categories');
    } catch (err: any) {
      setError(err.message ?? 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  const flatCats = flattenCategories(categories);

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl space-y-6 p-6">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!category) setSlug(autoSlug(e.target.value));
            }}
            required
          />
        </div>
        <div>
          <label className="label">Slug</label>
          <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="GENERAL">General</option>
            <option value="MAKEUP">Makeup</option>
            <option value="CLOTHING">Clothing</option>
          </select>
        </div>
        <div>
          <label className="label">Parent</label>
          <select className="input" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">None (Top-level)</option>
            {flatCats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {'—'.repeat(cat.depth)} {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Sort Order</label>
          <input
            type="number"
            className="input"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">Image</label>
        <div className="flex items-center gap-4">
          {imagePreview && (
            <img src={imagePreview} alt="" className="h-16 w-16 rounded-md object-cover" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setImageFile(f);
                setImagePreview(URL.createObjectURL(f));
              }
            }}
            className="text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : category ? 'Update Category' : 'Create Category'}
        </button>
        <button type="button" className="btn-outline" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
