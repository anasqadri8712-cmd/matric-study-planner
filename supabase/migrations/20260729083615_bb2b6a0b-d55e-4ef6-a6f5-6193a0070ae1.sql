ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_study_time text NOT NULL DEFAULT 'Evening';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, onboarded)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subjects (user_id, name, icon, color)
  VALUES
    (NEW.id, 'Mathematics', '📘', '#2563eb'),
    (NEW.id, 'Physics', '🔭', '#7c3aed'),
    (NEW.id, 'Chemistry', '⚗️', '#0ea5e9'),
    (NEW.id, 'Biology', '🧬', '#16a34a'),
    (NEW.id, 'Computer', '💻', '#14b8a6'),
    (NEW.id, 'English', '📖', '#f59e0b'),
    (NEW.id, 'Urdu', '🕌', '#ef4444'),
    (NEW.id, 'Islamiyat', '🕋', '#10b981'),
    (NEW.id, 'Pakistan Studies', '🇵🇰', '#ec4899');

  RETURN NEW;
END;
$$;

UPDATE public.profiles SET onboarded = true WHERE onboarded = false;