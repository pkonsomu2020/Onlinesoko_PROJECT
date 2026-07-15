import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { createHash, createHmac } from "crypto";

const PLATFORM_FEE = 0.15;

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId, _role: "admin",
  });
  if (!data) throw new Error("Forbidden: admin only");
}

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: pending }, { data: live }, { data: disputes }, { data: draws }] = await Promise.all([
      supabaseAdmin.from("raffles").select("*, verifications(*)").eq("status", "pending_verification").order("created_at", { ascending: false }),
      supabaseAdmin.from("raffles").select("*").in("status", ["live", "drawing", "completed"]).order("deadline"),
      supabaseAdmin.from("disputes").select("*, raffles(title)").eq("status", "open").order("created_at", { ascending: false }),
      supabaseAdmin.from("draws").select("*, raffles(title)").order("drawn_at", { ascending: false }).limit(10),
    ]);
    return {
      pending: pending ?? [],
      live: live ?? [],
      disputes: disputes ?? [],
      recentDraws: draws ?? [],
    };
  });

export const verifyRaffle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    raffle_id: z.string().uuid(),
    approve: z.boolean(),
    notes: z.string().max(1000).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("verifications").update({
      admin_id: context.userId,
      status: data.approve ? "approved" : "rejected",
      notes: data.notes ?? null,
      reviewed_at: new Date().toISOString(),
    }).eq("raffle_id", data.raffle_id);
    await supabaseAdmin.from("raffles").update({
      status: data.approve ? "live" : "cancelled",
    }).eq("id", data.raffle_id);
    return { ok: true };
  });

export const triggerDraw = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ raffle_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: raffle } = await supabaseAdmin
      .from("raffles").select("*").eq("id", data.raffle_id).single();
    if (!raffle) throw new Error("Not found");
    if (raffle.tickets_sold < 1) throw new Error("No tickets sold");

    // Public input beacon: SHA256 of deadline ISO + a fresh timestamp published now.
    // In production, use a Bitcoin block hash or national lottery result.
    const publicInputSource = `beacon:${new Date().toISOString()}`;
    const publicInput = createHash("sha256").update(publicInputSource).digest("hex");
    const seed = raffle.seed_encrypted;
    const digest = createHmac("sha256", seed).update(publicInput).digest();
    const winning = (digest.readUInt32BE(0) % raffle.tickets_sold) + 1;

    const { data: winner } = await supabaseAdmin
      .from("tickets").select("buyer_id").eq("raffle_id", raffle.id).eq("ticket_number", winning).maybeSingle();

    const proof = {
      algorithm: "HMAC-SHA256(seed, sha256(public_input_source)) mod tickets_sold + 1",
      commit_hash: raffle.commit_hash,
      seed_revealed: seed,
      public_input_source: publicInputSource,
      public_input: publicInput,
      tickets_sold: raffle.tickets_sold,
      winning_ticket_number: winning,
      verify_commit: `sha256(seed_revealed) === commit_hash`,
    };

    await supabaseAdmin.from("draws").insert({
      raffle_id: raffle.id,
      commit_hash: raffle.commit_hash,
      seed_revealed: seed,
      public_input: publicInput,
      public_input_source: publicInputSource,
      winning_ticket_number: winning,
      winner_user_id: winner?.buyer_id ?? null,
      proof,
    });

    await supabaseAdmin.from("raffles").update({ status: "completed" }).eq("id", raffle.id);

    if (winner?.buyer_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: winner.buyer_id,
        kind: "raffle_won",
        title: "🎉 You won!",
        body: `Your ticket #${winning} won "${raffle.title}". Admin will contact you for handover.`,
        payload: { raffle_id: raffle.id, ticket_number: winning },
      });

      // Send winner email via Resend
      try {
        const { data: winnerProfile } = await supabaseAdmin
          .from("profiles").select("full_name").eq("id", winner.buyer_id).maybeSingle();
        const { data: winnerUser } = await supabaseAdmin.auth.admin
          .getUserById(winner.buyer_id);
        if (winnerUser.user?.email) {
          const { sendEmail, winnerEmail } = await import("@/lib/email");
          await sendEmail({
            to: winnerUser.user.email,
            ...winnerEmail({
              winnerName: winnerProfile?.full_name ?? winnerUser.user.email,
              raffleTitle: raffle.title,
              ticketNumber: winning,
              adminEmail: "admin@unconquered.co.ke",
            }),
          });
        }
      } catch (emailErr) {
        // Non-fatal — log but don't fail the draw
        console.error("[OnlineSoko] Winner email failed:", emailErr);
      }
    }
    return { winning_ticket_number: winning };
  });

