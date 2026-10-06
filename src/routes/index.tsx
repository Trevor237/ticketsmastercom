import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Flame, ShieldCheck, Smartphone, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/layout/site-layout";
import { EventCard, type EventCardData } from "@/components/event-card";
import { useSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/")({ component: HomePage });

type EventRow = {
  id: string; slug: string; title: string; city: string; venue: string;
  starts_at: string; image_url: string | null; status: string; featured: boolean;
  categories: { name: string } | null;
  ticket_types: { price_cents: number; quantity_total: number; quantity_sold: number; active: boolean }[];
};

type Category = { id: string; name: string; slug: string };

const CITY_KEY = "home-city";

function mapEvent(e: EventRow): EventCardData {
  const active = e.ticket_types?.filter((t) => t.active) ?? [];
  const min = active.length ? Math.min(...active.map((t) => t.price_cents)) : null;
  const remaining = active.length
    ? active.reduce((s, t) => s + Math.max(0, t.quantity_total - t.quantity_sold), 0)
    : null;
  return {
    id: e.id, slug: e.slug, title: e.title, city: e.city, venue: e.venue,
    starts_at: e.starts_at, image_url: e.image_url, status: e.status,
    category_name: e.categories?.name ?? null, min_price_cents: min, remaining,
  };
}

function readCity(): string | null {
  try {
    return window.localStorage.getItem(CITY_KEY);
  } catch {
    return null;
  }
}

function writeCity(city: string) {
  try {
    window.localStorage.setItem(CITY_KEY, city);
  } catch {
    /* stockage indisponible : on ignore */
  }
}

function SectionHeader({ title, to, search }: { title: string; to?: string; search?: Record<string, string> }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <h2 className="section-title">{title}</h2>
      {to && (
        <Link
          to={to as never}
          search={search as never}
          className="text-primary font-semibold text-sm uppercase tracking-wide hover:underline"
        >
          Tout voir
        </Link>
      )}
    </div>
  );
}

