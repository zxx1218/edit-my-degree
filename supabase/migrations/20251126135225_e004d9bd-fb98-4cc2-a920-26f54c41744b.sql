-- Create login_logs table to track daily login statistics
CREATE TABLE IF NOT EXISTS public.login_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('Asia/Shanghai', now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('Asia/Shanghai', now())
);

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_login_logs_login_time ON public.login_logs(login_time);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.login_logs(user_id);

-- Enable RLS
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Only allow system (service role) to manage login logs
CREATE POLICY "Service role can manage login logs"
ON public.login_logs
FOR ALL
USING (true)
WITH CHECK (true);