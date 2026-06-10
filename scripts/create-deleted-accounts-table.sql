CREATE TABLE IF NOT EXISTS public.deleted_accounts (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id        uuid,
  name            text,
  email           text,
  phone           text,
  business_name   text,
  location        text,
  total_trips     integer     DEFAULT 0,
  total_clients   integer     DEFAULT 0,
  joined_at       timestamptz,
  deleted_at      timestamptz DEFAULT now(),
  follow_up_notes text        -- Brett/Kam can add notes after follow-up call
);

-- Only service role can read/write this table
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;
