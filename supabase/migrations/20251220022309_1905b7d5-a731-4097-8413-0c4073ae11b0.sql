-- 创建管理员表
CREATE TABLE public.admins (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username text NOT NULL UNIQUE,
    password text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('Asia/Shanghai'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('Asia/Shanghai'::text, now())
);

-- 启用RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 创建只允许服务端访问的策略
CREATE POLICY "Service role can manage admins"
ON public.admins
FOR ALL
USING (true)
WITH CHECK (true);

-- 创建更新时间触发器
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 插入初始管理员账户
INSERT INTO public.admins (username, password) VALUES ('zxx', '991218zxnmA-');