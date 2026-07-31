ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS selected boolean NOT NULL DEFAULT true;

ALTER TABLE public.study_plans ADD COLUMN IF NOT EXISTS week_start date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.study_plans ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.study_plans ADD COLUMN IF NOT EXISTS total_hours numeric NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  earned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own achievements" ON public.achievements FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);