import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/site-layout";

export const Route = createFileRoute("/checkout-cancelled")({ component: Cancel });

function Cancel() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl">Payment cancelled</h1>
        <p className="text-muted-foreground mt-2">Your cart is still saved.</p>
        <Link to="/cart" className="inline-block mt-6 btn-uppercase bg-primary text-primary-foreground px-5 py-3 rounded">Back to cart</Link>
      </div>
    </SiteLayout>
  );
}
