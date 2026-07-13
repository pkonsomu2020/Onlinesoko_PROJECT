import { createFileRoute, Link } from "@tanstack/react-router";
import { getMyRaffles } from "@/lib/me.functions";
import { ksh, timeLeft } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/seller")({
  loader: () => getMyRaffles(),
  component: SellerDash,
});

const STATUS_TONE: Record<string, string> = {
  pending_verification: "bg-warning/40 text-warning-foreground",
  live: "bg-primary text-primary-foreground",
  drawing: "bg-accent text-accent-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/20 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

function SellerDash() {
  const { raffles } = Route.useLoaderData();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Your listings</h2>
          <p className="text-sm text-muted-foreground">Every item is verified by admin before it goes live.</p>
        </div>
        <Link to="/dashboard/seller/new"><Button><Plus className="mr-1 h-4 w-4" /> List a new item</Button></Link>
      </div>

      {raffles.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center">
          <Store className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">You haven't listed anything yet.</p>
          <Link to="/dashboard/seller/new" className="mt-4 inline-block">
            <Button>Submit your first item</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {raffles.map((r: any) => (
            <div key={r.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
              {r.hero_image && <img src={r.hero_image} className="h-16 w-16 rounded-md object-cover" alt="" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-display font-semibold">{r.title}</div>
                  <Badge className={STATUS_TONE[r.status] ?? ""}>{r.status.replace("_", " ")}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground mono-num">
                  {r.tickets_sold}/{r.total_tickets} tickets · {ksh(r.ticket_price)}/ticket · {timeLeft(r.deadline)}
                </div>
              </div>
              <Link to="/raffles/$id" params={{ id: r.id }} className="text-sm font-medium text-primary hover:underline">View →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
