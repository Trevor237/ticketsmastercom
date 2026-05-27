import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

type U = { id: string; email: string | null; full_name: string | null; created_at: string };

function AdminUsers() {
  const [users, setUsers] = useState<U[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());

  const load = async () => {
    const [{ data: u }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);
    setUsers((u ?? []) as U[]);
    setAdmins(new Set(((r ?? []) as { user_id: string }[]).map((x) => x.user_id)));
  };
  useEffect(() => { load(); }, []);

  const toggleAdmin = async (uid: string, makeAdmin: boolean) => {
    if (makeAdmin) {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
      if (error) return toast.error(error.message);
    }
    toast.success("Updated");
    load();
  };

  return (
    <div>
      <h1 className="text-3xl mb-6">Users</h1>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase">
            <tr><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3">Admin</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">{u.email ?? "—"}</td>
                <td className="px-4 py-3">{u.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={admins.has(u.id)} onChange={(e) => toggleAdmin(u.id, e.target.checked)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
