-- Customizable time slots per guide (e.g. Half Day, Full Day, 6am-12pm)
create table public.guide_time_slots (
  id uuid default gen_random_uuid() primary key,
  guide_id uuid references public.guides(id) on delete cascade not null,
  label text not null,
  start_time text,
  end_time text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Customizable trip types per guide (e.g. Bass Fishing, Walleye, Fly Fishing)
create table public.guide_trip_types (
  id uuid default gen_random_uuid() primary key,
  guide_id uuid references public.guides(id) on delete cascade not null,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Additional guides/staff that can be assigned to trips
create table public.guide_staff (
  id uuid default gen_random_uuid() primary key,
  guide_id uuid references public.guides(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- Add to trips
alter table public.trips add column time_slot_id uuid references public.guide_time_slots(id) on delete set null;
alter table public.trips add column trip_type_id uuid references public.guide_trip_types(id) on delete set null;
alter table public.trips add column assigned_staff_id uuid references public.guide_staff(id) on delete set null;

-- RLS
alter table public.guide_time_slots enable row level security;
alter table public.guide_trip_types enable row level security;
alter table public.guide_staff enable row level security;

create policy "slots_own" on public.guide_time_slots for all to authenticated using (guide_id = auth.uid()) with check (guide_id = auth.uid());
create policy "types_own" on public.guide_trip_types for all to authenticated using (guide_id = auth.uid()) with check (guide_id = auth.uid());
create policy "staff_own" on public.guide_staff for all to authenticated using (guide_id = auth.uid()) with check (guide_id = auth.uid());

-- Indexes
create index on public.guide_time_slots (guide_id);
create index on public.guide_trip_types (guide_id);
create index on public.guide_staff (guide_id);
