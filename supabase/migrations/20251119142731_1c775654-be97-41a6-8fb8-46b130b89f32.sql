-- 修改所有表的 created_at 和 updated_at 字段默认值为中国时区
ALTER TABLE users 
  ALTER COLUMN created_at SET DEFAULT timezone('Asia/Shanghai', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('Asia/Shanghai', now());

ALTER TABLE student_status 
  ALTER COLUMN created_at SET DEFAULT timezone('Asia/Shanghai', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('Asia/Shanghai', now());

ALTER TABLE education 
  ALTER COLUMN created_at SET DEFAULT timezone('Asia/Shanghai', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('Asia/Shanghai', now());

ALTER TABLE degree 
  ALTER COLUMN created_at SET DEFAULT timezone('Asia/Shanghai', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('Asia/Shanghai', now());

ALTER TABLE exam 
  ALTER COLUMN created_at SET DEFAULT timezone('Asia/Shanghai', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('Asia/Shanghai', now());

ALTER TABLE orders 
  ALTER COLUMN created_at SET DEFAULT timezone('Asia/Shanghai', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('Asia/Shanghai', now());

-- 更新 update_updated_at_column 函数使用中国时区
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('Asia/Shanghai', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;