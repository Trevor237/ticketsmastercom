import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteLayout } from "@/components/layout/site-layout";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: z.object({ redirect: z.string().optional() }),
});

function AuthPage() {
  const nav = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const after = () => nav({ to: (redirect as never) || "/" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Account created — check your email to confirm.");
      after();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      after();
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
    else if (!r.redirected) after();
  };

  const forgot = async () => {
    if (!email) return toast.error("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl text-center mb-2">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="text-center text-muted-foreground mb-6">
          {mode === "signin" ? "Welcome back" : "Get started in seconds"}
        </p>

        <button
          onClick={google}
          className="w-full btn-uppercase border border-border bg-white text-foreground py-3 rounded mb-4 hover:bg-card"
        >
          Continue with Google
        </button>

        <div className="text-center text-xs text-muted-foreground mb-4">or with email</div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              className="w-full px-3 py-2.5 rounded border border-input bg-background" />
          )}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" className="w-full px-3 py-2.5 rounded border border-input bg-background" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" className="w-full px-3 py-2.5 rounded border border-input bg-background" />
          <button disabled={loading} className="w-full btn-uppercase bg-primary text-primary-foreground py-3 rounded disabled:opacity-60">
            {loading ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary">
            {mode === "signin" ? "Create account" : "Have an account? Sign in"}
          </button>
          {mode === "signin" && (
            <button onClick={forgot} className="text-muted-foreground">Forgot password?</button>
          )}
        </div>

        <p className="mt-8 text-xs text-center text-muted-foreground">
          By continuing you agree to our terms.
        </p>
        <p className="mt-4 text-center text-sm">
          <Link to="/" className="text-muted-foreground">← Back to home</Link>
        </p>
      </div>
    </SiteLayout>
  );
}
