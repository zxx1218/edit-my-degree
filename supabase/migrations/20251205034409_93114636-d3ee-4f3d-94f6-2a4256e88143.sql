-- Create cards table for recharge card management
CREATE TABLE public.cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  values INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'login', -- 'login' for login credits, 'pdf' for PDF credits
  used BOOLEAN NOT NULL DEFAULT false,
  used_by TEXT,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('Asia/Shanghai', now())
);

-- Enable RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage cards
CREATE POLICY "Service role can manage cards"
ON public.cards
FOR ALL
USING (true)
WITH CHECK (true);