import { createFileRoute, Link } from "@tanstack/react-router";
import { getMyTickets, getMyNotifications } from "@/lib/me.functions";
import { ksh, timeLeft } from "@/lib/format";
import { Ticket, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/buyer")({
  loader: async () => {
    const [t, n] = await Promise.all([getMyTickets(), getMyNotifications()]);
    return { tickets: t.tickets, notifications: n.notifications };
  },
  component: BuyerDash,
});

function BuyerDash() {
  const { tickets, notifications } = Route.useLoaderData();

  // Group tickets by raffle
  const byRaffle = new Map<string, { raffle: any; nums: number[] }>();
  for (const t of tickets as any[]) {
    if (!t.raffles) continue;
    const key = t.raffle_id;
    if (!byRaffle.has(key)) byRaffle.set(key, { raffle: t.raffles, nums: [] });
    byRaffle.get(key)!.nums.push(t.ticket_number);
  }
  const groups = Array.from(byRaffle.values());

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div>
        <h2 className="font-display text-2xl font-bold">My tickets</h2>
        {groups.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-10 text-center">
            <Ticket className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">You haven't bought any tickets yet.</p>
            <Link to="/browse" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Browse raffles →</Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {groups.map(({ raffle, nums }) => (
              <Link key={raffle.id} to="/raffles/$id" params={{ id: raffle.id }} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-foreground/30">
                {raffle.hero_image && <img src={raffle.hero_image} className="h-16 w-16 rounded-md object-cover" alt="" />}
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold">{raffle.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground mono-num">
                    Tickets: {nums.sort((a, b) => a - b).map((n) => `#${n}`).join(", ")}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-medium">{raffle.status}</div>
                  <div className="text-muted-foreground">{timeLeft(raffle.deadline)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><Bell className="h-5 w-5" /> Notifications</h2>
        {notifications.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">You're all caught up.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {notifications.map((n: any) => (
              <div key={n.id} className="rounded-lg border border-border bg-card p-3">
                <div className="text-sm font-semibold">{n.title}</div>
                {n.body && <div className="mt-1 text-xs text-muted-foreground mono-num">{n.body}</div>}
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
