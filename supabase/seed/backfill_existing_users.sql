-- ============================================================
-- OnlineSoko — Backfill existing auth users into public tables
-- Run this in Supabase SQL Editor ONCE after migration.
--
-- This handles users who were created BEFORE the handle_new_user
-- trigger was applied, so they never got a profile or role row.
-- ============================================================

-- STEP 1: Backfill profiles for any auth user missing a profile row
INSERT INTO public.profiles (id, full_name, kyc_status, age_verified, created_at, updated_at)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) AS full_name,
  'unverified'  AS kyc_status,
  false         AS age_verified,
  u.created_at,
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;


-- STEP 2: Backfill buyer role for any auth user missing a role row
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'buyer'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles r
  WHERE r.user_id = u.id AND r.role = 'buyer'
)
ON CONFLICT (user_id, role) DO NOTHING;


-- STEP 3: Promote the admin account
-- Replace the email below with YOUR email (the one you want as admin).
-- Both emails shown are left as buyers unless you change one here.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'cruzeltone@gmail.com'   -- ← change to your admin email
ON CONFLICT (user_id, role) DO NOTHING;


-- STEP 4: Verify — check the results
SELECT
  u.email,
  p.full_name,
  p.kyc_status,
  array_agg(r.role ORDER BY r.role) AS roles
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
GROUP BY u.email, p.full_name, p.kyc_status
ORDER BY u.email;
