import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles").select("*").eq("id", context.userId).maybeSingle();
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    return {
      profile,
      roles: (roles ?? []).map((r) => r.role),
      userId: context.userId,
    };
  });

export const getMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("tickets")
      .select("id, ticket_number, purchased_at, raffle_id, raffles(id, title, hero_image, status, tickets_sold, total_tickets, deadline)")
      .eq("buyer_id", context.userId)
      .order("purchased_at", { ascending: false });
    return { tickets: data ?? [] };
  });

export const getMyRaffles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("raffles").select("*").eq("seller_id", context.userId)
      .order("created_at", { ascending: false });
    return { raffles: data ?? [] };
  });

export const getMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("notifications").select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(50);
    return { notifications: data ?? [] };
  });
