
CREATE TABLE public.application_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  weekly_target integer NOT NULL DEFAULT 10,
  monthly_target integer NOT NULL DEFAULT 40,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.application_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" ON public.application_goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON public.application_goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.application_goals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_application_goals_updated_at
  BEFORE UPDATE ON public.application_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
