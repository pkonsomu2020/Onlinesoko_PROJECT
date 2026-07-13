import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { getRaffleById } from "@/lib/raffles.functions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PolicyBadge } from "@/components/raffle/PolicyBadge";
import { BuyTicketsDialog } from "@/components/raffle/BuyTicketsDialog";
import { ksh, timeLeft } from "@/lib/format";
import { ShieldCheck, Sparkles, Lock, Clock } from "lucide-react";

export const Route = createFileRoute("/raffles/$id")({
  loader: async ({ params }) => {
    const res = await getRaffleById({ data: { id: params.id } });
    if (!res.raffle) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    if (!loaderData?.raffle) return { meta: [{ title: "Raffle not found — OnlineSoko" }, { name: "robots", content: "noindex" }] };
    const r = loaderData.raffle as any;
    return {
      meta: [
        { title: `${r.title} — OnlineSoko` },
        { name: "description", content: `Win ${r.title}. Ticket price ${ksh(r.ticket_price)}. Verified item, escrowed funds, verifiable draw.` },
        { property: "og:title", content: `${r.title} — OnlineSoko` },
        { property: "og:description", content: `Win ${r.title}. ${r.tickets_sold}/${r.total_tickets} tickets sold.` },
        ...(r.hero_image ? [{ property: "og:image", content: r.hero_image as string }] : []),
      ],
    };
  },
  component: RaffleDetail,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-lg p-12 text-center">
      <h1 className="font-display text-xl">Couldn't load raffle</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg p-12 text-center">
      <h1 className="font-display text-2xl font-semibold">Raffle not found</h1>
      <Link to="/browse" className="mt-4 inline-block text-primary hover:underline">← Back to browse</Link>
    </div>
  ),
});

function RaffleDetail() {
  const { raffle, images, draw } = Route.useLoaderData() as { raffle: any; images: any[]; draw: any };
  const r = raffle;
  const remaining = r.total_tickets - r.tickets_sold;
  const pct = (r.tickets_sold / r.total_tickets) * 100;
  const gallery = [r.hero_image, ...images.map((i) => i.url)].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/browse" className="text-sm text-muted-foreground hover:text-foreground">← Back to browse</Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        {/* Gallery */}
        <div>
          <div className="ticket-stub overflow-hidden">
            {gallery[0] ? (
              <img src={gallery[0]} alt={r.title} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="grid aspect-[4/3] place-items-center bg-muted text-muted-foreground">No image</div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {gallery.slice(1, 5).map((url, i) => (
                <img key={i} src={url} alt="" className="aspect-square w-full rounded-md object-cover" />
              ))}
            </div>
          )}

          <div className="mt-8 rounded-lg border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold">About this item</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{r.description}</p>
            {r.serial_number && (
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-muted px-2 py-0.5 mono-num">SN {r.serial_number}</span>
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Serial verified by admin
              </div>
            )}
          </div>
        </div>

        {/* Side */}
        <div className="space-y-4">
          <div>
            <Badge variant="secondary" className="uppercase tracking-wider">{r.category}</Badge>
            <h1 className="mt-2 font-display text-3xl font-bold">{r.title}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-primary" /> Verified item</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {timeLeft(r.deadline)}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Ticket price</div>
                <div className="font-display text-3xl font-bold mono-num">{ksh(r.ticket_price)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Item value</div>
                <div className="font-display text-lg font-semibold mono-num">{ksh(r.target_value)}</div>
              </div>
            </div>

            <div className="mt-4">
              <Progress value={pct} className="h-2" />
              <div className="mt-2 flex justify-between text-xs mono-num text-muted-foreground">
                <span>{r.tickets_sold}/{r.total_tickets} tickets sold</span>
                <span>{remaining} remaining</span>
              </div>
            </div>

            {r.status === "live" ? (
              <BuyTicketsDialog
                raffleId={r.id}
                ticketPrice={Number(r.ticket_price)}
                remaining={remaining}
                trigger={<Button size="lg" className="mt-5 w-full">Buy tickets</Button>}
              />
            ) : (
              <div className="mt-5 rounded-md bg-muted p-3 text-center text-sm">
                This raffle is {r.status}.
              </div>
            )}
            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Payments simulated · Funds held in escrow
            </div>
          </div>

          <PolicyBadge policy={r.sellout_policy} min={r.min_tickets_threshold} />

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Verifiable draw
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              This raffle's commit hash is public before ticket sales close.
            </p>
            <div className="mt-2 break-all rounded bg-muted p-2 text-[10px] mono-num text-muted-foreground">
              {r.commit_hash}
            </div>
            {draw ? (
              <Link to="/fairness" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                Draw complete → winning ticket #{(draw as any).winning_ticket_number}
              </Link>
            ) : (
              <Link to="/fairness" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                How the draw works →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
