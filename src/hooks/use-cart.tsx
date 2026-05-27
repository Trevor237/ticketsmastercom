import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  ticket_type_id: string;
  event_id: string;
  event_title: string;
  ticket_name: string;
  unit_price_cents: number;
  quantity: number;
  image_url?: string | null;
};

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (ticket_type_id: string) => void;
  setQuantity: (ticket_type_id: string, q: number) => void;
  clear: () => void;
  subtotalCents: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "tm_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.ticket_type_id === item.ticket_type_id);
      if (existing) {
        return prev.map((p) =>
          p.ticket_type_id === item.ticket_type_id
            ? { ...p, quantity: p.quantity + item.quantity }
            : p,
        );
      }
      return [...prev, item];
    });
  };

  const remove = (ticket_type_id: string) =>
    setItems((p) => p.filter((i) => i.ticket_type_id !== ticket_type_id));

  const setQuantity = (ticket_type_id: string, q: number) =>
    setItems((p) =>
      p.map((i) =>
        i.ticket_type_id === ticket_type_id ? { ...i, quantity: Math.max(1, q) } : i,
      ),
    );

  const clear = () => setItems([]);

  const subtotalCents = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, add, remove, setQuantity, clear, subtotalCents, count }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}
