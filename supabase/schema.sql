-- ============================================================================
-- 行者的星球 · 山海皆星辰 (hikerstars.com)
-- Supabase / MemFire Cloud 兼容 PostgreSQL 核心数据架构与 RLS 安全策略
-- ============================================================================

-- 1. 行者星际护照档案表 (profiles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9_-]{2,24}$'),
  display_name text not null default '山海行者',
  avatar_icon text not null default '🪐',
  bio_poem text not null default '把走过的每一段山海，都凝成了一颗发光的星球。',
  outfit text not null default 'mine-host',
  legacy_role text check (legacy_role in ('mine', 'kitty', 'miemie', 'luca')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. 系统保留代号防护触发器
create or replace function public.guard_reserved_handles()
returns trigger
language plpgsql
security definer
as $$
begin
  new.handle := lower(trim(new.handle));
  if new.handle in ('admin', 'system', 'guest', 'api', 'www', 'root') then
    raise exception '该星际代号为系统保留词，请换一个专属代号';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_reserved_handles on public.profiles;
create trigger trg_guard_reserved_handles
before insert or update on public.profiles
for each row execute function public.guard_reserved_handles();

-- 3. 用户自建 3D 徒步星球表 (user_planets) —— 支持造星工坊与后续 EXIF/GPX 自动造星
create table if not exists public.user_planets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  owner_handle text not null,
  owner_name text not null,
  planet_name text not null,
  elevation text not null default '3000m',
  template text not null default 'snow',
  creature text not null default 'siguniang',
  quote text not null default '',
  memory text not null default '',
  waypoints_json jsonb not null default '[]'::jsonb,
  gpx_summary jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_planets_owner_handle on public.user_planets(owner_handle);

-- 4. 星际漂流瓶 & 串门留言表 (planet_notes) —— 支持微信免登录访客与已登录行者全网同步
create table if not exists public.planet_notes (
  id uuid primary key default gen_random_uuid(),
  bucket_key text not null,
  author_id uuid references public.profiles(id) on delete set null,
  author_handle text,
  author_name text not null,
  badge text not null default '🍾 漂流瓶信笺',
  content text not null check (char_length(content) between 1 and 120),
  created_at timestamptz not null default now()
);

create index if not exists idx_planet_notes_bucket on public.planet_notes(bucket_key, created_at desc);

-- 5. 星辰玫瑰计数与足迹表 (planet_roses)
create table if not exists public.planet_roses (
  bucket_key text primary key,
  rose_count integer not null default 12,
  visitor_count integer not null default 1,
  updated_at timestamptz not null default now()
);

-- 原子递增玫瑰数 RPC（允许微信免登录访客一键送玫瑰）
create or replace function public.increment_planet_rose(p_bucket text)
returns integer
language plpgsql
security definer
as $$
declare
  new_val integer;
begin
  insert into public.planet_roses (bucket_key, rose_count, visitor_count, updated_at)
  values (p_bucket, 13, 1, now())
  on conflict (bucket_key)
  do update set rose_count = public.planet_roses.rose_count + 1, updated_at = now()
  returning rose_count into new_val;
  return new_val;
end;
$$;

-- 原子记录访客足迹 RPC
create or replace function public.increment_planet_visitor(p_bucket text)
returns integer
language plpgsql
security definer
as $$
declare
  new_val integer;
begin
  insert into public.planet_roses (bucket_key, rose_count, visitor_count, updated_at)
  values (p_bucket, 12, 2, now())
  on conflict (bucket_key)
  do update set visitor_count = public.planet_roses.visitor_count + 1, updated_at = now()
  returning visitor_count into new_val;
  return new_val;
end;
$$;

-- 6. 3D 球面串门纪念旗表 (planted_flags)
create table if not exists public.planted_flags (
  id uuid primary key default gen_random_uuid(),
  planet_id text not null,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  role_key text not null default 'mine',
  msg text not null check (char_length(msg) between 1 and 60),
  up_vec double precision[3] not null,
  planted_date text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_planted_flags_planet on public.planted_flags(planet_id, created_at desc);

-- 7. 开启 Row Level Security (RLS) 安全策略
alter table public.profiles enable row level security;
alter table public.user_planets enable row level security;
alter table public.planet_notes enable row level security;
alter table public.planet_roses enable row level security;
alter table public.planted_flags enable row level security;

-- Profiles RLS
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- User Planets RLS
drop policy if exists "planets_select_public" on public.user_planets;
create policy "planets_select_public" on public.user_planets for select using (is_public = true or auth.uid() = owner_id);

drop policy if exists "planets_insert_own" on public.user_planets;
create policy "planets_insert_own" on public.user_planets for insert with check (auth.uid() = owner_id);

drop policy if exists "planets_update_own" on public.user_planets;
create policy "planets_update_own" on public.user_planets for update using (auth.uid() = owner_id);

drop policy if exists "planets_delete_own" on public.user_planets;
create policy "planets_delete_own" on public.user_planets for delete using (auth.uid() = owner_id);

-- Planet Notes RLS
drop policy if exists "notes_select_all" on public.planet_notes;
create policy "notes_select_all" on public.planet_notes for select using (true);

drop policy if exists "notes_insert_anyone" on public.planet_notes;
create policy "notes_insert_anyone" on public.planet_notes for insert with check (
  author_id is null or auth.uid() = author_id
);

drop policy if exists "notes_delete_own" on public.planet_notes;
create policy "notes_delete_own" on public.planet_notes for delete using (auth.uid() = author_id);

-- Planet Roses RLS
drop policy if exists "roses_select_all" on public.planet_roses;
create policy "roses_select_all" on public.planet_roses for select using (true);

-- Planted Flags RLS
drop policy if exists "flags_select_all" on public.planted_flags;
create policy "flags_select_all" on public.planted_flags for select using (true);

drop policy if exists "flags_insert_anyone" on public.planted_flags;
create policy "flags_insert_anyone" on public.planted_flags for insert with check (
  author_id is null or auth.uid() = author_id
);

-- 授予 PostgREST 角色 (anon / authenticated) 表级与 RPC 访问权限（RLS 策略负责行级安全控制）
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table
  public.profiles,
  public.user_planets,
  public.planet_notes,
  public.planet_roses,
  public.planted_flags
to anon, authenticated;
grant execute on function public.increment_planet_rose(text) to anon, authenticated;
grant execute on function public.increment_planet_visitor(text) to anon, authenticated;

-- 初始化四大原生宇宙的基准玫瑰与访客数
insert into public.planet_roses (bucket_key, rose_count, visitor_count)
values
  ('mine', 26, 19),
  ('kitty', 24, 16),
  ('miemie', 19, 14),
  ('luca', 18, 12)
on conflict (bucket_key) do nothing;

-- ============================================================================
-- 8. 旅途影像与户外 GPX 轨迹存储桶 (planet-media) 及目录级隔离 RLS
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'planet-media',
  'planet-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/gpx+xml', 'application/xml', 'text/xml', 'text/plain']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "planet_media_public_read" on storage.objects;
create policy "planet_media_public_read" on storage.objects
  for select using (bucket_id = 'planet-media');

drop policy if exists "planet_media_auth_insert" on storage.objects;
create policy "planet_media_auth_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'planet-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "planet_media_auth_update" on storage.objects;
create policy "planet_media_auth_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'planet-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "planet_media_auth_delete" on storage.objects;
create policy "planet_media_auth_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'planet-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

