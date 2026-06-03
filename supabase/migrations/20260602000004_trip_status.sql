alter table public.trips add column status text not null default 'completed' check (status in ('scheduled', 'completed'));
