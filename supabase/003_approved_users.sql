-- =====================================================================
-- Lock the site to admin-approved family members.
-- Run this once in the Supabase SQL editor (Project > SQL Editor),
-- AFTER schema.sql / 002_venues.sql have already been applied.
--
-- Model: signing in with Google is no longer enough. A user must also
-- have a row in public.approved_users before they can read or write
-- anything (venues, favorites, notes, pins, image slots, profiles).
-- Admins (is_admin = true) can approve/revoke other users from the new
-- admin.html page.
-- =====================================================================

-- ---------------- approved_users ----------------
create table if not exists public.approved_users (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  approved_at timestamptz not null default now(),
  approved_by uuid references auth.users (id)
);

alter table public.approved_users enable row level security;

-- security definer so these can be safely called from inside other
-- tables' RLS policies without recursive-policy issues.
create or replace function public.is_approved()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists(select 1 from public.approved_users where id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.approved_users where id = auth.uid()), false);
$$;

drop policy if exists "approved_users readable by self or admins" on public.approved_users;
create policy "approved_users readable by self or admins"
  on public.approved_users for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "approved_users writable by admins" on public.approved_users;
create policy "approved_users writable by admins"
  on public.approved_users for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------- profiles ----------------
drop policy if exists "profiles are readable by any signed-in user" on public.profiles;
create policy "profiles readable by self or approved users"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or public.is_approved());

-- (insert/update policies on profiles stay self-only, unchanged)

-- ---------------- venues ----------------
drop policy if exists "venues are publicly readable" on public.venues;
create policy "venues readable by approved users"
  on public.venues for select
  to authenticated
  using (public.is_approved());

drop policy if exists "venues writable by signed-in users" on public.venues;
create policy "venues writable by approved users"
  on public.venues for all
  to authenticated
  using (public.is_approved())
  with check (public.is_approved());

-- ---------------- favorites ----------------
drop policy if exists "favorites readable by signed-in users" on public.favorites;
create policy "favorites readable by approved users"
  on public.favorites for select to authenticated
  using (public.is_approved());

drop policy if exists "favorites writable by signed-in users" on public.favorites;
create policy "favorites writable by approved users"
  on public.favorites for all to authenticated
  using (public.is_approved()) with check (public.is_approved());

-- ---------------- notes ----------------
drop policy if exists "notes readable by signed-in users" on public.notes;
create policy "notes readable by approved users"
  on public.notes for select to authenticated
  using (public.is_approved());

drop policy if exists "notes writable by signed-in users" on public.notes;
create policy "notes writable by approved users"
  on public.notes for all to authenticated
  using (public.is_approved()) with check (public.is_approved());

-- ---------------- pins ----------------
drop policy if exists "pins readable by signed-in users" on public.pins;
create policy "pins readable by approved users"
  on public.pins for select to authenticated
  using (public.is_approved());

drop policy if exists "pins writable by signed-in users" on public.pins;
create policy "pins writable by approved users"
  on public.pins for all to authenticated
  using (public.is_approved()) with check (public.is_approved());

-- ---------------- image_slots ----------------
drop policy if exists "image_slots readable by signed-in users" on public.image_slots;
create policy "image_slots readable by approved users"
  on public.image_slots for select to authenticated
  using (public.is_approved());

drop policy if exists "image_slots writable by signed-in users" on public.image_slots;
create policy "image_slots writable by approved users"
  on public.image_slots for all to authenticated
  using (public.is_approved()) with check (public.is_approved());

-- ---------------- wedding-photos storage bucket ----------------
-- Unchanged on purpose: photo files stay public-read (their URLs aren't
-- listed anywhere a logged-out visitor can find), and the existing
-- "writable by signed-in users" policy is left in place. The app-level
-- gate (gate.js) keeps unapproved signed-in users from ever reaching the
-- upload code path.

-- =====================================================================
-- ONE-TIME MANUAL STEP — run these two statements yourself to become the
-- first admin (the SQL editor runs as `postgres` and bypasses RLS, so
-- this is the only way to seed the first row):
--
--   select id, email from auth.users where email = 'christopher.p.kessler@gmail.com';
--
--   insert into public.approved_users (id, is_admin)
--   values ('<id-from-the-query-above>', true);
-- =====================================================================
