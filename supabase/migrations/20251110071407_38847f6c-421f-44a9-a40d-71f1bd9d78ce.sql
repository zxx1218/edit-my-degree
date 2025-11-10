-- Create orders table to track payment orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  plan_logins TEXT NOT NULL,
  amount TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('wechat', 'alipay')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  payment_id TEXT,
  payment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM users WHERE username = current_setting('app.current_user', true)
));

-- Users can create their own orders
CREATE POLICY "Users can create own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT id FROM users WHERE username = current_setting('app.current_user', true)
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX idx_orders_status ON public.orders(status);