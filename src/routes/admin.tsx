import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Calendar, Tag, Users, Settings, Receipt, FolderTree } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/events", label: "Events", icon: Calendar },
  { to: "/admin/orders", label: "Orders", icon: Receipt },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/promo-codes", label: "Promo codes", icon: Tag },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) nav({ to: "/auth", search: { redirect: "/admin" } as never });
    else if (!isAdmin) nav({ to: "/" });
  }, [user, isAdmin, loading]);

  if (loading || !user || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 bg-navbar text-white flex flex-col">
        <div className="px-5 py-5 font-display font-extrabold text-xl border-b border-white/10">
          <Link to="/">Billetterie Afrique</Link>
          <div className="text-xs font-normal text-white/60 uppercase mt-1">Admin</div>
        </div>
        <nav className="flex-1 py-4">
          {links.map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: l.to === "/admin" }}
              className="flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-white/10"
              activeProps={{ className: "bg-primary text-primary-foreground" }}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
        </nav>
        <Link to="/" className="px-5 py-3 text-xs text-white/60 hover:text-white border-t border-white/10">← Back to site</Link>
      </aside>
      <main className="flex-1 p-8 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