function EventGrid({ events, currency, cols = 4 }: { events: EventCardData[]; currency?: string; cols?: 3 | 4 }) {
  const lg = cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${lg} gap-6`}>
      {events.map((e) => <EventCard key={e.id} event={{ ...e, currency }} />)}
    </div>
  );
}

function HomePage() {
  const settings = useSettings();
  const nav = useNavigate();
  const [featured, setFeatured] = useState<EventCardData[]>([]);
  const [upcoming, setUpcoming] = useState<EventCardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [nearCity, setNearCity] = useState<string | null>(null);

  const load = async () => {
    const sel = "id, slug, title, city, venue, starts_at, image_url, status, featured, categories(name), ticket_types(price_cents, quantity_total, quantity_sold, active)";
    const statuses = ["published", "sold_out", "cancelled"] as const;
    const [{ data: feat }, { data: up }, { data: cats }] = await Promise.all([
      supabase.from("events").select(sel).eq("featured", true).in("status", statuses).order("starts_at", { ascending: true }).limit(6),
      supabase.from("events").select(sel).in("status", statuses).gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(40),
      supabase.from("categories").select("id, name, slug").eq("active", true).order("sort_order", { ascending: true }),
    ]);
    setFeatured((feat as EventRow[] | null)?.map(mapEvent) ?? []);
    setUpcoming((up as EventRow[] | null)?.map(mapEvent) ?? []);
    setCategories((cats as Category[] | null) ?? []);
  };

  useEffect(() => {
    setNearCity(readCity());
    load();
    const ch = supabase
      .channel("home-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_types" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    upcoming.forEach((e) => counts.set(e.city, (counts.get(e.city) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [upcoming]);

  const activeCity = nearCity && cities.includes(nearCity) ? nearCity : cities[0] ?? null;
  const nearYou = useMemo(
    () => (activeCity ? upcoming.filter((e) => e.city === activeCity).slice(0, 4) : []),
    [upcoming, activeCity],
  );
  const lastTickets = useMemo(
    () => upcoming.filter((e) => e.status === "published" && e.remaining !== null && e.remaining !== undefined && e.remaining > 0 && e.remaining < 20).slice(0, 4),
    [upcoming],
  );

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    nav({ to: "/events", search: { q: q || undefined, city: city || undefined } as never });
  };

  const pickCity = (c: string) => {
    writeCity(c);
    setNearCity(c);
  };

  const currency = settings?.currency;

  return (
    <SiteLayout>
      {/* 1. Hero + recherche */}
      <section className="relative">
        <div
          className="relative h-[460px] md:h-[540px] bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url(${settings?.hero_image_url || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1920&q=80"})`,
          }}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto max-w-4xl w-full px-4 text-center text-white">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                {settings?.tagline ?? "Vivez les événements qui font vibrer l'Afrique"}
              </h1>
              <p className="mt-4 text-lg text-white/85">
                Concerts, festivals, humour, sport : réservez vos places en quelques clics.
              </p>
              <form
                onSubmit={submit}
                className="mt-8 flex flex-col md:flex-row gap-2 rounded-2xl bg-white p-2 shadow-pop text-foreground"
              >
                <label className="flex flex-1 items-center gap-2 px-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Artiste, spectacle, équipe…"
                    className="w-full h-12 bg-transparent outline-none placeholder:text-muted-foreground"
                    aria-label="Rechercher un événement"
                  />
                </label>
                <label className="flex items-center gap-2 px-3 md:border-l border-border">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-12 bg-transparent outline-none md:w-48"
                    aria-label="Ville"
                  >
                    <option value="">Toutes les villes</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <button
                  type="submit"
                  className="btn-uppercase h-12 rounded-xl bg-primary px-8 text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Rechercher
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Catégories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 mt-8">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:flex-wrap md:justify-center md:overflow-visible">
            {categories.map((c) => (
              <Link key={c.id} to="/events" search={{ category: c.slug } as never} className="chip whitespace-nowrap">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. À la une */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 mt-12">
          <SectionHeader title="À la une" to="/events" />
          <EventGrid events={featured} currency={currency} cols={3} />
        </section>
      )}

      {/* 4. Près de chez vous */}
      {nearYou.length > 0 && activeCity && (
        <section className="mx-auto max-w-7xl px-4 mt-12">
          <SectionHeader title={`Près de chez vous · ${activeCity}`} to="/events" search={{ city: activeCity }} />
          {cities.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
              {cities.slice(0, 10).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickCity(c)}
                  className={`chip whitespace-nowrap ${c === activeCity ? "bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground" : ""}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <EventGrid events={nearYou} currency={currency} />
        </section>
      )}

      {/* 5. Dernières places */}
      {lastTickets.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 mt-12">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="h-6 w-6 text-destructive" />
            <h2 className="section-title">Dernières places disponibles</h2>
          </div>
          <EventGrid events={lastTickets} currency={currency} />
        </section>
      )}

      {/* 6. Prochains événements */}
      <section className="mx-auto max-w-7xl px-4 mt-12">
        <SectionHeader title="Prochains événements" to="/events" />
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            Aucun événement publié pour le moment. Revenez bientôt.
          </p>
        ) : (
          <EventGrid events={upcoming.slice(0, 8)} currency={currency} />
        )}
      </section>

      {/* 7. Réassurance */}
      <section className="mx-auto max-w-7xl px-4 mt-16 mb-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { Icon: ShieldCheck, t: "Paiement sécurisé", s: "Vos transactions sont protégées de bout en bout." },
            { Icon: Smartphone, t: "Billet sur votre téléphone", s: "Recevez votre billet immédiatement, sans impression." },
            { Icon: Ticket, t: "Réservation simple", s: "Choisissez, payez, entrez : en quelques minutes." },
          ].map(({ Icon, t, s }) => (
            <div key={t} className="flex items-start gap-3 rounded-xl bg-[var(--primary-soft)] p-5">
              <Icon className="h-6 w-6 text-primary shrink-0" />
              <div>
                <div className="font-bold">{t}</div>
                <div className="text-sm text-muted-foreground">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
