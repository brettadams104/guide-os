-- Guides are the users of the app
create table public.guides (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  business_name text,
  location text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Clients belong to a guide
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  guide_id uuid references public.guides(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

-- Trips belong to a guide and optionally a client
create table public.trips (
  id uuid default gen_random_uuid() primary key,
  guide_id uuid references public.guides(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  trip_date date not null,
  location text,
  notes text,
  price numeric(10,2),
  deposit_paid numeric(10,2) not null default 0,
  amount_collected numeric(10,2) not null default 0,
  payment_method text check (payment_method in ('cash','card','venmo','zelle','check','other')),
  created_at timestamptz not null default now()
);

-- Species caught per trip
create table public.trip_catches (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  species text not null,
  count integer not null default 1
);

-- Photos per trip
create table public.trip_photos (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  url text not null,
  created_at timestamptz not null default now()
);

-- Environmental conditions auto-fetched per trip
create table public.trip_conditions (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null unique,
  temp_high numeric(5,1),
  temp_low numeric(5,1),
  weather text,
  wind_speed numeric(5,1),
  wind_direction text,
  pressure numeric(7,2),
  pressure_trend text check (pressure_trend in ('rising','falling','steady')),
  moon_phase text,
  moon_illumination numeric(5,2),
  sunrise text,
  sunset text
);

-- Auto-create guide profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.guides (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Guide'));
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_catalog;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes
create index on public.clients (guide_id);
create index on public.trips (guide_id);
create index on public.trips (client_id);
create index on public.trips (trip_date);
create index on public.trip_catches (trip_id);
create index on public.trip_photos (trip_id);
