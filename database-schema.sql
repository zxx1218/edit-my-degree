-- ================================
-- 数据库建表SQL文件
-- 包含所有表结构和测试数据
-- ================================

-- 创建用户表（用于登录认证和登录次数管理）
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  remaining_logins INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和更新自己的数据
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (username = current_setting('app.current_user', true));

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (username = current_setting('app.current_user', true));

-- 创建学籍信息表
CREATE TABLE IF NOT EXISTS public.student_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  personal_info TEXT,
  gender TEXT,
  birth_date TEXT,
  school TEXT NOT NULL,
  major TEXT NOT NULL,
  study_type TEXT,
  degree_level TEXT,
  nationality TEXT,
  id_number TEXT,
  duration TEXT,
  education_type TEXT,
  branch TEXT,
  department TEXT,
  class TEXT,
  student_id TEXT,
  enrollment_date TEXT,
  status TEXT,
  graduation_date TEXT,
  admission_photo TEXT,
  degree_photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.student_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own student status"
  ON public.student_status FOR ALL
  USING (user_id IN (SELECT id FROM public.users WHERE username = current_setting('app.current_user', true)));

-- 创建学历信息表
CREATE TABLE IF NOT EXISTS public.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT,
  birth_date TEXT,
  school TEXT NOT NULL,
  major TEXT NOT NULL,
  study_type TEXT,
  degree_level TEXT,
  enrollment_date TEXT,
  graduation_date TEXT,
  education_type TEXT,
  duration TEXT,
  graduation_status TEXT,
  principal_name TEXT,
  certificate_number TEXT,
  photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own education"
  ON public.education FOR ALL
  USING (user_id IN (SELECT id FROM public.users WHERE username = current_setting('app.current_user', true)));

