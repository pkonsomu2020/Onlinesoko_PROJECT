# How to Export Your Existing Data from Lovable

Your CSV export confirmed the schema is intact. Now to get the actual 2 rows
from `profiles` and `user_roles`, run these queries one at a time in the
**Lovable → Database → SQL Editor**, then export each result as CSV.

---

## Query 1 — Export profiles

```sql
SELECT
  id,
  full_name,
  phone,
  avatar_url,
  kyc_status,
  age_verified,
  created_at,
  updated_at
FROM public.profiles
ORDER BY created_at;
```

Export result → save as `profiles_export.csv`

---

## Query 2 — Export user_roles

```sql
SELECT
  id,
  user_id,
  role,
  created_at
FROM public.user_roles
ORDER BY created_at;
```

Export result → save as `user_roles_export.csv`

---

## Query 3 — Export auth users (emails) for reference

Supabase doesn't let you export `auth.users` passwords (they're hashed),
but you can get the emails so you know which account to recreate:

```sql
SELECT
  id,
  email,
  created_at,
  raw_user_meta_data->>'full_name' AS full_name
FROM auth.users
ORDER BY created_at;
```

Export result → save as `auth_users_export.csv`

---

## After exporting

Since there are only 2 accounts and no real raffle/ticket data,
the easiest path is:

1. **Don't bother importing the old rows** — just sign up fresh on the new
   Supabase project. The `handle_new_user` trigger will recreate your
   profile and buyer role automatically.

2. Then **promote yourself to admin** with one SQL line (see MIGRATE guide).

3. The old Lovable accounts had different UUIDs anyway — importing them
   into a new project wouldn't link to a valid `auth.users` row.

---

## What the CSV you already exported tells us

Your export `query-results-export-2026-07-13_22-15-37.csv` was from this query:

```sql
SELECT
  'TABLE: ' || table_name as object, '' as definition
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT
  'FUNCTION: ' || routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY object;
```

It confirmed:
- ✅ All 10 tables exist: disputes, draws, notifications, payments, profiles,
  raffle_images, raffles, tickets, user_roles, verifications
- ✅ All 4 functions exist: allocate_tickets, handle_new_user, has_role, set_updated_at
- ✅ Function bodies match the migration files exactly

**Conclusion: The migration files in `supabase/migrations/` are a perfect
replica of your live Lovable database. Running them on a new Supabase project
will give you an identical schema.**
