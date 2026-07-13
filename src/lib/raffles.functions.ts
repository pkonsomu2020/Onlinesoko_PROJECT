import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const getPublicRaffles = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("raffles")
    .select("id, title, category, ticket_price, total_tickets, tickets_sold, status, sellout_policy, deadline, hero_image, target_value")
    .in("status", ["live", "drawing", "completed"])
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) return { raffles: [], error: error.message };
  return { raffles: data ?? [], error: null };
});

export const getRaffleById = createServerFn({ method: "GET" })
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: raffle, error } = await supabase
      .from("raffles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !raffle) return { raffle: null, images: [], draw: null };
    const [{ data: images }, { data: draw }] = await Promise.all([
      supabase.from("raffle_images").select("*").eq("raffle_id", data.id).order("position"),
      supabase.from("draws").select("*").eq("raffle_id", data.id).maybeSingle(),
    ]);
    // Redact sensitive fields
    const { seed_encrypted: _seed, ...safe } = raffle as Record<string, unknown> & { seed_encrypted?: string };
    void _seed;
    return { raffle: safe as Record<string, string | number | boolean | null>, images: images ?? [], draw: draw ?? null };
  });

export const getFairnessHistory = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data } = await supabase
    .from("draws")
    .select("id, raffle_id, commit_hash, seed_revealed, public_input, public_input_source, winning_ticket_number, drawn_at, proof, raffles(title, hero_image)")
    .order("drawn_at", { ascending: false })
    .limit(50);
  return { draws: data ?? [] };
});
