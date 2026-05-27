import { Link } from "@tanstack/react-router";
import { Calendar, MapPin } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/format";

export type EventCardData = {
  id: string;
  slug: string;
  title: string;
  city: string;
  venue: string;
  starts_at: string;
  image_url: string | null;
  category_name?: string | null;
  status: string;
  min_price_cents?: number | null;
  currency?: string;
};

export function EventCard({ event }: { event: EventCardData }) {
  const soldOut = event.status === "sold_out";
  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug }}
      className="group flex flex-col bg-white rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-[16/9] overflow-hidden bg-muted relative">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 to-foreground/30" />
        )}
        {event.category_name && (
          <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold uppercase tracking-wide">
            {event.category_name}
          </span>
        )}
        {soldOut && (
          <span className="absolute top-3 right-3 inline-flex items-center px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold uppercase">
            Sold out
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-foreground text-base line-clamp-2">{event.title}</h3>
        <div className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(event.starts_at)}</span>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{event.venue}, {event.city}</span>
        </div>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="font-bold text-foreground">
            {event.min_price_cents != null
              ? `From ${formatPrice(event.min_price_cents, event.currency ?? "EUR")}`
              : ""}
          </span>
          <span className="btn-uppercase text-xs bg-primary text-primary-foreground px-3 py-2 rounded">
            {soldOut ? "View" : "Get Tickets"}
          </span>
        </div>
      </div>
    </Link>
  );
}
