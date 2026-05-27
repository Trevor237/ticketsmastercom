import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { SiteLayout } from "@/components/layout/site-layout";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout-success")({ component: Success });

function Success() {
  const { clear } = useCart();
  useEffect(() => { clear(); }, []);
  return (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
        <h1 className="text-3xl mt-4">Payment successful</h1>
        <p className="text-muted-foreground mt-2">Your tickets are confirmed. Find them in your account.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/account" className="btn-uppercase bg-primary text-primary-foreground px-5 py-3 rounded">View orders</Link>
          <Link to="/events" className="btn-uppercase border border-border px-5 py-3 rounded">Keep browsing</Link>
        </div>
      </div>
    </SiteLayout>
  );
}
