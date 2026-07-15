import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function SokoLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img src="/logo.svg" alt="OnlineSoko logo" className={className} />
  );
}

export function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <SokoLogo className="h-8 w-8 rounded-md" />
          <span className="font-display text-lg font-semibold tracking-tight">OnlineSoko</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/browse" className="rounded-md px-3 py-2 text-sm hover:bg-muted">Browse</Link>
          <Link to="/fairness" className="rounded-md px-3 py-2 text-sm hover:bg-muted">Fairness</Link>
          <Link to="/legal" className="rounded-md px-3 py-2 text-sm hover:bg-muted">Legal</Link>
        </nav>

        <div className="flex items-center gap-2">
          {email ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">{email.split("@")[0]}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild><Link to="/dashboard/buyer">My tickets</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dashboard/seller">Sell an item</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dashboard/admin">Admin</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/auth" className="hidden sm:block"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/dashboard/seller"><Button size="sm">List an item</Button></Link>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link to="/browse">Browse</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/fairness">Fairness</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/legal">Legal</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-display text-base font-semibold text-foreground">OnlineSoko</div>
            <div>Item raffles, verifiably fair. 18+ only.</div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/fairness" className="hover:text-foreground">Fairness</Link>
            <Link to="/legal" className="hover:text-foreground">Terms &amp; refunds</Link>
            <Link to="/browse" className="hover:text-foreground">Browse</Link>
          </div>
        </div>
        <div className="mt-6 text-xs">
          Payments are simulated in this build. No real money is charged.
        </div>
      </div>
    </footer>
  );
}
