import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Ticket, Loader2 } from "lucide-react";

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard/buyer" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard/buyer" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    // Use the actual origin so this works on both localhost (dev) and unconquered.co.ke (prod)
    const redirectUri = `${window.location.origin}/auth`;
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: redirectUri });
    if (res.error) toast.error(res.error.message ?? "Google sign-in failed");
    else if (!res.redirected) navigate({ to: "/dashboard/buyer" });
  }

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
                <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {tab === "signup" ? "Create account" : "Sign in"}
            </Button>
            {tab === "signup" && (
              <p className="text-xs text-muted-foreground">By creating an account you confirm you are 18 or older and accept the <a className="underline" href="/legal">terms</a>.</p>
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
