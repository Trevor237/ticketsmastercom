import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/promo-codes")({ component: AdminPromos });

type P = { id: string; code: string; discount_percent: number; discount_amount_cents: number; max_uses: number | null; used_count: number; valid_until: string | null; active: boolean };

function AdminPromos() {
  const [rows, setRows] = useState<P[]>([]);
  const [f, setF] = useState({ code: "", discount_percent: 0, discount_amount_cents: 0, max_uses: "", valid_until: "" });

  const load = async () => {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as P[]);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!f.code.trim()) return;
    const { error } = await supabase.from("promo_codes").insert({
      code: f.code.toUpperCase(),
      discount_percent: Number(f.discount_percent),
      discount_amount_cents: Number(f.discount_amount_cents),
      max_uses: f.max_uses ? Number(f.max_uses) : null,
      valid_until: f.valid_until || null,
    });
    if (error) toast.error(error.message); else { setF({ code: "", discount_percent: 0, discount_amount_cents: 0, max_uses: "", valid_until: "" }); load(); }
  };
  const del = async (id: string) => { await supabase.from("promo_codes").delete().eq("id", id); load(); };
  const toggle = async (id: string, active: boolean) => { await supabase.from("promo_codes").update({ active }).eq("id", id); load(); };

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl mb-6">Promo codes</h1>
      <div className="grid grid-cols-5 gap-2 mb-6 bg-card border border-border p-3 rounded">
        <input placeholder="CODE" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} className="px-2 py-1.5 rounded border border-input bg-background" />
        <input type="number" placeholder="% off" value={f.discount_percent} onChange={(e) => setF({ ...f, discount_percent: Number(e.target.value) })} className="px-2 py-1.5 rounded border border-input bg-background" />
        <input type="number" placeholder="Cents off" value={f.discount_amount_cents} onChange={(e) => setF({ ...f, discount_amount_cents: Number(e.target.value) })} className="px-2 py-1.5 rounded border border-input bg-background" />
        <input type="number" placeholder="Max uses" value={f.max_uses} onChange={(e) => setF({ ...f, max_uses: e.target.value })} className="px-2 py-1.5 rounded border border-input bg-background" />
        <button onClick={add} className="btn-uppercase bg-primary text-primary-foreground rounded">Add</button>
      </div>
      <table className="w-full text-sm bg-card border border-border rounded">
        <thead className="bg-muted text-xs uppercase">
          <tr><th className="px-3 py-2 text-left">Code</th><th>% off</th><th>Cents off</th><th>Uses</th><th>Active</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="px-3 py-2 font-mono">{p.code}</td>
              <td className="text-center">{p.discount_percent}</td>
              <td className="text-center">{p.discount_amount_cents}</td>
              <td className="text-center">{p.used_count}{p.max_uses ? `/${p.max_uses}` : ""}</td>
              <td className="text-center"><input type="checkbox" checked={p.active} onChange={(e) => toggle(p.id, e.target.checked)} /></td>
              <td className="text-right pr-3"><button onClick={() => del(p.id)} className="text-destructive text-xs">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
