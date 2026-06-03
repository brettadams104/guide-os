-- Replace single trip_type with multi-category system
-- Categories: e.g. "Target Species", "Gear Type", "Method"
create table public.guide_trip_categories (
  id uuid default gen_random_uuid() primary key,
  guide_id uuid references public.guides(id) on delete cascade not null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Options under each category: e.g. "Bass", "Walleye" under "Target Species"
create table public.guide_trip_options (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references public.guide_trip_categories(id) on delete cascade not null,
  guide_id uuid references public.guides(id) on delete cascade not null,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Trip selections — one row per option selected on a trip
create table public.trip_type_selections (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  option_id uuid references public.guide_trip_options(id) on delete cascade not null
);

-- RLS
alter table public.guide_trip_categories enable row level security;
alter table public.guide_trip_options enable row level security;
alter table public.trip_type_selections enable row level security;

create policy "categories_own" on public.guide_trip_categories for all to authenticated using (guide_id = auth.uid()) with check (guide_id = auth.uid());
create policy "options_own" on public.guide_trip_options for all to authenticated using (guide_id = auth.uid()) with check (guide_id = auth.uid());
create policy "selections_own" on public.trip_type_selections for all to authenticated
  using (exists (select 1 from public.trips where trips.id = trip_type_selections.trip_id and trips.guide_id = auth.uid()))
  with check (exists (select 1 from public.trips where trips.id = trip_type_selections.trip_id and trips.guide_id = auth.uid()));

-- Indexes
create index on public.guide_trip_categories (guide_id);
create index on public.guide_trip_options (category_id);
create index on public.guide_trip_options (guide_id);
create index on public.trip_type_selections (trip_id);
