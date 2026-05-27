import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

type O = { id: string; user_id: string; status: string; total_cents: number; currency: string; created_at: string; email: string | null };

function AdminOrders() {
  const [rows, setRows] = useState<O[]>([]);
  const load = async () => {
    const { data } = await supabase.from("orders").select("id, user_id, status, total_cents, currency, created_at, email").order("created_at", { ascending: false });
    setRows((data ?? []) as O[]);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("admin-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status } as any).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Updated");
  };

  return (
    <div>
      <h1 className="text-3xl mb-6">Orders</h1>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase">
            <tr><th className="px-4 py-3 text-left">Order</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Status</th></tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{o.email ?? "—"}</td>
                <td className="px-4 py-3">{formatDate(o.created_at)}</td>
                <td className="px-4 py-3 font-semibold">{formatPrice(o.total_cents, o.currency)}</td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-xs">
                    {["pending", "paid", "refunded", "cancelled", "failed"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No orders yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
