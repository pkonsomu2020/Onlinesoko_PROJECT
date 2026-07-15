import { Link } from "@tanstack/react-router";
import { ksh, timeLeft } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, Trophy, RefreshCw } from "lucide-react";

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

const STATUS_OVERLAY: Record<string, { label: string; icon: any; cls: string } | undefined> = {
  drawing:   { label: "Draw in progress", icon: RefreshCw, cls: "bg-accent text-accent-foreground" },
  completed: { label: "Draw complete",    icon: Trophy,    cls: "bg-foreground text-background" },
  refunded:  { label: "Refunded",         icon: null,      cls: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled",        icon: null,      cls: "bg-destructive/80 text-destructive-foreground" },
};

export function RaffleCard({ raffle }: { raffle: RaffleCardData }) {
  const pct = raffle.total_tickets > 0 ? (raffle.tickets_sold / raffle.total_tickets) * 100 : 0;
  const ending = timeLeft(raffle.deadline);
  const overlay = STATUS_OVERLAY[raffle.status];
  const isLive = raffle.status === "live";

  return (
    <Link
      to="/raffles/$id"
      params={{ id: raffle.id }}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition hover:border-foreground/30 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {raffle.hero_image ? (
          <img
            src={raffle.hero_image}
            alt={raffle.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground text-sm">No image</div>
        )}

        {/* Status overlay for non-live raffles */}
        {overlay ? (
          <div className={`absolute inset-0 flex items-center justify-center bg-black/40`}>
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${overlay.cls}`}>
              {overlay.icon && <overlay.icon className="h-3 w-3" />}
              {overlay.label}
            </span>
          </div>
        ) : null}

        {/* Verified badge — only when live */}
        {isLive && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium">
            <ShieldCheck className="h-3 w-3 text-primary" /> Verified
          </div>
        )}

        {/* Time left — only when live */}
        {isLive && (
          <div className="absolute right-3 top-3 rounded-full bg-foreground text-background px-2 py-1 text-xs font-medium mono-num">
            {ending}
          </div>
        )}
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
