import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";

const submitSchema = z.object({
  title: z.string().min(4).max(120),
  description: z.string().min(20).max(4000),
  category: z.string().min(2).max(40),
  target_value: z.number().positive().max(100_000_000),
  ticket_price: z.number().positive().max(1_000_000),
  total_tickets: z.number().int().min(10).max(100_000),
  sellout_policy: z.enum(["extend", "proportional", "refund"]),
  min_tickets_threshold: z.number().int().min(0),
  deadline_iso: z.string(),
  hero_image: z.string().url().or(z.literal("")).optional(),
  serial_number: z.string().max(120).optional(),
  images: z.array(z.string().url()).max(8).optional(),
});

export const submitRaffle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => submitSchema.parse(i))
  .handler(async ({ data, context }) => {
    // Commit-reveal seed
    const seed = randomBytes(32).toString("hex");
    const commit_hash = createHash("sha256").update(seed).digest("hex");

    // Use supabaseAdmin to assign seller role — avoids RLS blocking self-insert
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").insert({
      user_id: context.userId, role: "seller",
    }).throwOnError();

    const { data: raffle, error } = await context.supabase
      .from("raffles")
      .insert({
        seller_id: context.userId,
        title: data.title,
        description: data.description,
        category: data.category,
        target_value: data.target_value,
        ticket_price: data.ticket_price,
        total_tickets: data.total_tickets,
        sellout_policy: data.sellout_policy,
        min_tickets_threshold: data.min_tickets_threshold,
        deadline: data.deadline_iso,
        hero_image: data.hero_image || null,
        serial_number: data.serial_number || null,
        commit_hash,
        seed_encrypted: seed, // NOTE: MVP stores plaintext seed server-side; encrypt in production
        status: "pending_verification",
      })
      .select("id")
      .single();

    if (error || !raffle) throw new Error(error?.message ?? "Failed to create raffle");

    if (data.images?.length) {
      await supabaseAdmin.from("raffle_images").insert(
        data.images.map((url, i) => ({ raffle_id: raffle.id, url, position: i })),
      );
    }

    await supabaseAdmin.from("verifications").insert({
      raffle_id: raffle.id, status: "pending",
    });

    return { id: raffle.id };
  });
