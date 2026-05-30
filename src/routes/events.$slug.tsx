import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/layout/site-layout";
import { useCart } from "@/hooks/use-cart";
import { useSettings } from "@/hooks/use-settings";
import { formatDate, formatPrice } from "@/lib/format";
import { Calendar, MapPin, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/events/$slug")({ component: EventDetail });

type Event = {
  id: string; slug: string; title: string; description: string | null;
  city: string; venue: string; address: string | null;
  starts_at: string; ends_at: string | null;
  image_url: string | null; banner_url: string | null; status: string;
  categories: { name: string } | null;
};

type TT = {
  id: string; name: string; description: string | null;
  price_cents: number; quantity_total: number; quantity_sold: number; active: boolean;
};

function EventDetail() {
  const { slug } = Route.useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const settings = useSettings();
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TT[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: e } = await supabase
      .from("events")
      .select("id, slug, title, description, city, venue, address, starts_at, ends_at, image_url, banner_url, status, categories(name)")
      .eq("slug", slug)
      .in("status", ["published", "sold_out", "cancelled"])
      .maybeSingle();
    setEvent(e as Event | null);
    if (e) {
      const { data: tt } = await supabase
        .from("ticket_types")
        .select("id, name, description, price_cents, quantity_total, quantity_sold, active")
        .eq("event_id", (e as Event).id)
        .eq("active", true)
        .order("sort_order");
      setTicketTypes((tt as TT[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`event-${slug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_types" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [slug]);

  if (loading) return <SiteLayout><div className="mx-auto max-w-7xl px-4 py-12">Loading…</div></SiteLayout>;
  if (!event) return <SiteLayout><div className="mx-auto max-w-7xl px-4 py-12">Event not found.</div></SiteLayout>;

  const addToCart = () => {
    let added = 0;
    Object.entries(qty).forEach(([ttId, q]) => {
      if (!q) return;
      const tt = ticketTypes.find((t) => t.id === ttId);
      if (!tt) return;
      add({
        ticket_type_id: tt.id,
        event_id: event.id,
        event_title: event.title,
        ticket_name: tt.name,
        unit_price_cents: tt.price_cents,
        quantity: q,
        image_url: event.image_url,
      });
      added += q;
    });
    if (!added) return toast.error("Select at least one ticket");
    toast.success(`${added} ticket(s) added to cart`);
    nav({ to: "/cart" });
  };

  const cancelled = event.status === "cancelled";

  return (
    <SiteLayout>
      {cancelled && (
        <div className="bg-destructive text-destructive-foreground py-3 text-center font-bold uppercase tracking-wide">
          This event has been cancelled
        </div>
      )}
      <div
        className="relative h-72 md:h-96 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.25)), url(${event.banner_url || event.image_url || ""})`,
        }}
      >
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-4 pb-8 text-white">
            {event.categories?.name && (
              <span className="inline-block bg-primary px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide">
                {event.categories.name}
              </span>
            )}
            <h1 className="mt-3 text-3xl md:text-5xl text-white">{event.title}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/90">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDate(event.starts_at)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venue}, {event.city}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <h2 className="text-xl mb-3">About this event</h2>
          <div className="prose max-w-none text-foreground/90 whitespace-pre-wrap">
            {event.description || "No description provided."}
          </div>
          {event.address && (
            <>
              <h3 className="text-lg mt-8 mb-2">Venue</h3>
              <p className="text-muted-foreground">{event.venue} — {event.address}</p>
            </>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-lg mb-4">Tickets</h3>
            {cancelled ? (
              <p className="text-destructive font-semibold">This event has been cancelled. Tickets are no longer available.</p>
            ) : event.status === "sold_out" || ticketTypes.length === 0 ? (
              <p className="text-destructive font-semibold">Sold out</p>
            ) : (
              <div className="space-y-4">
                {ticketTypes.map((tt) => {
                  const remaining = tt.quantity_total - tt.quantity_sold;
                  const q = qty[tt.id] || 0;
                  return (
                    <div key={tt.id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold">{tt.name}</div>
                          {tt.description && <div className="text-sm text-muted-foreground">{tt.description}</div>}
                          <div className="text-xs text-muted-foreground mt-1">
                            {remaining > 0 ? `${remaining} available` : "Sold out"}
                          </div>
                        </div>
                        <div className="font-bold whitespace-nowrap">
                          {formatPrice(tt.price_cents, settings?.currency ?? "EUR")}
                        </div>
                      </div>
                      {remaining > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => setQty({ ...qty, [tt.id]: Math.max(0, q - 1) })}
                            className="h-8 w-8 rounded border border-border flex items-center justify-center"
                          ><Minus className="h-4 w-4" /></button>
                          <span className="w-8 text-center font-semibold">{q}</span>
                          <button
                            onClick={() => setQty({ ...qty, [tt.id]: Math.min(remaining, q + 1) })}
                            className="h-8 w-8 rounded border border-border flex items-center justify-center"
                          ><Plus className="h-4 w-4" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={addToCart}
                  className="w-full btn-uppercase bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded"
                >
                  Add to cart
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}
