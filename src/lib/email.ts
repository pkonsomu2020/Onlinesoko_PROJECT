/**
 * OnlineSoko — Email helper via Resend
 * Used for transactional emails: winner notifications, payout alerts, etc.
 * Auth emails (confirmation, password reset) are sent by Supabase directly
 * using Resend SMTP — configured in Supabase Dashboard → Project Settings → Auth → SMTP.
 *
 * Usage (server functions only — never call from client code):
 *   import { sendEmail } from "@/lib/email";
 *   await sendEmail({ to: "user@example.com", subject: "You won!", html: "<p>...</p>" });
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@unconquered.co.ke";
const FROM_NAME = process.env.RESEND_FROM_NAME ?? "OnlineSoko";

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string; // plain-text fallback (optional)
}

export async function sendEmail(payload: EmailPayload): Promise<{ id: string }> {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set. Add it to your environment variables.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      ...(payload.text ? { text: payload.text } : {}),
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Resend error ${res.status}: ${error}`);
  }

  return res.json() as Promise<{ id: string }>;
}

// ── Pre-built email templates ─────────────────────────────────────────────

export function winnerEmail(opts: {
  winnerName: string;
  raffleTitle: string;
  ticketNumber: number;
  adminEmail: string;
}) {
  return {
    subject: `🎉 You won "${opts.raffleTitle}" on OnlineSoko!`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#00A651">Congratulations, ${opts.winnerName}!</h2>
        <p>Your ticket <strong>#${opts.ticketNumber}</strong> won the raffle for
           <strong>${opts.raffleTitle}</strong>.</p>
        <p>Our admin will contact you at this email to arrange item handover.
           You can also reach us at
           <a href="mailto:${opts.adminEmail}">${opts.adminEmail}</a>.</p>
        <p>Please respond within <strong>7 days</strong> to claim your item.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:12px;color:#888">
          OnlineSoko · unconquered.co.ke · Verified item raffles, verifiably fair.
        </p>
      </div>
    `,
  };
}

export function payoutReleasedEmail(opts: {
  sellerName: string;
  raffleTitle: string;
  netPayout: number;
}) {
  const ksh = (n: number) => `KSh ${n.toLocaleString()}`;
  return {
    subject: `Payout released — ${ksh(opts.netPayout)} for "${opts.raffleTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#00A651">Your payout has been released</h2>
        <p>Hi ${opts.sellerName},</p>
        <p>Item handover for <strong>${opts.raffleTitle}</strong> has been confirmed.</p>
        <p>Payout amount: <strong>${ksh(opts.netPayout)}</strong> (after 15% platform fee)</p>
        <p>Funds have been released to your account.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:12px;color:#888">
          OnlineSoko · unconquered.co.ke
        </p>
      </div>
    `,
  };
}
