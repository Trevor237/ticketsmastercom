import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/layout/site-layout";
import { EventCard, type EventCardData } from "@/components/event-card";
import { useSettings } from "@/hooks/use-settings";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
});

export const Route = createFileRoute("/events")({
  component: EventsPage,
  validateSearch: searchSchema,
});

type EventRow = {
  id: string; slug: string; title: string; city: string; venue: string;
  starts_at: string; image_url: string | null; status: string;
  categories: { name: string; slug: string } | null;
  ticket_types: { price_cents: number; quantity_total: number; quantity_sold: number; active: boolean }[];
};

function EventsPage() {
  const { q, category, city } = Route.useSearch();
  const settings = useSettings();
  const [events, setEvents] = useState<EventCardData[]>([]);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const load = async () => {
    let query = supabase
      .from("events")
      .select("id, slug, title, city, venue, starts_at, image_url, status, categories(name, slug), ticket_types(price_cents, quantity_total, quantity_sold, active)")
      .in("status", ["published", "sold_out", "cancelled"])
      .order("starts_at", { ascending: true });

    if (q) query = query.ilike("title", `%${q}%`);
    if (city) query = query.eq("city", city);

    const { data } = await query;
    let rows = (data as EventRow[] | null) ?? [];
    if (category) rows = rows.filter((r) => r.categories?.slug === category);

    setEvents(rows.map((e) => {
      const active = e.ticket_types?.filter((t) => t.active) ?? [];
      return {
        id: e.id, slug: e.slug, title: e.title, city: e.city, venue: e.venue,
        starts_at: e.starts_at, image_url: e.image_url, status: e.status,
        category_name: e.categories?.name ?? null,
        min_price_cents: active.length ? Math.min(...active.map((t) => t.price_cents)) : null,
        remaining: active.length ? active.reduce((s, t) => s + Math.max(0, t.quantity_total - t.quantity_sold), 0) : null,
      };
    }));

    setCities([...new Set(rows.map((r) => r.city))].sort());
  };

  useEffect(() => {
    supabase.from("categories").select("name, slug").eq("active", true).order("sort_order")
      .then(({ data }) => setCategories((data ?? []) as never));
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("events-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_types" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [q, category, city]);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl mb-2">All events</h1>
        <p className="text-muted-foreground mb-6">
          {events.length} event{events.length === 1 ? "" : "s"}
          {q && <> matching <span className="font-semibold">"{q}"</span></>}
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            to="/events"
            className={`px-3 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wide ${!category ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/events"
              search={{ category: c.slug } as never}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wide ${category === c.slug ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}
            >
              {c.name}
            </Link>
          ))}
          {cities.length > 1 && (
            <select
              value={city ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                window.location.search = new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(category ? { category } : {}),
                  ...(v ? { city: v } : {}),
                }).toString();
              }}
              className="px-3 py-1.5 rounded-full text-sm bg-card border border-border"
            >
              <option value="">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {events.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">No events match these filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((e) => <EventCard key={e.id} event={{ ...e, currency: settings?.currency }} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