-- 创建学位信息表
CREATE TABLE IF NOT EXISTS public.degree (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT,
  birth_date TEXT,
  school TEXT NOT NULL,
  degree_type TEXT NOT NULL,
  degree_level TEXT,
  degree_date TEXT,
  major TEXT,
  certificate_number TEXT,
  photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.degree ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own degree"
  ON public.degree FOR ALL
  USING (user_id IN (SELECT id FROM public.users WHERE username = current_setting('app.current_user', true)));

-- 创建考研信息表
CREATE TABLE IF NOT EXISTS public.exam (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  school TEXT NOT NULL,
  year TEXT,
  photo TEXT,
  exam_location TEXT,
  registration_number TEXT,
  exam_unit TEXT,
  department TEXT,
  major TEXT,
  research_direction TEXT,
  exam_type TEXT,
  special_program TEXT,
  politics_name TEXT,
  foreign_language_name TEXT,
  business_course1_name TEXT,
  business_course2_name TEXT,
  politics_score TEXT,
  foreign_language_score TEXT,
  business_course1_score TEXT,
  business_course2_score TEXT,
  total_score TEXT,
  admission_unit TEXT,
  admission_major TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.exam ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own exam"
  ON public.exam FOR ALL
  USING (user_id IN (SELECT id FROM public.users WHERE username = current_setting('app.current_user', true)));

-- 创建更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 为所有表添加更新时间戳触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_status_updated_at BEFORE UPDATE ON public.student_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON public.education
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_degree_updated_at BEFORE UPDATE ON public.degree
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_updated_at BEFORE UPDATE ON public.exam
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 插入测试数据
-- ================================

-- 插入测试用户数据
INSERT INTO public.users (username, password, remaining_logins) VALUES
  ('admin', '123456', 10),
  ('user1', 'password1', 5),
  ('test', 'test123', 0),
  ('zhangsan', 'password123', 15),
  ('lisi', 'pass456', 20)
ON CONFLICT (username) DO NOTHING;

-- 为admin用户插入测试数据
DO $$
DECLARE
  admin_id UUID;
  user1_id UUID;
BEGIN
  SELECT id INTO admin_id FROM public.users WHERE username = 'admin';
  SELECT id INTO user1_id FROM public.users WHERE username = 'user1';
  
  -- admin用户的学籍信息
  INSERT INTO public.student_status (user_id, name, personal_info, gender, birth_date, school, major, study_type, degree_level, nationality, id_number, duration, education_type, student_id, enrollment_date, status, graduation_date)
  VALUES 
    (admin_id, '朱晓煌', '男 1999年12月18日', '男', '1999年12月18日', '浙江大学', '计算机技术', '全日制', '硕士研究生', '汉族', '140105199912180817', '3年', '普通高等教育', '2022388441', '2022年09月03日', '不在籍（毕业）', '2025年06月13日'),
    (admin_id, '朱晓煌', '男 1999年12月18日', '男', '1999年12月18日', '浙江大学', '计算机科学与技术', '普通全日制', '本科', '汉族', '140105199912180817', '4年', '普通高等教育', '2018388441', '2018年09月01日', '不在籍（毕业）', '2022年06月30日');
  
  -- admin用户的学历信息
  INSERT INTO public.education (user_id, name, gender, birth_date, school, major, study_type, degree_level, enrollment_date, graduation_date, education_type, duration, graduation_status, principal_name, certificate_number)
  VALUES
    (admin_id, '朱晓煌', '男', '1999年12月18日', '浙江大学', '计算机技术', '全日制', '硕士研究生', '2022年09月03日', '2025年06月13日', '普通高等教育', '3 年', '毕业', '盛况', '1034 7120 2502 5201 62'),
    (admin_id, '朱晓煌', '男', '1999年12月18日', '浙江大学', '计算机科学与技术', '普通全日制', '本科', '2018年09月01日', '2022年06月30日', '普通高等教育', '4 年', '毕业', '盛况', '1034 7118 2202 5301 45');
  
  -- admin用户的学位信息
  INSERT INTO public.degree (user_id, name, gender, birth_date, school, degree_type, degree_level, degree_date, major, certificate_number)
  VALUES
    (admin_id, '朱晓煌', '男', '1999年12月18日', '浙江大学', '电子信息硕士专业学位', '硕士', '2025年06月13日', '计算机技术', '10347320255201162'),
    (admin_id, '朱晓煌', '男', '1999年12月18日', '浙江大学', '工学学士学位', '学士', '2022年06月30日', '计算机科学与技术', '10347322220530145');
  
  -- admin用户的考研信息
  INSERT INTO public.exam (user_id, name, school, year, exam_location, registration_number, exam_unit, department, major, research_direction, exam_type, special_program, politics_name, foreign_language_name, business_course1_name, business_course2_name, politics_score, foreign_language_score, business_course1_score, business_course2_score, total_score, admission_unit, admission_major, note)
  VALUES
    (admin_id, '浆果儿', '浙江大学', '2022', '3306', '330695769', '10335', '无', '085400', '无', '全国统考', '非专项计划', '思想政治理论', '英语（一）', '数学（一）', '数据结构与计算机网络', '78', '60', '139', '129', '406.0', '浙江大学', '电子信息', '系统提供2006年以来入学的硕士研究生报名和成绩数据。');
  
  -- user1用户的测试数据
  INSERT INTO public.student_status (user_id, name, personal_info, gender, birth_date, school, major, study_type, degree_level, nationality, id_number, duration, education_type, student_id, enrollment_date, status, graduation_date)
  VALUES 
    (user1_id, '李明', '男 2000年05月20日', '男', '2000年05月20日', '复旦大学', '软件工程', '全日制', '本科', '汉族', '310110200005201234', '4年', '普通高等教育', '2019123456', '2019年09月01日', '在籍', NULL);
  
  INSERT INTO public.education (user_id, name, gender, birth_date, school, major, study_type, degree_level, enrollment_date, graduation_date, education_type, duration, graduation_status, principal_name, certificate_number)
  VALUES
    (user1_id, '李明', '男', '2000年05月20日', '复旦大学', '软件工程', '全日制', '本科', '2019年09月01日', '2023年06月30日', '普通高等教育', '4 年', '毕业', '张伟', '1034 8119 2302 3001 23');
  
  INSERT INTO public.degree (user_id, name, gender, birth_date, school, degree_type, degree_level, degree_date, major, certificate_number)
  VALUES
    (user1_id, '李明', '男', '2000年05月20日', '复旦大学', '工学学士学位', '学士', '2023年06月30日', '软件工程', '10348319230300123');
  
  INSERT INTO public.exam (user_id, name, school, year, exam_location, registration_number, exam_unit, department, major, research_direction, exam_type, special_program, politics_name, foreign_language_name, business_course1_name, business_course2_name, politics_score, foreign_language_score, business_course1_score, business_course2_score, total_score, admission_unit, admission_major, note)
  VALUES
    (user1_id, '李明', '复旦大学', '2023', '3101', '310198765', '10246', '计算机科学技术学院', '081200', '人工智能', '全国统考', '非专项计划', '思想政治理论', '英语（一）', '数学（一）', '数据结构', '75', '68', '125', '132', '400.0', '复旦大学', '计算机科学与技术', '系统提供2006年以来入学的硕士研究生报名和成绩数据。');
END $$;

-- 说明：
-- 1. users表存储用户登录信息和剩余登录次数
-- 2. student_status表存储学籍信息
-- 3. education表存储学历信息
-- 4. degree表存储学位信息
-- 5. exam表存储考研信息
-- 6. 所有表都通过user_id关联到users表
-- 7. 图片字段(photo等)存储图片的base64编码或URL路径
-- 8. 已为admin和user1用户插入完整的测试数据
