import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { code, subtotal_cents } = await req.json();
    if (!code || typeof subtotal_cents !== "number") {
      return new Response(JSON.stringify({ valid: false, message: "Invalid payload" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: p } = await supa.from("promo_codes").select("*").eq("code", String(code).toUpperCase()).eq("active", true).maybeSingle();
    if (!p) return new Response(JSON.stringify({ valid: false, message: "Code not found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const now = new Date();
    if (p.valid_from && new Date(p.valid_from) > now) return new Response(JSON.stringify({ valid: false, message: "Code not yet active" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (p.valid_until && new Date(p.valid_until) < now) return new Response(JSON.stringify({ valid: false, message: "Code expired" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (p.max_uses && p.used_count >= p.max_uses) return new Response(JSON.stringify({ valid: false, message: "Code usage limit reached" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const pct = Math.round((subtotal_cents * Number(p.discount_percent)) / 100);
    const discount_cents = Math.min(subtotal_cents, pct + Number(p.discount_amount_cents));
    return new Response(JSON.stringify({ valid: true, code: p.code, discount_cents }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ valid: false, message: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
