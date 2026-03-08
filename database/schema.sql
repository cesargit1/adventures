-- AdventuresCalendar (Supabase / Postgres) schema
-- Apply via: npm run db:apply

create extension if not exists pgcrypto;
create extension if not exists postgis;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'adventure_status') then
    create type adventure_status as enum ('draft','scheduled','open','at_capacity','cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'participant_visibility') then
    create type participant_visibility as enum ('public','private');
  end if;

  if not exists (select 1 from pg_type where typname = 'signup_status') then
    create type signup_status as enum ('active','cancelled','removed','pending_payment');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_kind') then
    create type payment_kind as enum ('signup','promotion');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('requires_payment_method','requires_confirmation','requires_action','processing','succeeded','canceled','failed');
  end if;
end
$$;

-- Utility trigger for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  bio text,
  avatar_url text,
  cover_url text,
  city text,
  state text,
  certifications jsonb not null default '[]'::jsonb,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill / evolve columns when the table already exists
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists state text;
alter table public.profiles add column if not exists certifications jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists cover_url text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'certifications'
      and data_type = 'ARRAY'
      and udt_name = '_text'
  ) then
    alter table public.profiles
      alter column certifications drop default;

    alter table public.profiles
      alter column certifications type jsonb
      using to_jsonb(certifications);
  end if;
end
$$;

update public.profiles p
set certifications = coalesce(
  (
    select jsonb_agg(
      case
        when jsonb_typeof(elem) = 'object' then elem
        when jsonb_typeof(elem) = 'string' then jsonb_build_object(
          'title', btrim(trim(both '"' from elem::text)),
          'pdf_url', null,
          'pdf_path', null
        )
        else null
      end
    )
    from jsonb_array_elements(coalesce(p.certifications, '[]'::jsonb)) as elem
    where (
      jsonb_typeof(elem) = 'object'
      and coalesce(btrim(elem->>'title'), '') <> ''
    )
    or (
      jsonb_typeof(elem) = 'string'
      and btrim(trim(both '"' from elem::text)) <> ''
    )
  ),
  '[]'::jsonb
)
where jsonb_typeof(coalesce(p.certifications, '[]'::jsonb)) = 'array';

alter table public.profiles alter column certifications set default '[]'::jsonb;
update public.profiles set certifications = '[]'::jsonb where certifications is null;
alter table public.profiles alter column certifications set not null;

-- Adventures backfill / evolve columns when the table already exists
alter table public.adventures add column if not exists title_slug text;
alter table public.adventures add column if not exists short_id text;
alter table public.adventures alter column short_id set default encode(gen_random_bytes(4), 'hex');
update public.adventures
set short_id = encode(gen_random_bytes(4), 'hex')
where short_id is null;

update public.adventures
set title_slug = lower(trim(both '-' from regexp_replace(regexp_replace(coalesce(title, ''), '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g')))
where title_slug is null or title_slug = '';

alter table public.adventures alter column short_id set not null;
alter table public.adventures add column if not exists slug text generated always as (
  coalesce(nullif(title_slug, ''), 'adventure') || '-' || short_id
) stored;

create unique index if not exists adventures_short_id_unique on public.adventures(short_id);
create unique index if not exists adventures_slug_unique on public.adventures(slug);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Interests (normalized tag catalog + user mapping)
create table if not exists public.interests (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interests_name_not_blank check (length(btrim(name)) > 0),
  constraint interests_slug_not_blank check (length(btrim(slug)) > 0),
  constraint interests_slug_is_lower check (slug = lower(slug))
);

create unique index if not exists interests_name_unique_lower on public.interests (lower(name));
create unique index if not exists interests_slug_unique_lower on public.interests (lower(slug));
create unique index if not exists interests_slug_unique on public.interests (slug);

drop trigger if exists set_interests_updated_at on public.interests;
create trigger set_interests_updated_at
before update on public.interests
for each row execute function public.set_updated_at();

create table if not exists public.profile_interests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  interest_id bigint not null references public.interests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, interest_id)
);

