import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const schema = z.object({
  raffle_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  method: z.enum(["mpesa", "card"]),
});

export const buyTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => schema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: raffle, error: rErr } = await context.supabase
      .from("raffles").select("id, ticket_price, total_tickets, tickets_sold, status")
      .eq("id", data.raffle_id).maybeSingle();
    if (rErr || !raffle) throw new Error("Raffle not found");
    if (raffle.status !== "live") throw new Error("Raffle is not accepting tickets");
    if (raffle.tickets_sold + data.quantity > raffle.total_tickets) {
      throw new Error("Not enough tickets remaining");
    }

    const amount = Number(raffle.ticket_price) * data.quantity;

    // Create held payment (mocked)
    const { data: payment, error: pErr } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: context.userId,
        raffle_id: raffle.id,
        amount,
        type: "ticket_purchase",
        status: "held",
        reference: `MOCK-${data.method.toUpperCase()}-${Date.now()}`,
      })
      .select("id")
      .single();
    if (pErr || !payment) throw new Error("Payment failed");

    // Allocate tickets atomically
    const { data: allocated, error: aErr } = await supabaseAdmin.rpc("allocate_tickets", {
      _raffle_id: raffle.id,
      _buyer_id: context.userId,
      _qty: data.quantity,
      _payment_id: payment.id,
    });
    if (aErr) throw new Error(aErr.message);

    // Notify
    await supabaseAdmin.from("notifications").insert({
      user_id: context.userId,
      kind: "tickets_purchased",
      title: `You got ${data.quantity} ticket${data.quantity > 1 ? "s" : ""}`,
      body: `Numbers: ${(allocated as number[]).join(", ")}`,
      payload: { raffle_id: raffle.id, tickets: allocated },
    });

    return { ticket_numbers: allocated as number[], amount };
  });
