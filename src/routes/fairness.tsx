import { createFileRoute, Link } from "@tanstack/react-router";
import { getFairnessHistory } from "@/lib/raffles.functions";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/fairness")({
  loader: () => getFairnessHistory(),
  head: () => ({
    meta: [
      { title: "Fairness & draw history — OnlineSoko" },
      { name: "description", content: "See how OnlineSoko's verifiable draws work, plus a public history of every past draw." },
      { property: "og:title", content: "Fairness & draw history — OnlineSoko" },
      { property: "og:description", content: "Commit-reveal draws that anyone can audit." },
    ],
  }),
  component: Fairness,
});

function Fairness() {
  const { draws } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <ShieldCheck className="h-3.5 w-3.5" /> Verifiable fairness
      </div>
      <h1 className="mt-3 font-display text-4xl font-bold">Every draw is auditable</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        We don't ask you to trust a random number. Every raffle publishes a commitment before ticket sales close, then reveals the seed publicly at draw time — so anyone can re-run the math.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Step n="1" title="Commit">
          When a raffle is created, the server generates a 32-byte seed and publishes only its <span className="font-semibold">SHA-256 hash</span> (the commit).
        </Step>
        <Step n="2" title="Public beacon">
          After tickets close, we pin a public, unpredictable input — a timestamp beacon (a Bitcoin block hash or a national lottery result in production).
        </Step>
        <Step n="3" title="Reveal &amp; verify">
          We reveal the seed. The winning ticket is <code className="rounded bg-muted px-1 mono-num">HMAC-SHA256(seed, beacon) mod tickets_sold + 1</code>. You can re-compute it locally.
        </Step>
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold">Past draws</h2>
      {draws.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No completed draws yet.</p>
      ) : (
        <div className="mt-4 divide-y divide-border rounded-lg border border-border">
          {draws.map((d: any) => (
            <div key={d.id} className="p-4">
              <div className="flex items-baseline justify-between gap-4">
                <Link to="/raffles/$id" params={{ id: d.raffle_id }} className="font-display text-lg font-semibold hover:text-primary">
                  {d.raffles?.title ?? d.raffle_id}
                </Link>
                <span className="text-xs mono-num text-muted-foreground">{new Date(d.drawn_at).toLocaleString()}</span>
              </div>
              <div className="mt-2 grid gap-2 text-xs mono-num md:grid-cols-2">
                <Field label="Commit hash">{d.commit_hash}</Field>
                <Field label="Winning ticket">#{d.winning_ticket_number}</Field>
                <Field label="Seed revealed">{d.seed_revealed}</Field>
                <Field label="Public input">{d.public_input}</Field>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="font-display text-xs font-semibold text-primary mono-num">STEP {n}</div>
      <div className="mt-1 font-display text-lg font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded bg-muted p-2 break-all">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-foreground">{children}</div>
    </div>
  );
}
