import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Terms, refunds & fair play — OnlineSoko" },
      { name: "description", content: "Age restriction, refund policy, verification requirements, and legal terms for OnlineSoko." },
    ],
  }),
  component: Legal,
});

function Legal() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Terms, refunds &amp; fair play</h1>
      <p className="mt-2 text-muted-foreground">Last updated: 8 July 2026</p>

      <Section title="18+ only">
        OnlineSoko is available only to users who are 18 years or older. Age is verified at signup and again for any high-value winnings before handover.
      </Section>
      <Section title="Item verification">
        No raffle goes live before an admin has verified that the seller possesses the item. Standard-value items require a photo of the item with a hand-written verification code and date. High-value items require in-person or courier verification.
      </Section>
      <Section title="Escrow">
        Ticket payments are held in a platform escrow account. Sellers receive payout only after the draw is complete and admin confirms item handover to the winner. The platform fee is 15% of gross ticket sales.
      </Section>
      <Section title="Sellout policy — stated per raffle">
        Each raffle displays exactly one sellout policy on the listing before the first ticket is sold, and it cannot be changed retroactively:
        <ul className="mt-3 ml-5 list-disc space-y-1">
          <li><b>Extend deadline</b> — the sale extends up to 7 days, then refunds if still not sold out.</li>
          <li><b>Guaranteed draw, proportional payout</b> — the raffle draws regardless; the seller accepts a smaller payout proportional to tickets actually sold.</li>
          <li><b>Full refund</b> — if the minimum ticket threshold isn't met by the deadline, all buyers are refunded and the raffle is cancelled.</li>
        </ul>
      </Section>
      <Section title="Odds">
        Each ticket has an equal 1-in-<i>N</i> chance of winning, where <i>N</i> equals the total tickets actually sold at the time of the draw.
      </Section>
      <Section title="Draw fairness">
        Draws use a commit-reveal scheme combined with a public unpredictable input. Every seed and input is published with the draw. See the <a className="text-primary underline" href="/fairness">Fairness page</a>.
      </Section>
      <Section title="Disputes &amp; refunds">
        Buyers and winners can open a dispute from their dashboard. Admin reviews and issues resolution — refund, release, or escalation — within 7 business days.
      </Section>
      <Section title="Prohibited items">
        Firearms, controlled substances, currency, cryptocurrency, endangered wildlife, stolen goods, digital-only items, and any item requiring a licence the seller cannot demonstrate.
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-2 text-muted-foreground">{children}</div>
    </section>
  );
}
