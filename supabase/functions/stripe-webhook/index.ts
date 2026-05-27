import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

Deno.serve(async (req) => {
  const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!STRIPE_KEY || !WEBHOOK_SECRET) return new Response("Stripe not configured", { status: 400 });

  const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2023-10-16" });
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, WEBHOOK_SECRET);
  } catch (e) {
    return new Response(`Webhook error: ${e}`, { status: 400 });
  }

  const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const orderId = s.metadata?.order_id;
    if (orderId) {
      await supa.from("orders").update({ status: "paid", stripe_payment_intent: String(s.payment_intent ?? "") }).eq("id", orderId);
      const { data: items } = await supa.from("order_items").select("ticket_type_id, quantity").eq("order_id", orderId);
      for (const it of items ?? []) {
        await supa.rpc("noop"); // placeholder for future RPC
        const { data: tt } = await supa.from("ticket_types").select("quantity_sold").eq("id", it.ticket_type_id).single();
        if (tt) await supa.from("ticket_types").update({ quantity_sold: tt.quantity_sold + it.quantity }).eq("id", it.ticket_type_id);
      }
      if (s.metadata?.promo_code) {
        const code = String(s.metadata.promo_code).toUpperCase();
        const { data: p } = await supa.from("promo_codes").select("used_count").eq("code", code).single();
        if (p) await supa.from("promo_codes").update({ used_count: p.used_count + 1 }).eq("code", code);
      }
    }
  }
  return new Response("ok", { status: 200 });
});