create index if not exists profile_interests_interest_id_idx on public.profile_interests(interest_id);

insert into public.interests (name, slug)
values
  ('Backpacking', 'backpacking'),
  ('Tent Camping', 'tent-camping'),
  ('Offroad Camping', 'offroad-camping'),
  ('Hiking', 'hiking'),
  ('Rock Climbing', 'rock-climbing'),
  ('Kayaking', 'kayaking'),
  ('Mountain Biking', 'mountain-biking'),
  ('Trail Running', 'trail-running'),
  ('Overlanding', 'overlanding'),
  ('Fishing', 'fishing'),
  ('Wildlife Photography', 'wildlife-photography'),
  ('Birdwatching', 'birdwatching'),
  ('Wilderness Survival', 'wilderness-survival')
on conflict (slug) do update
set name = excluded.name;

-- Helper functions (defined after tables exist)

-- Helper: admin check (backed by profiles.is_admin)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- Adventures
create table if not exists public.adventures (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  description text not null,

  adventure_type text not null,
  difficulty text not null,
  required_gear text[],
  host_included text[],
  tags text[] not null default '{}',

  start_at timestamptz not null,
  end_at timestamptz,
  duration_minutes int,
  season text,

  location_name text not null,
  location_city text,
  location_state text,
  location_country text,
  location_country_code char(2),
  location_precise_point geography(Point, 4326),

  max_capacity int not null check (max_capacity > 0),
  cost_dollars int not null default 0 check (cost_dollars >= 0),
  currency text not null default 'USD',

  status adventure_status not null default 'draft',
  participant_visibility participant_visibility not null default 'public',

  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),

  cover_image_path text,

  search_tsv tsvector generated always as (
    to_tsvector('english',
      coalesce(title,'') || ' ' ||
      coalesce(description,'') || ' ' ||
      coalesce(location_name,'')
    )
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- URL fields
  title_slug text,
  short_id text not null default encode(gen_random_bytes(4), 'hex'),
  slug text generated always as (
    coalesce(nullif(title_slug, ''), 'adventure') || '-' || short_id
  ) stored
);

alter table public.adventures add column if not exists host_included text[];

create index if not exists adventures_host_id_idx on public.adventures(host_id);
create index if not exists adventures_start_at_idx on public.adventures(start_at);
create index if not exists adventures_status_idx on public.adventures(status);
create index if not exists adventures_tags_gin on public.adventures using gin(tags);
create index if not exists adventures_search_gin on public.adventures using gin(search_tsv);
create index if not exists adventures_location_gist on public.adventures using gist(location_precise_point);

create unique index if not exists adventures_short_id_unique on public.adventures(short_id);
create unique index if not exists adventures_slug_unique on public.adventures(slug);

drop trigger if exists set_adventures_updated_at on public.adventures;
create trigger set_adventures_updated_at
before update on public.adventures
for each row execute function public.set_updated_at();

