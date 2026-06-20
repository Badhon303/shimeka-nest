'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { CartView } from '@shimeka/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from './auth-context';

interface CartContextValue {
  cart: CartView | null;
  loading: boolean;
  itemCount: number;
  addItem: (productVariantId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

const SESSION_KEY = 'shimeka_cart_session';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(true);
  const mergedRef = useRef(false);

  const authHeaders = useCallback(
    () => ({ token: token ?? undefined, sessionId: token ? undefined : getSessionId() }),
    [token],
  );

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<CartView>('/cart', authHeaders());
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // On login, merge the guest cart into the user's cart once.
  useEffect(() => {
    (async () => {
      if (token && !mergedRef.current) {
        mergedRef.current = true;
        const sessionId = getSessionId();
        try {
          await apiFetch('/cart/merge', {
            method: 'POST',
            token,
            body: JSON.stringify({ sessionId }),
          });
        } catch {
          /* ignore */
        }
      }
      if (!token) mergedRef.current = false;
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const addItem = useCallback(
    async (productVariantId: string, quantity: number) => {
      const data = await apiFetch<CartView>('/cart/items', {
        method: 'POST',
        ...authHeaders(),
        body: JSON.stringify({ productVariantId, quantity }),
      });
      setCart(data);
    },
    [authHeaders],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      const data = await apiFetch<CartView>(`/cart/items/${itemId}`, {
        method: 'PATCH',
        ...authHeaders(),
        body: JSON.stringify({ quantity }),
      });
      setCart(data);
    },
    [authHeaders],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const data = await apiFetch<CartView>(`/cart/items/${itemId}`, {
        method: 'DELETE',
        ...authHeaders(),
      });
      setCart(data);
    },
    [authHeaders],
  );

  const clear = useCallback(async () => {
    const data = await apiFetch<CartView>('/cart', { method: 'DELETE', ...authHeaders() });
    setCart(data);
  }, [authHeaders]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount: cart?.itemCount ?? 0,
        addItem,
        updateItem,
        removeItem,
        clear,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export { getSessionId };
