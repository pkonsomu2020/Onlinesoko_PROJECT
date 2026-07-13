import { AlertTriangle, Clock, DollarSign } from "lucide-react";

const COPY: Record<string, { title: string; body: string; icon: any; tone: string }> = {
  extend: {
    title: "Extend deadline if not sold out",
    body: "If tickets aren't fully sold by the deadline, the sale extends up to 7 more days. If still not sold out, buyers are refunded.",
    icon: Clock,
    tone: "text-warning-foreground bg-warning/40",
  },
  proportional: {
    title: "Guaranteed draw — seller accepts proportional payout",
    body: "The raffle draws regardless of how many tickets sold. The seller receives a payout proportional to tickets sold. The item is still awarded.",
    icon: DollarSign,
    tone: "text-primary-foreground bg-primary",
  },
  refund: {
    title: "Full refund if minimum threshold not met",
    body: "If the minimum ticket threshold isn't hit by the deadline, all buyers are automatically refunded and the raffle is cancelled.",
    icon: AlertTriangle,
    tone: "text-destructive-foreground bg-destructive",
  },
};

export function PolicyBadge({ policy, min }: { policy: string; min?: number }) {
  const c = COPY[policy] ?? COPY.refund;
  const Icon = c.icon;
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <span className={`grid h-6 w-6 place-items-center rounded-full ${c.tone}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="text-sm font-semibold">{c.title}</div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {c.body}
        {policy === "refund" && min ? ` Minimum: ${min} tickets.` : ""}
      </p>
    </div>
  );
}
