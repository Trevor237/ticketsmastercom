import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/use-settings";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: SettingsAdmin });

function SettingsAdmin() {
  const settings = useSettings();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (settings && !form) setForm(settings); }, [settings]);
  if (!form) return <div>Loading…</div>;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("settings").update({
      platform_name: form.platform_name,
      tagline: form.tagline,
      service_fee_percent: Number(form.service_fee_percent),
      currency: form.currency,
      maintenance_mode: form.maintenance_mode,
      hero_image_url: form.hero_image_url,
      contact_email: form.contact_email,
    }).eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Settings updated — live on the site now");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl mb-6">Platform settings</h1>
      <div className="space-y-4">
        {[
          ["platform_name", "Platform name"],
          ["tagline", "Tagline"],
          ["currency", "Currency (e.g. EUR, USD)"],
          ["service_fee_percent", "Service fee %"],
          ["hero_image_url", "Hero image URL"],
          ["contact_email", "Contact email"],
        ].map(([k, label]) => (
          <div key={k}>
            <label className="block text-sm font-semibold mb-1">{label}</label>
            <input value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="w-full px-3 py-2 rounded border border-input bg-background" />
          </div>
        ))}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!form.maintenance_mode} onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked })} />
          <span className="text-sm">Maintenance mode</span>
        </label>
        <button onClick={save} disabled={saving} className="btn-uppercase bg-primary text-primary-foreground px-5 py-2.5 rounded">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
