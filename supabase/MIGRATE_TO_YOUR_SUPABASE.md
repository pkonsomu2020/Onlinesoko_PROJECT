# Migrating OnlineSoko from Lovable Cloud → Your Personal Supabase

## The situation

| | Current (Lovable) | Target (yours) |
|---|---|---|
| Supabase project | `xkwtitjdcbdoklhyywyk` (Lovable-managed) | Your personal account |
| Frontend | Lovable Cloud preview | `unconquered.co.ke` (HostPinnacle) |
| Who owns the DB | Lovable | You |

The migration SQL is already written — it lives in the two files Lovable generated:
- `migrations/20260708221204_9f144d3d...sql` — full schema, tables, RLS, triggers, RPCs
- `migrations/20260708221221_0d8aacd0...sql` — security hardening (REVOKE grants)

You just need to create a new Supabase project and run those two files in order.

---

## STEP 1 — Create your personal Supabase project

1. Go to [supabase.com](https://supabase.com) → sign in with your personal email
2. Click **New project** (top right)
3. Fill in:
   - **Name:** `onlinesoko`
   - **Database password:** strong password — save it in a password manager
   - **Region:** `Southeast Asia (Singapore)` — closest to Kenya with good latency
4. Wait ~90 seconds for it to finish provisioning
5. Go to **Project Settings → API** and copy these three values:

```
Project URL:         https://xxxxxxxxxxxx.supabase.co
anon/public key:     eyJ...  (long JWT starting with eyJ)
service_role key:    eyJ...  (different long JWT — keep this SECRET)
Project Reference ID: xxxxxxxxxxxx  (the short ID in the URL)
```

---

## STEP 2 — Run the migrations in SQL Editor

In your new Supabase project → **SQL Editor** (left sidebar):

### 2a. Run migration 1 — full schema

Click **+ New query**, paste the entire contents of:
```
supabase/migrations/20260708221204_9f144d3d-ae03-4103-b54e-105a4215703f.sql
```
Click **Run**. You should see "Success. No rows returned."

This creates: all enums, all 10 tables, all indexes, RLS policies, 
`has_role()`, `handle_new_user()`, `allocate_tickets()`, and `set_updated_at()` functions.

### 2b. Run migration 2 — security hardening

New query, paste the contents of:
```
supabase/migrations/20260708221221_0d8aacd0-1fba-4fdd-bc1a-742d7e801079.sql
```
Click **Run**. This tightens function grants so only `service_role` can call sensitive RPCs.

### 2c. No extra config needed for signup

The `handle_new_user()` trigger will automatically create your profile
and assign the `buyer` role when you sign up. Admin promotion is done
manually in Step 7 below — it takes 10 seconds.

---

## STEP 3 — Configure Auth settings

In Supabase → **Authentication → URL Configuration**:

| Field | Value |
|---|---|
| **Site URL** | `https://unconquered.co.ke` |
| **Redirect URLs** | `https://unconquered.co.ke` |
| | `https://unconquered.co.ke/**` |
| | `http://localhost:5173` (for local dev) |
| | `http://localhost:5173/**` |

---

## STEP 4 — Enable Google Sign-In (optional)

In Supabase → **Authentication → Providers → Google** → enable it.

You'll need a Google OAuth app:
1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URIs:
   ```
   https://YOUR_NEW_PROJECT_ID.supabase.co/auth/v1/callback
   ```
4. Copy the Client ID and Secret into Supabase

---

## STEP 5 — Environment variables

✅ Already done — `.env`, `.env.production`, and `supabase/config.toml`
have all been updated with the real project ID `ocjyllyqgmcyijuczmoh`.

Make sure to also set these in **cPanel → Setup Node.js App → Edit → Environment Variables**
so they are available at runtime without relying on the `.env.production` file on disk.

---

## STEP 6 — Rebuild and redeploy to cPanel

```bash
npm install          # pick up dotenv if not already installed
npm run build        # rebuilds with new Supabase URLs baked into the bundle
```

Then:
1. Upload the new `.output/` folder to cPanel (replace old one)
2. In cPanel → **Setup Node.js App** → edit your app → update environment variables:
   - `SUPABASE_URL` → new URL
   - `SUPABASE_PUBLISHABLE_KEY` → new anon key
   - `SUPABASE_SERVICE_ROLE_KEY` → new service role key
3. Click **Restart**

---

## STEP 7 — Sign up and verify admin access

1. Go to `https://unconquered.co.ke/auth`
2. Sign up with the email you set in Step 2c
3. The `handle_new_user()` trigger fires → creates your profile → assigns `buyer` + `admin` roles
4. Navigate to `/dashboard/admin` — you should see the admin panel

If the auto-promote didn't work, run in SQL Editor:
```sql
-- Find your user ID
SELECT id, email FROM auth.users;

-- Promote to admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('PASTE_YOUR_USER_ID_HERE', 'admin')
ON CONFLICT DO NOTHING;
```

---

## STEP 8 — Migrate existing data (if needed)

From your screenshot, Lovable only has 2 rows each in `profiles` and `user_roles` —
these are just your test accounts. Since you'll create a fresh account on the new project,
**you don't need to migrate any data.** Just sign up fresh.

If you ever need to export data from the old Lovable project before it's deleted:
1. Lovable → Database → SQL Editor
2. Run: `SELECT * FROM profiles;` and `SELECT * FROM user_roles;`
3. Re-insert manually into the new project

---

## Quick reference: what each key does

| Key | Used for | Safe to expose? |
|---|---|---|
| `anon/publishable key` | Client-side Supabase calls, subject to RLS | ✅ Yes — put in `VITE_` vars |
| `service_role key` | Server-side admin operations, bypasses RLS | ❌ No — server only, never in frontend code |
| Database password | Direct Postgres connections | ❌ No — don't put in code |

---

## Troubleshooting

**Error: "type app_role already exists"**  
The migration was run twice. Drop the schema and start fresh, or run on a brand-new project.

**Admin panel shows "You don't have admin access"**  
Run the SQL in Step 7 to manually promote yourself.

**Auth emails going to spam**  
Supabase → Authentication → Email Templates → configure a custom SMTP sender 
(or just check spam for now during testing).

**Google sign-in "redirect_uri_mismatch"**  
The redirect URI in your Google Cloud Console doesn't match. It must be exactly:
`https://YOUR_NEW_PROJECT_ID.supabase.co/auth/v1/callback`
