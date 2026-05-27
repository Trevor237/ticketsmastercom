import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/layout/site-layout";
import { EventCard, type EventCardData } from "@/components/event-card";
import { useSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/")({ component: HomePage });

type EventRow = {
  id: string; slug: string; title: string; city: string; venue: string;
  starts_at: string; image_url: string | null; status: string; featured: boolean;
  categories: { name: string } | null;
  ticket_types: { price_cents: number }[];
};

function mapEvent(e: EventRow): EventCardData {
  const min = e.ticket_types?.length
    ? Math.min(...e.ticket_types.map((t) => t.price_cents))
    : null;
  return {
    id: e.id, slug: e.slug, title: e.title, city: e.city, venue: e.venue,
    starts_at: e.starts_at, image_url: e.image_url, status: e.status,
    category_name: e.categories?.name ?? null, min_price_cents: min,
  };
}

function HomePage() {
  const settings = useSettings();
  const [featured, setFeatured] = useState<EventCardData[]>([]);
  const [upcoming, setUpcoming] = useState<EventCardData[]>([]);

  const load = async () => {
    const sel = "id, slug, title, city, venue, starts_at, image_url, status, featured, categories(name), ticket_types(price_cents)";
    const [{ data: feat }, { data: up }] = await Promise.all([
      supabase.from("events").select(sel).eq("featured", true).in("status", ["published", "sold_out"]).order("starts_at", { ascending: true }).limit(6),
      supabase.from("events").select(sel).in("status", ["published", "sold_out"]).gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(12),
    ]);
    setFeatured((feat as EventRow[] | null)?.map(mapEvent) ?? []);
    setUpcoming((up as EventRow[] | null)?.map(mapEvent) ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("home-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_types" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <SiteLayout>
      <section className="relative">
        <div
          className="relative h-[420px] md:h-[520px] bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.75), rgba(0,0,0,0.2)), url(${settings?.hero_image_url || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1920&q=80"})`,
          }}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto max-w-7xl w-full px-4">
              <div className="max-w-2xl text-white">
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                  {settings?.tagline ?? "Find tickets to your favorite events"}
                </h1>
                <p className="mt-4 text-lg text-white/85">
                  Concerts, sports, theater & more — secure your seats now.
                </p>
                <Link
                  to="/events"
                  className="mt-6 inline-block btn-uppercase bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded"
                >
                  Browse all events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 mt-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl md:text-3xl">Featured events</h2>
            <Link to="/events" className="text-primary font-semibold text-sm uppercase">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((e) => <EventCard key={e.id} event={{ ...e, currency: settings?.currency }} />)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 mt-12">
        <h2 className="text-2xl md:text-3xl mb-6">Upcoming events</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            No published events yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {upcoming.map((e) => <EventCard key={e.id} event={{ ...e, currency: settings?.currency }} />)}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
