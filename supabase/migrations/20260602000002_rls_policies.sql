alter table public.guides enable row level security;
alter table public.clients enable row level security;
alter table public.trips enable row level security;
alter table public.trip_catches enable row level security;
alter table public.trip_photos enable row level security;
alter table public.trip_conditions enable row level security;

-- Guides: read own row, write own row only
create policy "guides_read_own" on public.guides for select to authenticated using (auth.uid() = id);
create policy "guides_write_own" on public.guides for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- All other tables: guide owns their data
create policy "clients_own" on public.clients for all to authenticated using (guide_id = auth.uid()) with check (guide_id = auth.uid());
create policy "trips_own" on public.trips for all to authenticated using (guide_id = auth.uid()) with check (guide_id = auth.uid());

create policy "catches_own" on public.trip_catches for all to authenticated
  using (exists (select 1 from public.trips where trips.id = trip_catches.trip_id and trips.guide_id = auth.uid()))
  with check (exists (select 1 from public.trips where trips.id = trip_catches.trip_id and trips.guide_id = auth.uid()));

create policy "photos_own" on public.trip_photos for all to authenticated
  using (exists (select 1 from public.trips where trips.id = trip_photos.trip_id and trips.guide_id = auth.uid()))
  with check (exists (select 1 from public.trips where trips.id = trip_photos.trip_id and trips.guide_id = auth.uid()));

create policy "conditions_own" on public.trip_conditions for all to authenticated
  using (exists (select 1 from public.trips where trips.id = trip_conditions.trip_id and trips.guide_id = auth.uid()))
  with check (exists (select 1 from public.trips where trips.id = trip_conditions.trip_id and trips.guide_id = auth.uid()));
