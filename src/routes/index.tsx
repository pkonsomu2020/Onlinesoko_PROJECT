import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublicRaffles } from "@/lib/raffles.functions";
import { RaffleCard } from "@/components/raffle/RaffleCard";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, Sparkles, ArrowRight, Ticket } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  loader: () => getPublicRaffles(),
  component: Home,
});

function Home() {
  const { raffles } = Route.useLoaderData() as { raffles: any[] };
  const featured = raffles.filter((r) => r.status === "live").slice(0, 6);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground text-[10px]">KE</span>
              Built for Kenya · M-Pesa &amp; card
            </div>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Own the item. <br />
              <span className="text-primary">Split the price.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
              A marketplace where sellers list real items and buyers pool small ticket
              purchases for a chance to win. Every item is verified. Every draw is
              publicly verifiable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/browse"><Button size="lg">Browse raffles <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
              <Link to="/dashboard/seller"><Button size="lg" variant="outline">List an item</Button></Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm">
              <TrustPoint icon={ShieldCheck}>Item verified before it goes live</TrustPoint>
              <TrustPoint icon={Lock}>Funds held in escrow until handover</TrustPoint>
              <TrustPoint icon={Sparkles}>Commit-reveal draw anyone can audit</TrustPoint>
            </div>
          </div>
          <div className="relative">
            <div className="ticket-stub overflow-hidden">
              <img src={heroImg} alt="A verified item resting on a torn raffle ticket stub" width={1600} height={1200} className="aspect-[4/3] w-full object-cover" />
            </div>
            <div className="absolute -bottom-4 left-6 rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
              <div className="font-semibold">Verified ✓</div>
              <div className="text-muted-foreground mono-num">Serial · KE-00219</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold">Live raffles</h2>
            <p className="text-muted-foreground">Verified items, ticket sales in progress.</p>
          </div>
          <Link to="/browse" className="text-sm font-medium text-primary hover:underline">See all →</Link>
        </div>
        <div className="mt-8">
          {featured.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <Ticket className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 font-display text-lg font-semibold">No live raffles yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Be the first seller to list a verified item.</p>
              <Link to="/dashboard/seller/new" className="mt-4 inline-block">
                <Button>List an item</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((r) => <RaffleCard key={r.id} raffle={r as any} />)}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold">How OnlineSoko works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            <Step n="01" title="Seller lists">The seller submits the item, photos, target value, and ticket price.</Step>
            <Step n="02" title="Admin verifies">Every item is verified with photo proof or in-person check before going live.</Step>
            <Step n="03" title="Buyers pool">Buyers grab tickets. Funds sit in escrow — not the seller's wallet.</Step>
            <Step n="04" title="Verifiable draw">Commit-reveal + a public beacon picks the winner. Anyone can re-run the math.</Step>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <TrustCard title="Every draw is auditable" href="/fairness">
            Each raffle publishes a commit hash before ticket sales close. After the draw, the seed and public beacon are revealed — you can re-compute the winner yourself.
          </TrustCard>
          <TrustCard title="No raffle goes live unverified" href="/legal">
            Photo-with-code verification for standard items. In-person or courier check for high-value items. Admin sign-off is required.
          </TrustCard>
          <TrustCard title="Clear refund policy" href="/legal">
            Every raffle states upfront what happens if it doesn't sell out — extend, proportional payout, or full refund. Set before the first ticket is sold.
          </TrustCard>
        </div>
      </section>
    </div>
  );
}

function TrustPoint({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" /> {children}
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-display text-xs font-semibold text-primary mono-num">{n}</div>
      <div className="mt-1 font-display text-lg font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function TrustCard({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <Link to={href as any} className="block rounded-lg border border-border bg-card p-6 transition hover:border-foreground/30">
      <div className="font-display text-lg font-semibold">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
      <div className="mt-3 text-sm font-medium text-primary">Learn more →</div>
    </Link>
  );
}
