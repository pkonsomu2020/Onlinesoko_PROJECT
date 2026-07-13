import { Link } from "@tanstack/react-router";
import { ksh, timeLeft } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck } from "lucide-react";

export interface RaffleCardData {
  id: string;
  title: string;
  category: string;
  ticket_price: number | string;
  total_tickets: number;
  tickets_sold: number;
  deadline: string;
  hero_image: string | null;
  status: string;
  sellout_policy: string;
  target_value: number | string;
}

export function RaffleCard({ raffle }: { raffle: RaffleCardData }) {
  const pct = raffle.total_tickets > 0 ? (raffle.tickets_sold / raffle.total_tickets) * 100 : 0;
  const ending = timeLeft(raffle.deadline);
  return (
    <Link
      to="/raffles/$id"
      params={{ id: raffle.id }}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition hover:border-foreground/30 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {raffle.hero_image ? (
          <img src={raffle.hero_image} alt={raffle.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground text-sm">No image</div>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium">
          <ShieldCheck className="h-3 w-3 text-primary" /> Verified
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-foreground text-background px-2 py-1 text-xs font-medium mono-num">
          {ending}
        </div>
      </div>
      <div className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{raffle.category}</div>
        <div className="mt-1 line-clamp-2 font-display text-base font-semibold leading-tight">{raffle.title}</div>
        <div className="mt-3">
          <Progress value={pct} className="h-1.5" />
          <div className="mt-2 flex items-baseline justify-between text-xs mono-num">
            <span className="text-muted-foreground">
              {raffle.tickets_sold}/{raffle.total_tickets} tickets
            </span>
            <span className="font-semibold text-foreground">{ksh(raffle.ticket_price)}/ticket</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
