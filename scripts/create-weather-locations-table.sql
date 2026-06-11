CREATE TABLE IF NOT EXISTS public.guide_weather_locations (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id   uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       text        NOT NULL,
  lat        float       NOT NULL,
  lon        float       NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.guide_weather_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guides manage own weather locations" ON public.guide_weather_locations
  USING (auth.uid() = guide_id)
  WITH CHECK (auth.uid() = guide_id);
