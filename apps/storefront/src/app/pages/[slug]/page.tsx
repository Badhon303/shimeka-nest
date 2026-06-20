import type { Metadata } from 'next';
import { apiFetch } from '@/lib/api';

export const revalidate = 300;

interface ContentResponse {
  key: string;
  value: { title?: string; body?: string } | null;
}

async function fetchContent(slug: string): Promise<ContentResponse> {
  try {
    return await apiFetch<ContentResponse>(`/content/page_${slug}`, { next: { revalidate: 300 } } as RequestInit);
  } catch {
    return { key: `page_${slug}`, value: null };
  }
}

const FALLBACK: Record<string, { title: string; body: string }> = {
  shipping: {
    title: 'Shipping Policy',
    body: 'We deliver across Bangladesh. Inside Dhaka: ৳60. Outside Dhaka: ৳100. Orders are typically processed within 1–2 business days.',
  },
  returns: {
    title: 'Return Policy',
    body: 'Returns are accepted within 7 days of delivery for unused items in original packaging. Contact support to initiate a return.',
  },
  about: {
    title: 'About Shimeka',
    body: 'Shimeka brings you curated makeup and clothing for the modern woman.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const content = await fetchContent(params.slug);
  const title = content.value?.title ?? FALLBACK[params.slug]?.title ?? 'Page';
  return { title };
}

export default async function CmsPage({ params }: { params: { slug: string } }) {
  const content = await fetchContent(params.slug);
  const title = content.value?.title ?? FALLBACK[params.slug]?.title ?? 'Page';
  const body = content.value?.body ?? FALLBACK[params.slug]?.body ?? 'Content coming soon.';

  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="font-serif text-3xl font-bold">{title}</h1>
      <div className="prose mt-6 whitespace-pre-line text-ink/70">{body}</div>
    </div>
  );
}
