create table public.guide_water_gauges (
  id uuid default gen_random_uuid() primary key,
  guide_id uuid references public.guides(id) on delete cascade not null,
  site_no text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  unique(guide_id, site_no)
);

alter table public.guide_water_gauges enable row level security;
create policy "water_gauges_own" on public.guide_water_gauges for all to authenticated
  using (guide_id = auth.uid()) with check (guide_id = auth.uid());

create index on public.guide_water_gauges (guide_id);
