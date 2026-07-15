import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

/**
 * Sends a signup confirmation email via Resend directly.
 * Called right after supabase.auth.signUp() on the client.
 * Supabase still handles the actual token/confirmation link —
 * we just send a branded email that points back to /auth.
 */
export const sendConfirmationEmail = createServerFn({ method: "POST" })
  .validator((i) =>
    z.object({
      email: z.string().email(),
      name: z.string().optional(),
      confirmationUrl: z.string().url(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const displayName = data.name || data.email.split("@")[0];
    const appUrl = process.env.APP_URL ?? "https://unconquered.co.ke";

    await sendEmail({
      to: data.email,
      subject: "Confirm your OnlineSoko account",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e5e0;border-radius:8px;overflow:hidden">
          <!-- Header -->
          <div style="background:#00A651;padding:28px 32px">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.02em">
              OnlineSoko
            </h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px">
              Item raffles, verifiably fair
            </p>
          </div>

          <!-- Body -->
          <div style="padding:32px">
            <h2 style="margin:0 0 12px;font-size:20px;color:#111;font-weight:700">
              Confirm your email address
            </h2>
            <p style="margin:0 0 8px;color:#555;font-size:15px;line-height:1.6">
              Hi ${displayName},
            </p>
            <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6">
              Thanks for creating an account on OnlineSoko. Click the button
              below to confirm your email address and activate your account.
            </p>

            <!-- CTA Button -->
            <a href="${data.confirmationUrl}"
               style="display:inline-block;background:#00A651;color:#fff;text-decoration:none;
                      padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600">
              Confirm my account
            </a>

            <p style="margin:24px 0 0;color:#888;font-size:13px;line-height:1.6">
              This link expires in <strong>24 hours</strong>. If you didn't create
              an account, you can safely ignore this email.
            </p>

            <!-- Fallback link -->
            <p style="margin:16px 0 0;font-size:12px;color:#aaa">
              Button not working? Copy and paste this link into your browser:<br/>
              <a href="${data.confirmationUrl}" style="color:#00A651;word-break:break-all">
                ${data.confirmationUrl}
              </a>
            </p>
          </div>

          <!-- Footer -->
          <div style="padding:20px 32px;background:#f9f9f7;border-top:1px solid #e5e5e0">
            <p style="margin:0;font-size:12px;color:#aaa">
              OnlineSoko · <a href="${appUrl}" style="color:#aaa">${appUrl.replace("https://","")}</a>
              · Verified items · Escrowed funds · 18+ only
            </p>
          </div>
        </div>
      `,
    });

    return { ok: true };
  });

/**
 * Sends a password reset email via Resend.
 * The resetUrl comes from supabase.auth.resetPasswordForEmail()
 */
export const sendPasswordResetEmail = createServerFn({ method: "POST" })
  .validator((i) =>
    z.object({
      email: z.string().email(),
      resetUrl: z.string().url(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const appUrl = process.env.APP_URL ?? "https://unconquered.co.ke";

    await sendEmail({
      to: data.email,
      subject: "Reset your OnlineSoko password",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e5e0;border-radius:8px;overflow:hidden">
          <div style="background:#00A651;padding:28px 32px">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">OnlineSoko</h1>
          </div>
          <div style="padding:32px">
            <h2 style="margin:0 0 16px;font-size:20px;color:#111;font-weight:700">
              Reset your password
            </h2>
            <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6">
              We received a request to reset the password for your account
              (<strong>${data.email}</strong>). Click the button below to set a new password.
            </p>
            <a href="${data.resetUrl}"
               style="display:inline-block;background:#00A651;color:#fff;text-decoration:none;
                      padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600">
              Reset my password
            </a>
            <p style="margin:24px 0 0;color:#888;font-size:13px">
              This link expires in <strong>1 hour</strong>. If you didn't request
              a password reset, ignore this email — your password won't change.
            </p>
          </div>
          <div style="padding:20px 32px;background:#f9f9f7;border-top:1px solid #e5e5e0">
            <p style="margin:0;font-size:12px;color:#aaa">
              OnlineSoko · ${appUrl.replace("https://","")} · 18+ only
            </p>
          </div>
        </div>
      `,
    });

    return { ok: true };
  });
