import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const settings = useSettings();
  const [stats, setStats] = useState({ events: 0, orders: 0, revenue: 0, users: 0 });

  useEffect(() => {
    const load = async () => {
      const [{ count: events }, { data: orders }, { count: users }] = await Promise.all([
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total_cents, status").eq("status", "paid"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      const revenue = (orders ?? []).reduce((s, o: { total_cents: number }) => s + o.total_cents, 0);
      setStats({ events: events ?? 0, orders: (orders ?? []).length, revenue, users: users ?? 0 });
    };
    load();
    const ch = supabase.channel("admin-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const cards = [
    { label: "Total events", value: stats.events },
    { label: "Paid orders", value: stats.orders },
    { label: "Revenue", value: formatPrice(stats.revenue, settings?.currency ?? "EUR") },
    { label: "Users", value: stats.users },
  ];

  return (
    <div>
      <h1 className="text-3xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-5">
            <div className="text-sm text-muted-foreground uppercase tracking-wide">{c.label}</div>
            <div className="mt-2 text-3xl font-extrabold">{c.value}</div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Use the sidebar to manage events, orders, promo codes, categories, users and platform settings.
        All changes propagate to the public site in real time.
      </p>
    </div>
  );
}
