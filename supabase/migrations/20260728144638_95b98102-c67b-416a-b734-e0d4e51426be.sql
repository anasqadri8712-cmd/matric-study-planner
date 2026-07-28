ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS strength text NOT NULL DEFAULT 'average',
  ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT '📘';

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS subject_id uuid,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS chapter text,
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS objective text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS material text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS estimated_minutes integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS quiz_score integer,
  ADD COLUMN IF NOT EXISTS study_minutes integer NOT NULL DEFAULT 0;

UPDATE public.tasks SET status = 'completed' WHERE completed = true AND status <> 'completed';

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS label text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS subject text NOT NULL DEFAULT 'General';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS reminders jsonb NOT NULL DEFAULT '{"study":true,"homework":true,"revision":true,"exam":true,"achievement":true}'::jsonb;

CREATE TABLE IF NOT EXISTS public.task_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid,
  title text NOT NULL,
  subject text,
  topic text,
  quiz_score integer NOT NULL DEFAULT 0,
  quiz_total integer NOT NULL DEFAULT 3,
  study_minutes integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_history TO authenticated;
GRANT ALL ON public.task_history TO service_role;

ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own task history" ON public.task_history;
CREATE POLICY "own task history" ON public.task_history
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS task_history_user_idx ON public.task_history (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS tasks_subject_idx ON public.tasks (user_id, subject_id);