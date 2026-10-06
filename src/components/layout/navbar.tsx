import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingCart, User as UserIcon, LogOut, LayoutDashboard, ShieldCheck, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useSettings } from "@/hooks/use-settings";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { label: "Concert", slug: "concerts" },
  { label: "Festival", slug: "festivals" },
  { label: "Spectacle", slug: "spectacle" },
  { label: "Théâtre & Humour", slug: "theatre-humour" },
  { label: "Sport", slug: "sports" },
  { label: "Famille & Loisirs", slug: "family" },
];

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const settings = useSettings();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("events")
      .select("city")
      .in("status", ["published", "sold_out"])
      .then(({ data }) => {
        const uniq = [...new Set((data ?? []).map((r: { city: string }) => r.city))].sort();
        setCities(uniq.slice(0, 11));
      });
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav({ to: "/events", search: { q: q || undefined } as never });
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top utility bar — dark */}
      <div className="bg-[#2d2d2d] text-white/90 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-8">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Billetterie africaine · Paiement sécurisé
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-white/70">
              <Globe className="h-3.5 w-3.5" /> FR
            </span>
            <span className="hidden lg:inline text-white/80">Événements dans votre ville</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/events" className="hover:underline">Aide</Link>
            <span className="hidden md:inline text-gold">● Bons plans</span>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 hover:underline">
                    <UserIcon className="h-3.5 w-3.5" /> Mon compte
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account"><UserIcon className="mr-2 h-4 w-4" />Mon compte</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Se déconnecter</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="inline-flex items-center gap-1 hover:underline">
                <UserIcon className="h-3.5 w-3.5" /> Se connecter
              </Link>
            )}
            <Link to="/cart" className="relative inline-flex" aria-label="Cart">
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] font-bold h-4 min-w-4 px-1 rounded-full inline-flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Main header — WHITE */}
      <div className="bg-white border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 h-16">
          <Link to="/" className="font-display text-2xl font-extrabold tracking-tight text-foreground shrink-0">
            {settings?.platform_name ?? "Billetterie Afrique"}
            <sup className="text-[10px] ml-0.5">®</sup>
          </Link>
          <nav className="hidden md:flex items-center gap-6 flex-1">
            {NAV.map((n) => (
              <Link
                key={n.slug}
                to="/events"
                search={{ category: n.slug } as never}
                className="text-sm font-bold text-foreground hover:text-primary transition-colors whitespace-nowrap"
                activeProps={{ className: "text-primary" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <form onSubmit={submit} className="flex-1 max-w-md ml-auto">
            <div className="relative w-full">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Événement, artiste ou lieu"
                className="w-full pl-4 pr-10 py-2 rounded-sm bg-[#f5f5f5] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary" aria-label="Search">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* City sub-nav — WHITE with blue links */}
      {cities.length > 0 && (
        <div className="bg-white border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            {cities.map((c) => (
              <Link
                key={c}
                to="/events"
                search={{ city: c } as never}
                className="text-sm text-primary hover:underline font-medium"
              >
                {c}
              </Link>
            ))}
            <Link to="/events" className="text-sm text-primary hover:underline font-medium">+ de villes</Link>
          </div>
        </div>
      )}
    </header>
  );
}
