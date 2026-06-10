-- =====================================================================
-- Gabrielle & Kris wedding site — Supabase schema (Phase 1)
-- Run this once in the Supabase SQL editor (Project > SQL Editor).
--
-- Model: anyone who signs in with Google can read AND write the shared
-- family data (favorites, notes, pins, image slots). There's no
-- per-person ownership of these — they're a shared family scratchpad.
-- If you later want to restrict sign-in to specific people, do that in
-- Authentication > Providers / Auth Hooks (e.g. an email allowlist),
-- not here.
-- =====================================================================

-- ---------------- profiles ----------------
-- One row per signed-in user, auto-created on first sign-in.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by any signed-in user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can upsert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------- favorites ----------------
-- One shared Love/Maybe/Info status per venue.
create table if not exists public.favorites (
  venue_id text primary key,
  status text not null check (status in ('love', 'maybe', 'info')),
  updated_by uuid references auth.users (id),
  updated_by_name text,
  updated_at timestamptz not null default now()
);

alter table public.favorites enable row level security;

create policy "favorites readable by signed-in users"
  on public.favorites for select to authenticated using (true);

create policy "favorites writable by signed-in users"
  on public.favorites for all to authenticated
  using (true) with check (true);

-- ---------------- notes ----------------
-- One shared notes textarea per venue.
create table if not exists public.notes (
  venue_id text primary key,
  body text not null default '',
  updated_by uuid references auth.users (id),
  updated_by_name text,
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "notes readable by signed-in users"
  on public.notes for select to authenticated using (true);

create policy "notes writable by signed-in users"
  on public.notes for all to authenticated
  using (true) with check (true);

-- ---------------- inspiration board pins ----------------
create table if not exists public.pins (
  id text primary key,
  venue_id text not null,
  venue_name text,
  cat text,
  caption text,
  created_by uuid references auth.users (id),
  created_by_name text,
  created_at timestamptz not null default now()
);

alter table public.pins enable row level security;

create policy "pins readable by signed-in users"
  on public.pins for select to authenticated using (true);

create policy "pins writable by signed-in users"
  on public.pins for all to authenticated
  using (true) with check (true);

-- ---------------- image slot positions (Supabase Storage-backed photos) ----------------
create table if not exists public.image_slots (
  id text primary key,
  url text not null,
  scale numeric not null default 1,
  x numeric not null default 0,
  y numeric not null default 0,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

alter table public.image_slots enable row level security;

create policy "image_slots readable by signed-in users"
  on public.image_slots for select to authenticated using (true);

create policy "image_slots writable by signed-in users"
  on public.image_slots for all to authenticated
  using (true) with check (true);

-- ---------------- storage bucket for uploaded photos ----------------
insert into storage.buckets (id, name, public)
values ('wedding-photos', 'wedding-photos', true)
on conflict (id) do nothing;

create policy "wedding-photos public read"
  on storage.objects for select
  using (bucket_id = 'wedding-photos');

create policy "wedding-photos writable by signed-in users"
  on storage.objects for all to authenticated
  using (bucket_id = 'wedding-photos')
  with check (bucket_id = 'wedding-photos');
