import { API_URL } from './config';
import type {
  CartView,
  CategoryView,
  Paginated,
  ProductView,
  ReviewView,
  BannerView,
} from '@shimeka/shared';

type FetchOpts = RequestInit & { token?: string; sessionId?: string };

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { token, sessionId, headers, ...rest } = opts;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(sessionId ? { 'x-cart-session': sessionId } : {}),
      ...(headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ---- Server-side data helpers (used by Server Components, with ISR) ----

const revalidate = { next: { revalidate: 60 } } as RequestInit;

export function getCategories(): Promise<CategoryView[]> {
  return apiFetch<CategoryView[]>('/categories', revalidate);
}

export function getBanners(): Promise<BannerView[]> {
  return apiFetch<BannerView[]>('/banners', revalidate);
}

export function getProducts(query: string): Promise<Paginated<ProductView>> {
  return apiFetch<Paginated<ProductView>>(`/products${query ? `?${query}` : ''}`, revalidate);
}

export function getFeatured(): Promise<Paginated<ProductView>> {
  return apiFetch<Paginated<ProductView>>('/products?featured=true&pageSize=8', revalidate);
}

export function getNewArrivals(): Promise<Paginated<ProductView>> {
  return apiFetch<Paginated<ProductView>>('/products?sort=newest&pageSize=8', revalidate);
}

export function getProduct(slug: string): Promise<ProductView> {
  return apiFetch<ProductView>(`/products/${slug}`, revalidate);
}

export function getRelated(slug: string): Promise<ProductView[]> {
  return apiFetch<ProductView[]>(`/products/${slug}/related`, revalidate);
}

export function getCategory(slug: string): Promise<CategoryView> {
  return apiFetch<CategoryView>(`/categories/${slug}`, revalidate);
}

export function getProductReviews(productId: string): Promise<Paginated<ReviewView>> {
  return apiFetch<Paginated<ReviewView>>(`/products/${productId}/reviews`, revalidate);
}

export type { CartView };
