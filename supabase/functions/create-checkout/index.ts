import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_KEY) {
      return new Response(JSON.stringify({ error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY in project secrets." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supaUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supaUser.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { items, promo_code } = await req.json() as { items: { ticket_type_id: string; quantity: number }[]; promo_code?: string | null };
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ids = items.map((i) => i.ticket_type_id);
    const { data: tts } = await supa.from("ticket_types").select("id, name, price_cents, quantity_total, quantity_sold, active, event_id, events(title, status)").in("id", ids);
    if (!tts || tts.length !== ids.length) return new Response(JSON.stringify({ error: "Invalid items" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: settings } = await supa.from("settings").select("*").eq("id", 1).single();
    const currency = (settings?.currency || "EUR").toLowerCase();
    const feePct = Number(settings?.service_fee_percent || 0);

    let subtotal = 0;
    const lineItems: any[] = [];
    const orderItems: any[] = [];

    for (const it of items) {
      const tt: any = tts.find((t: any) => t.id === it.ticket_type_id);
      if (!tt || !tt.active) return new Response(JSON.stringify({ error: "Ticket unavailable" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (tt.events?.status !== "published") return new Response(JSON.stringify({ error: "Event not on sale" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (tt.quantity_sold + it.quantity > tt.quantity_total) return new Response(JSON.stringify({ error: `Not enough ${tt.name} tickets left` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      subtotal += tt.price_cents * it.quantity;
      lineItems.push({
        price_data: { currency, unit_amount: tt.price_cents, product_data: { name: `${tt.events.title} — ${tt.name}` } },
        quantity: it.quantity,
      });
      orderItems.push({
        ticket_type_id: tt.id, event_id: tt.event_id, event_title: tt.events.title,
        ticket_name: tt.name, unit_price_cents: tt.price_cents, quantity: it.quantity,
        subtotal_cents: tt.price_cents * it.quantity,
      });
    }

    let discount = 0;
    if (promo_code) {
      const { data: p } = await supa.from("promo_codes").select("*").eq("code", String(promo_code).toUpperCase()).eq("active", true).maybeSingle();
      if (p) {
        const pct = Math.round((subtotal * Number(p.discount_percent)) / 100);
        discount = Math.min(subtotal, pct + Number(p.discount_amount_cents));
      }
    }
    const serviceFee = Math.round((subtotal * feePct) / 100);
    if (serviceFee > 0) {
      lineItems.push({ price_data: { currency, unit_amount: serviceFee, product_data: { name: "Service fee" } }, quantity: 1 });
    }
    const total = Math.max(0, subtotal + serviceFee - discount);

    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2023-10-16" });
    const origin = req.headers.get("origin") || "";
    const discounts: any[] = [];
    if (discount > 0) {
      const coupon = await stripe.coupons.create({ amount_off: discount, currency, duration: "once" });
      discounts.push({ coupon: coupon.id });
    }

    const { data: order, error: oerr } = await supa.from("orders").insert({
      user_id: user.id, status: "pending",
      subtotal_cents: subtotal, service_fee_cents: serviceFee, discount_cents: discount,
      total_cents: total, currency: currency.toUpperCase(),
      promo_code: promo_code || null, email: user.email,
    }).select().single();
    if (oerr || !order) return new Response(JSON.stringify({ error: oerr?.message || "Order create failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    await supa.from("order_items").insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: lineItems,
      discounts,
      success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout-cancelled`,
      metadata: { order_id: order.id, user_id: user.id },
    });

    await supa.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
