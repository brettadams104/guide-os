-- Live catch entries logged during the trip
create table public.trip_live_catches (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  species text not null,
  count integer not null default 1,
  logged_at timestamptz not null default now()
);

-- RLS
alter table public.trip_live_catches enable row level security;
create policy "live_catches_own" on public.trip_live_catches for all to authenticated
  using (exists (select 1 from public.trips where trips.id = trip_live_catches.trip_id and trips.guide_id = auth.uid()))
  with check (exists (select 1 from public.trips where trips.id = trip_live_catches.trip_id and trips.guide_id = auth.uid()));

create index on public.trip_live_catches (trip_id);

-- Add trip session tracking to trips table
alter table public.trips add column started_at timestamptz;
alter table public.trips add column ended_at timestamptz;
alter table public.trips add column live_notes text;
