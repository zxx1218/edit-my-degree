-- 创建系统日志表
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'info', -- info, warn, error, debug
  message TEXT NOT NULL,
  source TEXT, -- 日志来源，如 auth, api, system
  details TEXT, -- 详细信息
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('Asia/Shanghai', now())
);

-- 创建索引以优化查询
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX idx_system_logs_level ON public.system_logs(level);
CREATE INDEX idx_system_logs_source ON public.system_logs(source);

-- 启用 RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- 仅允许服务角色访问日志
CREATE POLICY "Service role can manage logs"
ON public.system_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- 添加注释
COMMENT ON TABLE public.system_logs IS '系统运行日志表';
COMMENT ON COLUMN public.system_logs.level IS '日志级别: info, warn, error, debug';
COMMENT ON COLUMN public.system_logs.message IS '日志消息';
COMMENT ON COLUMN public.system_logs.source IS '日志来源模块';
COMMENT ON COLUMN public.system_logs.details IS '详细信息或堆栈跟踪';