export const confirmHandover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ raffle_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: raffle } = await supabaseAdmin.from("raffles").select("*").eq("id", data.raffle_id).single();
    if (!raffle) throw new Error("Not found");
    const gross = Number(raffle.ticket_price) * raffle.tickets_sold;
    const fee = gross * PLATFORM_FEE;
    const net = gross - fee;
    await supabaseAdmin.from("payments").update({ status: "released" }).eq("raffle_id", data.raffle_id).eq("type", "ticket_purchase");
    await supabaseAdmin.from("payments").insert({
      user_id: raffle.seller_id, raffle_id: raffle.id, amount: net, type: "payout", status: "released",
      reference: `PAYOUT-${Date.now()}`,
    });
    await supabaseAdmin.from("notifications").insert({
      user_id: raffle.seller_id, kind: "payout_released",
      title: `Payout released: KSh ${net.toLocaleString()}`,
      body: `Handover confirmed for "${raffle.title}". Platform fee ${(PLATFORM_FEE * 100).toFixed(0)}%.`,
    });

    // Send payout email via Resend
    try {
      const { data: sellerProfile } = await supabaseAdmin
        .from("profiles").select("full_name").eq("id", raffle.seller_id).maybeSingle();
      const { data: sellerUser } = await supabaseAdmin.auth.admin
        .getUserById(raffle.seller_id);
      if (sellerUser.user?.email) {
        const { sendEmail, payoutReleasedEmail } = await import("@/lib/email");
        await sendEmail({
          to: sellerUser.user.email,
          ...payoutReleasedEmail({
            sellerName: sellerProfile?.full_name ?? sellerUser.user.email,
            raffleTitle: raffle.title,
            netPayout: net,
          }),
        });
      }
    } catch (emailErr) {
      console.error("[OnlineSoko] Payout email failed:", emailErr);
    }

    return { gross, fee, net };
  });

export const refundRaffle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ raffle_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get raffle title + all buyers before refunding
    const { data: raffle } = await supabaseAdmin
      .from("raffles").select("title").eq("id", data.raffle_id).single();

    const { data: tickets } = await supabaseAdmin
      .from("tickets").select("buyer_id").eq("raffle_id", data.raffle_id);

    await supabaseAdmin.from("payments")
      .update({ status: "refunded" })
      .eq("raffle_id", data.raffle_id)
      .eq("type", "ticket_purchase");

    await supabaseAdmin.from("raffles")
      .update({ status: "refunded" })
      .eq("id", data.raffle_id);

    // Notify every unique buyer
    const uniqueBuyers = [...new Set((tickets ?? []).map((t) => t.buyer_id))];
    if (uniqueBuyers.length > 0) {
      await supabaseAdmin.from("notifications").insert(
        uniqueBuyers.map((buyer_id) => ({
          user_id: buyer_id,
          kind: "raffle_refunded",
          title: `Raffle refunded: "${raffle?.title ?? "Unknown"}"`,
          body: "Your tickets have been refunded. Funds will be returned to your original payment method.",
          payload: { raffle_id: data.raffle_id },
        })),
      );
    }

    return { ok: true, buyers_notified: uniqueBuyers.length };
  });

export const resolveDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    dispute_id: z.string().uuid(),
    resolution: z.string().max(2000),
    status: z.enum(["resolved", "rejected"]),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("disputes").update({
      resolution: data.resolution, status: data.status,
    }).eq("id", data.dispute_id);
    return { ok: true };
  });
