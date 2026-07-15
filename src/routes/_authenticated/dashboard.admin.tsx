import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { adminOverview, verifyRaffle, triggerDraw, confirmHandover, refundRaffle, resolveDispute } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { ksh, timeLeft } from "@/lib/format";
import { ShieldCheck, Gavel, Trophy, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  loader: async () => {
    try { return await adminOverview(); }
    catch { return { pending: [], live: [], disputes: [], recentDraws: [], notAdmin: true } as any; }
  },
  component: AdminDash,
});

function AdminDash() {
  const data = Route.useLoaderData() as any;
  if (data.notAdmin) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-muted-foreground">You don't have admin access.</p>
      </div>
    );
  }
  const { pending, live, disputes, recentDraws } = data;

  return (
    <div className="space-y-10">
      <Section title="Pending verifications" icon={ShieldCheck} count={pending.length}>
        {pending.length === 0 ? <Empty>Nothing pending.</Empty> : pending.map((r: any) => <VerifyCard key={r.id} raffle={r} />)}
      </Section>

      <Section title="Live raffles" icon={Trophy} count={live.length}>
        {live.length === 0 ? <Empty>No live raffles.</Empty> : live.map((r: any) => <LiveCard key={r.id} raffle={r} />)}
      </Section>

      <Section title="Open disputes" icon={Gavel} count={disputes.length}>
        {disputes.length === 0 ? <Empty>No open disputes.</Empty> : disputes.map((d: any) => <DisputeCard key={d.id} dispute={d} />)}
      </Section>

      <Section title="Recent draws" icon={RefreshCw} count={recentDraws.length}>
        {recentDraws.length === 0 ? <Empty>No draws yet.</Empty> : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {recentDraws.map((d: any) => (
              <div key={d.id} className="p-3 text-sm">
                <div className="flex justify-between"><span className="font-semibold">{d.raffles?.title ?? d.raffle_id}</span><span className="mono-num">#{d.winning_ticket_number}</span></div>
                <div className="text-xs text-muted-foreground">{new Date(d.drawn_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, count, children }: any) {
  return (
    <div>
      <h2 className="flex items-center gap-2 font-display text-xl font-bold">
        <Icon className="h-5 w-5 text-primary" /> {title}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs mono-num">{count}</span>
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{children}</div>;
}

function VerifyCard({ raffle }: { raffle: any }) {
  const verify = useServerFn(verifyRaffle);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  async function act(approve: boolean) {
    setBusy(true);
    try {
      await verify({ data: { raffle_id: raffle.id, approve, notes } });
      toast.success(approve ? "Approved — raffle is live" : "Rejected");
      window.location.reload();
    } catch (e) { toast.error(String(e)); } finally { setBusy(false); }
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex gap-4">
        {raffle.hero_image && <img src={raffle.hero_image} className="h-20 w-20 rounded-md object-cover" alt="" />}
        <div className="flex-1">
          <div className="font-display font-semibold">{raffle.title}</div>
          <div className="text-xs text-muted-foreground">{raffle.category} · {ksh(raffle.target_value)} · {raffle.total_tickets} tickets @ {ksh(raffle.ticket_price)}</div>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{raffle.description}</p>
          {raffle.serial_number && <div className="mt-1 text-xs mono-num">SN: {raffle.serial_number}</div>}
        </div>
      </div>
      <Textarea placeholder="Verification notes (optional)…" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-3" rows={2} />
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={() => act(true)} disabled={busy}>Approve &amp; publish</Button>
        <Button size="sm" variant="outline" onClick={() => act(false)} disabled={busy}>Reject</Button>
      </div>
    </div>
  );
}

function LiveCard({ raffle }: { raffle: any }) {
  const draw = useServerFn(triggerDraw);
  const handover = useServerFn(confirmHandover);
  const refund = useServerFn(refundRaffle);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<any>, msg: string) {
    setBusy(true);
    try { await fn(); toast.success(msg); window.location.reload(); }
    catch (e) { toast.error(String(e)); }
    finally { setBusy(false); }
  }

  const isCompleted = raffle.status === "completed";
  const isDrawing   = raffle.status === "drawing";
  const isLive      = raffle.status === "live";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        {raffle.hero_image && (
          <img src={raffle.hero_image} className="h-14 w-14 rounded-md object-cover shrink-0" alt="" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{raffle.title}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider
              ${isCompleted ? "bg-primary/20 text-primary" :
                isDrawing   ? "bg-accent text-accent-foreground" :
                              "bg-muted text-muted-foreground"}`}>
              {raffle.status.replace("_", " ")}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground mono-num">
            {raffle.tickets_sold}/{raffle.total_tickets} tickets · {timeLeft(raffle.deadline)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {/* Draw button — only when live or drawing */}
        {(isLive || isDrawing) && (
          <Button
            size="sm" variant="outline" disabled={busy}
            onClick={() => run(() => draw({ data: { raffle_id: raffle.id } }), "Draw complete — winner selected!")}
          >
            Trigger draw
          </Button>
        )}

        {/* Handover button — only after draw completed */}
        {isCompleted && (
          <Button
            size="sm" disabled={busy}
            onClick={() => run(() => handover({ data: { raffle_id: raffle.id } }), "Handover confirmed — payout released")}
          >
            Confirm handover &amp; release payout
          </Button>
        )}

        {/* Refund — available on live, drawing, or completed */}
        <Button
          size="sm" variant="outline" disabled={busy}
          className="text-destructive hover:bg-destructive/10"
          onClick={() => run(() => refund({ data: { raffle_id: raffle.id } }), "Raffle refunded — buyers notified")}
        >
          Issue refund
        </Button>
      </div>
    </div>
  );
}

function DisputeCard({ dispute }: { dispute: any }) {
  const resolve = useServerFn(resolveDispute);
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);
  async function act(status: "resolved" | "rejected") {
    setBusy(true);
    try {
      await resolve({ data: { dispute_id: dispute.id, resolution, status } });
      toast.success("Updated");
      window.location.reload();
    } catch (e) { toast.error(String(e)); } finally { setBusy(false); }
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-semibold">{dispute.raffles?.title ?? "Dispute"}</div>
      <p className="mt-1 text-sm text-muted-foreground">{dispute.description}</p>
      <Textarea placeholder="Resolution…" value={resolution} onChange={(e) => setResolution(e.target.value)} className="mt-2" rows={2} />
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={() => act("resolved")} disabled={busy}>Resolve</Button>
        <Button size="sm" variant="outline" onClick={() => act("rejected")} disabled={busy}>Reject</Button>
      </div>
    </div>
  );
}
