import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/layout/site-layout";
import { useCart } from "@/hooks/use-cart";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { items, setQuantity, remove, subtotalCents, clear } = useCart();
  const settings = useSettings();
  const { user } = useAuth();
  const nav = useNavigate();
  const [promo, setPromo] = useState("");
  const [discountCents, setDiscountCents] = useState(0);
  const [promoApplied, setPromoApplied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currency = settings?.currency ?? "EUR";
  const feePct = settings?.service_fee_percent ?? 0;
  const serviceFeeCents = Math.round((subtotalCents * Number(feePct)) / 100);
  const totalCents = Math.max(0, subtotalCents + serviceFeeCents - discountCents);

  const applyPromo = async () => {
    if (!promo.trim()) return;
    const { data, error } = await supabase.functions.invoke("validate-promo", {
      body: { code: promo.trim(), subtotal_cents: subtotalCents },
    });
    if (error || !data?.valid) {
      toast.error(data?.message || "Invalid promo code");
      setDiscountCents(0); setPromoApplied(null);
      return;
    }
    setDiscountCents(data.discount_cents);
    setPromoApplied(data.code);
    toast.success(`Promo applied: -${formatPrice(data.discount_cents, currency)}`);
  };

  const checkout = async () => {
    if (!user) {
      toast("Please sign in to checkout");
      nav({ to: "/auth", search: { redirect: "/cart" } as never });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        items: items.map((i) => ({ ticket_type_id: i.ticket_type_id, quantity: i.quantity })),
        promo_code: promoApplied ?? null,
      },
    });
    setLoading(false);
    if (error || !data?.url) {
      toast.error(data?.error || error?.message || "Checkout failed");
      return;
    }
    window.location.href = data.url;
  };

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Browse events and pick your tickets.</p>
          <Link to="/events" className="btn-uppercase bg-primary text-primary-foreground px-5 py-3 rounded inline-block">
            Browse events
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-3xl mb-2">Your cart</h1>
          {items.map((i) => (
            <div key={i.ticket_type_id} className="flex gap-4 bg-card border border-border rounded-lg p-4">
              {i.image_url && (
                <img src={i.image_url} alt="" className="h-20 w-28 rounded object-cover" />
              )}
              <div className="flex-1">
                <div className="font-semibold">{i.event_title}</div>
                <div className="text-sm text-muted-foreground">{i.ticket_name}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => setQuantity(i.ticket_type_id, i.quantity - 1)} className="h-7 w-7 rounded border border-border inline-flex items-center justify-center">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center">{i.quantity}</span>
                  <button onClick={() => setQuantity(i.ticket_type_id, i.quantity + 1)} className="h-7 w-7 rounded border border-border inline-flex items-center justify-center">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatPrice(i.unit_price_cents * i.quantity, currency)}</div>
                <button onClick={() => remove(i.ticket_type_id)} className="mt-3 text-destructive inline-flex items-center gap-1 text-sm">
                  <Trash2 className="h-4 w-4" />Remove
                </button>
              </div>
            </div>
          ))}
          <button onClick={clear} className="text-sm text-muted-foreground underline">Clear cart</button>
        </div>

        <aside>
          <div className="bg-card border border-border rounded-lg p-5 sticky top-32">
            <h2 className="text-lg mb-4">Order summary</h2>
            <div className="flex gap-2 mb-4">
              <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Promo code"
                className="flex-1 px-3 py-2 rounded border border-input bg-background" />
              <button onClick={applyPromo} className="btn-uppercase bg-foreground text-background px-3 rounded text-xs">Apply</button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(subtotalCents, currency)}</dd></div>
              <div className="flex justify-between"><dt>Service fee ({feePct}%)</dt><dd>{formatPrice(serviceFeeCents, currency)}</dd></div>
              {discountCents > 0 && (
                <div className="flex justify-between text-green-700"><dt>Discount {promoApplied && `(${promoApplied})`}</dt><dd>-{formatPrice(discountCents, currency)}</dd></div>
              )}
              <div className="flex justify-between pt-2 border-t border-border font-bold text-base">
                <dt>Total</dt><dd>{formatPrice(totalCents, currency)}</dd>
              </div>
            </dl>
            <button
              onClick={checkout}
              disabled={loading}
              className="w-full mt-5 btn-uppercase bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded disabled:opacity-60"
            >
              {loading ? "Loading…" : "Checkout"}
            </button>
            <p className="text-xs text-muted-foreground mt-3 text-center">Secure payment via Stripe</p>
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}
