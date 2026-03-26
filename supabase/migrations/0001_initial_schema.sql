-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "pg_trgm";
create extension if not exists "uuid-ossp";

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint categories_name_user_unique unique (user_id, name),
  constraint categories_name_nonempty check (char_length(name) > 0)
);

create index idx_categories_user_order on public.categories(user_id, sort_order);

-- ============================================================
-- FEEDS
-- ============================================================
create table public.feeds (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  feed_url        text not null,
  site_url        text,
  title           text not null,
  custom_title    text,
  description     text,
  favicon_url     text,
  format          text check (format in ('rss2', 'atom', 'rdf')),
  status          text not null default 'active' check (status in ('active', 'stale', 'error')),
  last_fetched_at timestamptz,
  last_error      text,
  error_count     integer not null default 0,
  etag            text,
  last_modified   text,
  effective_url   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint feeds_url_user_unique unique (user_id, feed_url)
);

create index idx_feeds_user_category on public.feeds(user_id, category_id);
create index idx_feeds_user_status   on public.feeds(user_id, status);

-- ============================================================
-- FEED ITEMS
-- ============================================================
create table public.feed_items (
  id            uuid primary key default uuid_generate_v4(),
  feed_id       uuid not null references public.feeds(id) on delete cascade,
  guid          text not null,
  url           text,
  title         text not null default '(untitled)',
  description   text,
  content_html  text,
  author        text,
  image_url     text,
  published_at  timestamptz,
  fetched_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),

  constraint feed_items_guid_feed_unique unique (feed_id, guid)
);

create index idx_feed_items_feed_date on public.feed_items(feed_id, published_at desc nulls last);
create index idx_feed_items_pagination on public.feed_items(published_at desc nulls last, id);
create index idx_feed_items_title_trgm on public.feed_items using gin(title gin_trgm_ops);
create index idx_feed_items_desc_trgm  on public.feed_items using gin(description gin_trgm_ops);

-- ============================================================
-- READ ITEMS (positive assertion — only rows for READ items)
-- ============================================================
create table public.read_items (
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_id     uuid not null references public.feed_items(id) on delete cascade,
  read_at     timestamptz not null default now(),

  primary key (user_id, item_id)
);

create index idx_read_items_user on public.read_items(user_id);

-- ============================================================
-- BOOKMARKS
-- ============================================================
create table public.bookmarks (
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_id     uuid not null references public.feed_items(id) on delete cascade,
  saved_at    timestamptz not null default now(),

  primary key (user_id, item_id)
);

create index idx_bookmarks_user_date on public.bookmarks(user_id, saved_at desc);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
create table public.user_preferences (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  layout            text not null default 'list' check (layout in ('list', 'card')),
  refresh_interval  integer not null default 30,
  theme             text not null default 'system' check (theme in ('light', 'dark', 'system')),
  font_size         text not null default 'base' check (font_size in ('sm', 'base', 'lg')),
  mark_read_on_open boolean not null default true,
  show_read_items   boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- ITEM SUMMARIES (AI cache)
-- ============================================================
create table public.item_summaries (
  item_id       uuid primary key references public.feed_items(id) on delete cascade,
  summary       text not null,
  model         text not null,
  generated_at  timestamptz not null default now(),
  token_count   integer
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.categories       enable row level security;
alter table public.feeds            enable row level security;
alter table public.feed_items       enable row level security;
alter table public.read_items       enable row level security;
alter table public.bookmarks        enable row level security;
alter table public.user_preferences enable row level security;
alter table public.item_summaries   enable row level security;

create policy "users_own_categories" on public.categories
  for all using (auth.uid() = user_id);

create policy "users_own_feeds" on public.feeds
  for all using (auth.uid() = user_id);

create policy "users_read_own_feed_items" on public.feed_items
  for select using (
    exists (select 1 from public.feeds where id = feed_items.feed_id and user_id = auth.uid())
  );

create policy "users_own_read_items" on public.read_items
  for all using (auth.uid() = user_id);

create policy "users_own_bookmarks" on public.bookmarks
  for all using (auth.uid() = user_id);

create policy "users_own_preferences" on public.user_preferences
  for all using (auth.uid() = user_id);

create policy "users_read_summaries" on public.item_summaries
  for select using (
    exists (
      select 1 from public.feed_items fi
      join public.feeds f on f.id = fi.feed_id
      where fi.id = item_summaries.item_id and f.user_id = auth.uid()
    )
  );

-- ============================================================
-- HELPER FUNCTION: unread counts per user
-- ============================================================
create or replace function get_unread_counts(p_user_id uuid)
returns table(
  feed_id       uuid,
  category_id   uuid,
  unread_count  bigint
)
language sql
security definer
as $$
  select
    fi.feed_id,
    f.category_id,
    count(*) filter (where ri.user_id is null) as unread_count
  from public.feed_items fi
  join public.feeds f on f.id = fi.feed_id and f.user_id = p_user_id
  left join public.read_items ri on ri.item_id = fi.id and ri.user_id = p_user_id
  group by fi.feed_id, f.category_id;
$$;

-- ============================================================
-- TRIGGER: create user_preferences on new user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
