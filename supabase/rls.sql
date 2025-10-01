-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies: only owner can select/insert/update own row
create policy if not exists "Profiles are viewable by owners" on public.profiles
  for select using (auth.uid() = id);

create policy if not exists "Profiles insert by owner" on public.profiles
  for insert with check (auth.uid() = id);

create policy if not exists "Profiles update by owner" on public.profiles
  for update using (auth.uid() = id);
