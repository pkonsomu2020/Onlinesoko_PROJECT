# OnlineSoko MVP — Build Plan

A trust-forward item-raffle marketplace with full backend, mocked payments, and a verifiable commit-reveal draw. Design leans "Trustworthy Kenyan Marketplace" — deep black + Kenyan green (#00A651), warm off-white background, red only for warnings.

## Design system
- Palette tokens: `--background` warm off-white (#F5F5F0), `--foreground` near-black, `--primary` green #00A651, `--destructive` #E63946, `--accent` neutral.
- Fonts: Space Grotesk (headings) + Inter (body) via `@fontsource`.
- Ticket-stub motifs (notched cards) for raffle cards. Countdown pill, live tickets bar.
- One hero image, generated. Category chips, no stock-photo grids.

## Pages / routes
Public
- `/` Home: hero, featured raffles, "how it works", trust strip (verified item, escrowed funds, verifiable draw), CTA.
- `/browse` Browse: filter by category, price, ending soon, sort.
- `/raffles/$id` Raffle detail: gallery, ticket price, tickets sold/remaining, countdown, sellout policy banner, seller card, "Buy tickets" CTA, "How the draw works" + link to proof.
- `/fairness` Public draw history & commit-reveal explainer.
- `/legal` T&Cs, refund/odds/18+ policy.
- `/auth` Sign in / sign up (email+password + Google).

Authenticated (`_authenticated/`)
- `/dashboard/buyer` My tickets, my entries, notifications.
- `/dashboard/seller` Submit item + listings status + payout history.
- `/dashboard/seller/new` Multi-step submission form.
- `/dashboard/admin` Pending verifications, active raffles, draw controls, disputes, payouts (role-gated).

## Data model (Supabase)
Tables with RLS + explicit GRANTs, roles in separate `user_roles` table with `has_role()` security-definer:
- `profiles` (id → auth.users, full_name, phone, kyc_status, age_verified, avatar_url)
- `app_role` enum: `buyer | seller | admin`
- `user_roles` (user_id, role) + `has_role(uid, role)`
- `raffles` (id, seller_id, title, description, category, target_value, ticket_price, total_tickets, tickets_sold, status[`pending_verification|live|drawing|completed|refunded|cancelled`], sellout_policy[`extend|proportional|refund`], min_tickets_threshold, deadline, hero_image, gallery, commit_hash, created_at)
- `raffle_images` (raffle_id, url, position)
- `tickets` (id, raffle_id, buyer_id, ticket_number, purchase_time, payment_id) — unique(raffle_id, ticket_number)
- `payments` (id, user_id, raffle_id, amount, type[`ticket_purchase|payout|refund`], status[`pending|held|released|refunded|failed`], reference)
- `verifications` (raffle_id, admin_id, notes, photo_url, approved_at, status)
- `draws` (raffle_id, commit_hash, seed, public_input, public_input_source, winning_ticket_number, winner_user_id, drawn_at, proof_json)
- `disputes` (id, raffle_id, opened_by, description, status, resolution, created_at)
- `notifications` (id, user_id, kind, payload, read_at)

RLS highlights: buyers read their own tickets/payments; anyone reads `live/completed` raffles + their draw proofs; sellers write their own raffles (status → `pending_verification` only); admins full access via `has_role`.

## Server functions (`src/lib/*.functions.ts`)
- `submitRaffle` (auth) — creates raffle in `pending_verification`, generates commit seed server-side, stores hash publicly.
- `buyTickets` (auth) — MOCK payment: takes qty, allocates next N ticket numbers atomically via RPC, creates `payments` row `status=held`, increments `tickets_sold`. Triggers draw if sold out.
- `triggerDraw` (admin or auto on sellout/deadline) — reveals seed, combines with public input (uses timestamped SHA256 of seed + deadline ISO as placeholder public beacon, documented), computes winning ticket via HMAC mod tickets_sold, writes `draws` row + proof.
- `verifyRaffle` (admin) — flips status to `live`.
- `confirmHandover` (admin) — releases held payment to seller minus 15% platform fee.
- `refundRaffle` (admin/auto) — for min-threshold miss.
- `openDispute` / `resolveDispute` (auth / admin).
- `getPublicRaffles`, `getRaffleById`, `getFairnessHistory` — server publishable client, public reads.

## Draw fairness
- On raffle creation server generates 32-byte seed, stores `sha256(seed)` as `commit_hash` publicly, keeps seed private.
- At draw: seed revealed + public input recorded → `winning_ticket = HMAC_SHA256(seed, public_input) mod tickets_sold + 1`. Full proof JSON stored and rendered on `/fairness` and raffle detail.

## Mock payment flow
"Buy tickets" opens a modal with M-Pesa/card tabs (UI only), a "Simulate payment success" button that calls `buyTickets`. Clear banner: "Payments are simulated — no real money is charged."

## Admin bootstrap
First user to sign up with an env-listed admin email auto-gets `admin` role via trigger; otherwise assigned via SQL by the owner.

## Out of scope (this pass)
Real M-Pesa/Flutterwave, KYC document upload, courier integration, livestreamed physical draw, email/SMS notifications (in-app only).

## Delivery order
1. Enable Cloud, migrations (schema + RLS + roles + RPCs).
2. Design tokens + fonts + shared UI (RaffleCard, CountdownPill, TicketProgress, PolicyBadge).
3. Public pages (Home, Browse, Raffle detail, Fairness, Legal) with real data.
4. Auth + role-based routing.
5. Buyer dashboard + buy-tickets flow (mock).
6. Seller dashboard + submission.
7. Admin dashboard + verify/draw/handover/dispute.
8. Sitemap, robots, SEO metadata per route.
