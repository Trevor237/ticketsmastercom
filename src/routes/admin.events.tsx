import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/events")({ component: AdminEvents });

type Row = { id: string; title: string; slug: string; city: string; venue: string; starts_at: string; status: string; featured: boolean };

function AdminEvents() {
  const [rows, setRows] = useState<Row[]>([]);
  const load = async () => {
    const { data } = await supabase.from("events").select("id, title, slug, city, venue, starts_at, status, featured").order("starts_at", { ascending: false });
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, []);

  const toggleFeatured = async (id: string, v: boolean) => {
    const { error } = await supabase.from("events").update({ featured: v }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); load(); }
  };
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("events").update({ status } as any).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); load(); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };
  const duplicate = async (id: string) => {
    const { data: src, error: e1 } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
    if (e1 || !src) return toast.error(e1?.message ?? "Not found");
    const { id: _i, created_at: _c, updated_at: _u, created_by: _b, ...rest } = src as any;
    const copy = {
      ...rest,
      title: `${src.title} (Copy)`,
      slug: `${src.slug}-copy-${Math.random().toString(36).slice(2, 6)}`,
      status: "draft",
      featured: false,
    };
    const { data: newEvt, error: e2 } = await supabase.from("events").insert(copy).select().single();
    if (e2) return toast.error(e2.message);
    const { data: tts } = await supabase.from("ticket_types").select("*").eq("event_id", id);
    if (tts?.length) {
      const newTts = tts.map((t: any) => {
        const { id: _ti, created_at: _tc, event_id: _te, quantity_sold: _qs, ...trest } = t;
        return { ...trest, event_id: newEvt.id, quantity_sold: 0 };
      });
      await supabase.from("ticket_types").insert(newTts);
    }
    toast.success("Event duplicated as draft");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl">Events</h1>
        <Link to="/admin/events/new" className="btn-uppercase bg-primary text-primary-foreground px-4 py-2.5 rounded">+ New event</Link>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide">
            <tr><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Venue</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3">Featured</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">{r.title}</td>
                <td className="px-4 py-3">{formatDate(r.starts_at)}</td>
                <td className="px-4 py-3">{r.venue}, {r.city}</td>
                <td className="px-4 py-3">
                  <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-xs">
                    {["draft", "published", "sold_out", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={r.featured} onChange={(e) => toggleFeatured(r.id, e.target.checked)} />
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link to="/admin/events/$id" params={{ id: r.id }} className="text-primary">Edit</Link>
                  <button onClick={() => remove(r.id)} className="text-destructive">Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No events yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
