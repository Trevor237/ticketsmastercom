import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/format";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/events/$id")({ component: EditEvent });

type TT = { id?: string; name: string; description: string; price_cents: number; quantity_total: number; sort_order: number; active: boolean };

function EditEvent() {
  const { id } = useParams({ from: "/admin/events/$id" });
  const isNew = id === "new";
  const nav = useNavigate();
  const [form, setForm] = useState<any>({
    title: "", slug: "", description: "", category_id: "", city: "", venue: "", address: "",
    starts_at: "", ends_at: "", image_url: "", banner_url: "", status: "draft", featured: false,
  });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tickets, setTickets] = useState<TT[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id, name").order("sort_order").then(({ data }) => setCategories((data ?? []) as never));
    if (!isNew) {
      supabase.from("events").select("*").eq("id", id).maybeSingle().then(({ data }) => {
        if (data) setForm({
          ...data,
          starts_at: data.starts_at ? new Date(data.starts_at).toISOString().slice(0, 16) : "",
          ends_at: data.ends_at ? new Date(data.ends_at).toISOString().slice(0, 16) : "",
        });
      });
      supabase.from("ticket_types").select("*").eq("event_id", id).order("sort_order").then(({ data }) => setTickets((data ?? []) as never));
    }
  }, [id]);

  const upload = async (file: File, field: "image_url" | "banner_url") => {
    setUploading(true);
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file);
    setUploading(false);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    setForm({ ...form, [field]: data.publicUrl });
  };

  const save = async () => {
    setSaving(true);
    if (!form.starts_at) { setSaving(false); return toast.error("Start date is required"); }
    const payload: any = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      description: form.description,
      category_id: form.category_id || null,
      city: form.city, venue: form.venue, address: form.address || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      image_url: form.image_url || null, banner_url: form.banner_url || null,
      status: form.status, featured: form.featured,
    };
    let evtId = id;
    if (isNew) {
      const { data, error } = await supabase.from("events").insert(payload).select().single();
      if (error) { setSaving(false); return toast.error(error.message); }
      evtId = data.id;
    } else {
      const { error } = await supabase.from("events").update(payload).eq("id", id);
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    // Persist tickets
    for (const t of tickets) {
      if (t.id) {
        await supabase.from("ticket_types").update({
          name: t.name, description: t.description, price_cents: t.price_cents,
          quantity_total: t.quantity_total, sort_order: t.sort_order, active: t.active,
        }).eq("id", t.id);
      } else if (t.name) {
        await supabase.from("ticket_types").insert({ ...t, event_id: evtId });
      }
    }
    setSaving(false);
    toast.success("Saved");
    if (isNew) nav({ to: "/admin/events/$id", params: { id: evtId! } });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl mb-6">{isNew ? "New event" : "Edit event"}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Title" v={form.title} on={(v) => setForm({ ...form, title: v, slug: form.slug || slugify(v) })} />
        <Field label="Slug" v={form.slug} on={(v) => setForm({ ...form, slug: v })} />
        <Field label="City" v={form.city} on={(v) => setForm({ ...form, city: v })} />
        <Field label="Venue" v={form.venue} on={(v) => setForm({ ...form, venue: v })} />
        <Field label="Address" v={form.address} on={(v) => setForm({ ...form, address: v })} />
        <div>
          <label className="block text-sm font-semibold mb-1">Category</label>
          <select value={form.category_id ?? ""} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full px-3 py-2 rounded border border-input bg-background">
            <option value="">—</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <Field label="Starts at" type="datetime-local" v={form.starts_at} on={(v) => setForm({ ...form, starts_at: v })} />
        <Field label="Ends at" type="datetime-local" v={form.ends_at} on={(v) => setForm({ ...form, ends_at: v })} />
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-1">Description</label>
          <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={5} className="w-full px-3 py-2 rounded border border-input bg-background" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Cover image</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "image_url")} />
          {form.image_url && <img src={form.image_url} alt="" className="mt-2 h-24 rounded" />}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Banner image</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "banner_url")} />
          {form.banner_url && <img src={form.banner_url} alt="" className="mt-2 h-24 rounded" />}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-3 py-2 rounded border border-input bg-background">
            {["draft", "published", "sold_out", "cancelled"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 mt-7">
          <input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
          <span>Featured on homepage</span>
        </label>
      </div>

      <h2 className="text-xl mt-10 mb-3">Ticket types</h2>
      <div className="space-y-3">
        {tickets.map((t, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center bg-card border border-border rounded p-3">
            <input className="col-span-3 px-2 py-1.5 rounded border border-input bg-background" placeholder="Name" value={t.name} onChange={(e) => setTickets(tickets.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
            <input className="col-span-3 px-2 py-1.5 rounded border border-input bg-background" placeholder="Description" value={t.description ?? ""} onChange={(e) => setTickets(tickets.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
            <input type="number" className="col-span-2 px-2 py-1.5 rounded border border-input bg-background" placeholder="Price (cents)" value={t.price_cents} onChange={(e) => setTickets(tickets.map((x, j) => j === i ? { ...x, price_cents: Number(e.target.value) } : x))} />
            <input type="number" className="col-span-2 px-2 py-1.5 rounded border border-input bg-background" placeholder="Qty" value={t.quantity_total} onChange={(e) => setTickets(tickets.map((x, j) => j === i ? { ...x, quantity_total: Number(e.target.value) } : x))} />
            <label className="col-span-1 text-xs flex items-center gap-1"><input type="checkbox" checked={t.active} onChange={(e) => setTickets(tickets.map((x, j) => j === i ? { ...x, active: e.target.checked } : x))} />active</label>
            <button onClick={async () => {
              if (t.id) await supabase.from("ticket_types").delete().eq("id", t.id);
              setTickets(tickets.filter((_, j) => j !== i));
            }} className="col-span-1 text-destructive justify-self-end"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button onClick={() => setTickets([...tickets, { name: "", description: "", price_cents: 0, quantity_total: 0, sort_order: tickets.length, active: true }])}
          className="text-primary text-sm">+ Add ticket type</button>
      </div>

      <div className="mt-8 flex gap-3">
        <button onClick={save} disabled={saving || uploading} className="btn-uppercase bg-primary text-primary-foreground px-5 py-2.5 rounded disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={() => nav({ to: "/admin/events" })} className="btn-uppercase border border-border px-5 py-2.5 rounded">Cancel</button>
      </div>
    </div>
  );
}

function Field({ label, v, on, type = "text" }: { label: string; v: any; on: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input type={type} value={v ?? ""} onChange={(e) => on(e.target.value)}
        className="w-full px-3 py-2 rounded border border-input bg-background" />
    </div>
  );
}