-- Signups
create table if not exists public.adventure_signups (
  id uuid primary key default gen_random_uuid(),
  adventure_id uuid not null references public.adventures(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,

  status signup_status not null default 'active',
  seats smallint not null default 1 check (seats > 0),

  payment_id uuid,

  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  removed_at timestamptz,
  removed_by uuid references public.profiles(id)
);

create index if not exists signups_adventure_id_idx on public.adventure_signups(adventure_id);
create index if not exists signups_user_id_idx on public.adventure_signups(user_id);
create index if not exists signups_status_idx on public.adventure_signups(status);

-- Prevent duplicate active/pending signups per user/adventure
create unique index if not exists signups_unique_active_per_user
  on public.adventure_signups(adventure_id, user_id)
  where status in ('active','pending_payment');

-- Helper: is current user the host of the adventure?
create or replace function public.is_host_of_adventure(adventure_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.adventures a
    where a.id = adventure_id
      and a.host_id = auth.uid()
  );
$$;

-- Helper: can current user review this adventure?
create or replace function public.can_review(adventure_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.adventure_signups s
    join public.adventures a on a.id = s.adventure_id
    where s.adventure_id = adventure_id
      and s.user_id = auth.uid()
      and s.status = 'active'
      and a.approved_at is not null
      and a.status <> 'draft'
  );
$$;

-- Comments
create table if not exists public.adventure_comments (
  id uuid primary key default gen_random_uuid(),
  adventure_id uuid not null references public.adventures(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists comments_adventure_id_idx on public.adventure_comments(adventure_id);
create index if not exists comments_author_id_idx on public.adventure_comments(author_id);

drop trigger if exists set_comments_updated_at on public.adventure_comments;
create trigger set_comments_updated_at
before update on public.adventure_comments
for each row execute function public.set_updated_at();

-- Reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  adventure_id uuid not null references public.adventures(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,

  rating smallint not null check (rating between 1 and 5),
  body text,

  created_at timestamptz not null default now()
);

create unique index if not exists reviews_one_per_adventure_user
  on public.reviews(adventure_id, reviewer_id);

create index if not exists reviews_host_id_idx on public.reviews(host_id);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  adventure_id uuid references public.adventures(id) on delete set null,

  kind payment_kind not null,
  amount_cents int not null check (amount_cents >= 0),
  platform_fee_cents int not null default 0 check (platform_fee_cents >= 0),
  currency text not null default 'USD',

  provider text not null default 'stripe',
  provider_ref text,
  status payment_status not null default 'processing',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conname = 'adventure_signups_payment_id_fkey'
      and c.conrelid = 'public.adventure_signups'::regclass
  ) then
    alter table public.adventure_signups
      add constraint adventure_signups_payment_id_fkey
      foreign key (payment_id) references public.payments(id) on delete set null;
  end if;
end
$$;

-- Promotions
create table if not exists public.adventure_promotions (
  id uuid primary key default gen_random_uuid(),
  adventure_id uuid not null references public.adventures(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_promotions_updated_at on public.adventure_promotions;
create trigger set_promotions_updated_at
before update on public.adventure_promotions
for each row execute function public.set_updated_at();

create index if not exists promotions_adventure_id_idx on public.adventure_promotions(adventure_id);
create index if not exists promotions_ends_at_idx on public.adventure_promotions(ends_at);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_at_idx on public.notifications(read_at);

-- Saves / Follows (used by dashboard UI later)
create table if not exists public.adventure_saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  adventure_id uuid not null references public.adventures(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, adventure_id)
);

create table if not exists public.user_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- -----------------
-- Row Level Security
-- -----------------

alter table public.profiles enable row level security;
alter table public.adventures enable row level security;
alter table public.adventure_signups enable row level security;
alter table public.adventure_comments enable row level security;
alter table public.reviews enable row level security;
alter table public.payments enable row level security;
alter table public.adventure_promotions enable row level security;
alter table public.notifications enable row level security;
alter table public.adventure_saves enable row level security;
alter table public.user_follows enable row level security;
alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;

-- Profiles
drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public
on public.profiles
for select
to public
using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Adventures
drop policy if exists adventures_select_public on public.adventures;
create policy adventures_select_public
on public.adventures
for select
to public
using (
  (approved_at is not null and status <> 'draft')
  or host_id = auth.uid()
  or public.is_admin()
);

drop policy if exists adventures_insert_host on public.adventures;
create policy adventures_insert_host
on public.adventures
for insert
to authenticated
with check (host_id = auth.uid());

drop policy if exists adventures_update_host_or_admin on public.adventures;
create policy adventures_update_host_or_admin
on public.adventures
for update
to authenticated
using (host_id = auth.uid() or public.is_admin())
with check (host_id = auth.uid() or public.is_admin());

drop policy if exists adventures_delete_host_or_admin on public.adventures;
create policy adventures_delete_host_or_admin
on public.adventures
for delete
to authenticated
using (host_id = auth.uid() or public.is_admin());

-- Signups
drop policy if exists signups_select_owner_host_admin on public.adventure_signups;
create policy signups_select_owner_host_admin
on public.adventure_signups
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_host_of_adventure(adventure_id)
  or public.is_admin()
);

drop policy if exists signups_select_public_visible on public.adventure_signups;
create policy signups_select_public_visible
on public.adventure_signups
for select
to public
using (
  exists (
    select 1
    from public.adventures a
    where a.id = adventure_id
      and a.participant_visibility = 'public'
      and a.approved_at is not null
      and a.status <> 'draft'
  )
);

drop policy if exists signups_insert_self on public.adventure_signups;
create policy signups_insert_self
on public.adventure_signups
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists signups_update_owner_host_admin on public.adventure_signups;
create policy signups_update_owner_host_admin
on public.adventure_signups
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_host_of_adventure(adventure_id)
  or public.is_admin()
)
with check (
  user_id = auth.uid()
  or public.is_host_of_adventure(adventure_id)
  or public.is_admin()
);

-- Comments
drop policy if exists comments_select_visible on public.adventure_comments;
create policy comments_select_visible
on public.adventure_comments
for select
to public
using (
  exists (
    select 1 from public.adventures a
    where a.id = adventure_id
      and (
        (a.approved_at is not null and a.status <> 'draft')
        or a.host_id = auth.uid()
        or public.is_admin()
      )
  )
);

drop policy if exists comments_insert_self on public.adventure_comments;
create policy comments_insert_self
on public.adventure_comments
for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists comments_update_author_host_admin on public.adventure_comments;
create policy comments_update_author_host_admin
on public.adventure_comments
for update
to authenticated
using (
  author_id = auth.uid()
  or public.is_host_of_adventure(adventure_id)
  or public.is_admin()
)
with check (
  author_id = auth.uid()
  or public.is_host_of_adventure(adventure_id)
  or public.is_admin()
);

-- Reviews
drop policy if exists reviews_select_public on public.reviews;
create policy reviews_select_public
on public.reviews
for select
to public
using (true);

drop policy if exists reviews_insert_if_eligible on public.reviews;
create policy reviews_insert_if_eligible
on public.reviews
for insert
to authenticated
with check (
  reviewer_id = auth.uid()
  and public.can_review(adventure_id)
);

-- Payments (read-only to user; writes expected via service role / admin)
drop policy if exists payments_select_owner_or_admin on public.payments;
create policy payments_select_owner_or_admin
on public.payments
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Promotions (host/admin)
drop policy if exists promotions_select_public on public.adventure_promotions;
create policy promotions_select_public
on public.adventure_promotions
for select
to public
using (true);

drop policy if exists promotions_write_host_or_admin on public.adventure_promotions;
create policy promotions_write_host_or_admin
on public.adventure_promotions
for all
to authenticated
using (host_id = auth.uid() or public.is_admin())
with check (host_id = auth.uid() or public.is_admin());

-- Notifications
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- Saves
drop policy if exists saves_select_own on public.adventure_saves;
create policy saves_select_own
on public.adventure_saves
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists saves_write_own on public.adventure_saves;
create policy saves_write_own
on public.adventure_saves
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Follows
drop policy if exists follows_select_public on public.user_follows;
create policy follows_select_public
on public.user_follows
for select
to public
using (true);

drop policy if exists follows_write_self on public.user_follows;
create policy follows_write_self
on public.user_follows
for all
to authenticated
using (follower_id = auth.uid())
with check (follower_id = auth.uid());

-- Interests catalog
drop policy if exists interests_select_public on public.interests;
create policy interests_select_public
on public.interests
for select
to public
using (true);

drop policy if exists interests_write_admin on public.interests;
create policy interests_write_admin
on public.interests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Profile interests mapping
drop policy if exists profile_interests_select_public on public.profile_interests;
create policy profile_interests_select_public
on public.profile_interests
for select
to public
using (true);

drop policy if exists profile_interests_insert_owner_or_admin on public.profile_interests;
create policy profile_interests_insert_owner_or_admin
on public.profile_interests
for insert
to authenticated
with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists profile_interests_delete_owner_or_admin on public.profile_interests;
create policy profile_interests_delete_owner_or_admin
on public.profile_interests
for delete
to authenticated
using (profile_id = auth.uid() or public.is_admin());
