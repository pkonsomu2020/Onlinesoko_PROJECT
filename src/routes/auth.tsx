import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Ticket, Loader2, MailCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — OnlineSoko" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("signin");
  // After signup, show the "check your email" screen instead of navigating
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState("");

  // If already logged in, go straight to dashboard
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard/buyer" });
    });
  }, [navigate]);

  // Handle the email confirmation callback — Supabase redirects back to /auth
  // with #access_token in the URL hash after the user clicks the confirm link.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    // Let Supabase process the token from the URL hash
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Clear the hash from URL so it isn't bookmarked with the token
        window.history.replaceState(null, "", window.location.pathname);
        toast.success("Email confirmed! You're now signed in.");
        navigate({ to: "/dashboard/buyer" });
      }
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "signup") {
        // emailRedirectTo must point to the live domain — Supabase uses this in the
        // confirmation email link. /auth handles the token hash on return.
        const redirectTo = `${window.location.origin}/auth`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { full_name: name },
          },
        });
        if (error) throw error;

        // Show confirmation pending screen instead of navigating to dashboard
        setConfirmedEmail(email);
        setPendingConfirmation(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard/buyer" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const redirectUri = `${window.location.origin}/auth`;
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: redirectUri });
    if (res.error) toast.error(res.error.message ?? "Google sign-in failed");
    else if (!res.redirected) navigate({ to: "/dashboard/buyer" });
  }

  // ── Confirmation pending screen ──────────────────────────────────────────
  if (pendingConfirmation) {
    return (
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4 py-12">
        <div className="w-full text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
            <MailCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold">Check your email</h1>
          <p className="mt-3 text-muted-foreground">
            We sent a confirmation link to
          </p>
          <p className="mt-1 font-semibold">{confirmedEmail}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Click the link in the email to activate your account, then come back here to sign in.
            The link expires in 24 hours.
          </p>

          <div className="mt-8 space-y-3">
            <Button
              className="w-full"
              onClick={() => {
                setPendingConfirmation(false);
                setTab("signin");
                setPassword("");
              }}
            >
              Go to sign in
            </Button>
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={async () => {
                const { error } = await supabase.auth.resend({
                  type: "signup",
                  email: confirmedEmail,
                  options: { emailRedirectTo: `${window.location.origin}/auth` },
                });
                if (error) toast.error(error.message);
                else toast.success("Confirmation email resent");
              }}
            >
              Resend confirmation email
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Didn't receive it? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  // ── Normal sign in / sign up form ────────────────────────────────────────
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4 py-12">
      <div className="w-full">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Ticket className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-semibold">OnlineSoko</span>
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold">Welcome</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to buy tickets or list an item.</p>

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {tab === "signup" && (
              <div>
                <Label>Full name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Your full name"
                />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {tab === "signup" ? "Create account" : "Sign in"}
            </Button>
            {tab === "signup" && (
              <p className="text-xs text-muted-foreground">
                By creating an account you confirm you are 18 or older and accept the{" "}
                <a className="underline" href="/legal">terms</a>.
              </p>
            )}
          </form>

          <TabsContent value="signin" />
          <TabsContent value="signup" />
        </Tabs>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={google}>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
