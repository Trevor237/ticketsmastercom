import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/admin/categories")({ component: AdminCats });

type C = { id: string; name: string; slug: string; sort_order: number; active: boolean };

function AdminCats() {
  const [rows, setRows] = useState<C[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setRows((data ?? []) as C[]);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name, slug: slugify(name), sort_order: rows.length });
    if (error) toast.error(error.message); else { setName(""); load(); }
  };
  const upd = async (id: string, patch: Partial<C>) => {
    await supabase.from("categories").update(patch).eq("id", id);
    load();
  };
  const del = async (id: string) => {
    if (!confirm("Delete category?")) return;
    await supabase.from("categories").delete().eq("id", id); load();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl mb-6">Categories</h1>
      <div className="flex gap-2 mb-6">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category"
          className="flex-1 px-3 py-2 rounded border border-input bg-background" />
        <button onClick={add} className="btn-uppercase bg-primary text-primary-foreground px-4 rounded">Add</button>
      </div>
      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center gap-3 bg-card border border-border rounded px-3 py-2">
            <input value={c.name} onChange={(e) => upd(c.id, { name: e.target.value })} className="flex-1 bg-transparent" />
            <label className="text-xs flex items-center gap-1">
              <input type="checkbox" checked={c.active} onChange={(e) => upd(c.id, { active: e.target.checked })} />active
            </label>
            <button onClick={() => del(c.id)} className="text-destructive text-sm">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
