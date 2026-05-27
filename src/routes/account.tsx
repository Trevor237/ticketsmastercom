import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/layout/site-layout";
import { formatDate, formatPrice } from "@/lib/format";
import { useSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/account")({ component: AccountPage });

type Order = {
  id: string; status: string; total_cents: number; currency: string; created_at: string;
  order_items: { event_title: string; ticket_name: string; quantity: number; unit_price_cents: number }[];
};

function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const settings = useSettings();
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth", search: { redirect: "/account" } as never });
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status, total_cents, currency, created_at, order_items(event_title, ticket_name, quantity, unit_price_cents)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) ?? []);
    };
    load();
    const ch = supabase.channel(`orders-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (!user) return null;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl">My account</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <button onClick={signOut} className="btn-uppercase text-xs border border-border px-4 py-2 rounded">Sign out</button>
        </div>

        <h2 className="text-xl mb-4">My orders</h2>
        {orders.length === 0 ? (
          <p className="text-muted-foreground">No orders yet. <Link to="/events" className="text-primary">Browse events</Link></p>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">Order #{o.id.slice(0, 8)} · {formatDate(o.created_at)}</div>
                  <span className={`text-xs uppercase font-semibold px-2 py-1 rounded ${
                    o.status === "paid" ? "bg-green-100 text-green-700" :
                    o.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    o.status === "refunded" ? "bg-blue-100 text-blue-700" :
                    "bg-red-100 text-red-700"
                  }`}>{o.status}</span>
                </div>
                <ul className="space-y-1 text-sm">
                  {o.order_items.map((it, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{it.quantity}× {it.event_title} — {it.ticket_name}</span>
                      <span>{formatPrice(it.unit_price_cents * it.quantity, o.currency)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-border flex justify-between font-bold">
                  <span>Total</span><span>{formatPrice(o.total_cents, o.currency)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
