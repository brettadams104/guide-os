CREATE TABLE IF NOT EXISTS public.feedback (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  email      text,
  category   text,
  message    text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guides can submit feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = guide_id);
