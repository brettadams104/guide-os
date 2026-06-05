-- Add optional detail fields to live catches
alter table public.trip_live_catches
  add column size_inches numeric,
  add column weight_lbs numeric,
  add column caught_on text;

-- Add lure/bait presets to guides (same pattern as species_presets)
alter table public.guides add column lure_presets text[] not null default '{}';
