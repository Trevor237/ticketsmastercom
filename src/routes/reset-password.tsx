import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/layout/site-layout";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-signs the user in via the recovery link; ensure session.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); nav({ to: "/account" }); }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl mb-4">Set a new password</h1>
        {!ready ? (
          <p className="text-muted-foreground">Open this page from the email link to continue.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="New password" className="w-full px-3 py-2.5 rounded border border-input" />
            <button className="w-full btn-uppercase bg-primary text-primary-foreground py-3 rounded">Update</button>
          </form>
        )}
      </div>
    </SiteLayout>
  );
}
