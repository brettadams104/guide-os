CREATE TABLE IF NOT EXISTS public.guide_events (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id   uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      text        NOT NULL,
  event_date date        NOT NULL,
  start_time text,
  end_time   text,
  notes      text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.guide_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guides manage own events" ON public.guide_events
  USING (auth.uid() = guide_id)
  WITH CHECK (auth.uid() = guide_id);
