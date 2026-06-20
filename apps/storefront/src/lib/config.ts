// Public API base URL. Override with NEXT_PUBLIC_API_URL at build/runtime.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// Used to rewrite relative upload URLs if ever needed.
export const API_ORIGIN = API_URL.replace(/\/api\/v1$/, '');
