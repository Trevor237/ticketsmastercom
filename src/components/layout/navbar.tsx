import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingCart, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useSettings } from "@/hooks/use-settings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { label: "Concerts", slug: "concerts" },
  { label: "Sports", slug: "sports" },
  { label: "Arts & Theater", slug: "arts-theater" },
  { label: "Family", slug: "family" },
  { label: "Festivals", slug: "festivals" },
];

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const settings = useSettings();
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav({ to: "/events", search: { q: q || undefined } as never });
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-navbar text-navbar-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" className="font-display text-2xl font-extrabold tracking-tight text-white">
            {settings?.platform_name ?? "Tiketsmaster"}
          </Link>
          <form onSubmit={submit} className="flex flex-1 max-w-2xl mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by artist, event or venue"
                className="w-full pl-10 pr-24 py-2.5 rounded-full bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 text-primary-foreground btn-uppercase text-xs px-4 py-1.5 rounded-full"
              >
                Search
              </button>
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-white/10"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-5 min-w-5 px-1 rounded-full inline-flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-white/10" aria-label="Account">
                    <UserIcon className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account"><UserIcon className="mr-2 h-4 w-4" />My account</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/auth"
                className="btn-uppercase text-xs px-4 py-2 rounded bg-white text-navbar hover:bg-white/90"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
      <nav className="bg-subnav text-white">
        <div className="mx-auto max-w-7xl px-4">
          <ul className="flex gap-6 overflow-x-auto">
            {NAV.map((n) => (
              <li key={n.slug}>
                <Link
                  to="/events"
                  search={{ category: n.slug } as never}
                  className="inline-block py-3 text-sm font-semibold uppercase tracking-wide border-b-2 border-transparent hover:border-primary hover:text-primary transition-colors"
                  activeProps={{ className: "border-primary text-primary" }}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
