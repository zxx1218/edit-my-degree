-- ========================================
-- 数据库完整导出文件
-- 导出时间: 2025-11-02
-- 包含所有表的建表语句和数据
-- ========================================

-- ========================================
-- 1. users 表
-- ========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    remaining_logins INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- users 表数据
INSERT INTO public.users (id, username, password, remaining_logins, created_at, updated_at) VALUES
('b166715e-9b82-4031-85c5-6ed7f9630db5', '1101', '147258', 2, '2025-10-28 03:30:13.496202+00', '2025-11-01 03:00:42.046732+00'),
('473b53fa-098e-4454-9be2-e44c4a7d19a3', 'Hhhhh121', '147258', 2, '2025-10-28 03:30:13.496202+00', '2025-11-01 05:19:51.746578+00'),
('ece8311e-229e-4355-a5ed-2b5eb602cc57', 'admin', '123', 118, '2025-10-28 03:30:13.496202+00', '2025-11-02 14:56:22.232678+00'),
('473b53fa-098e-4454-9be2-e44c4a7d19a6', '18694063917', 'Zzy917310', 5, '2025-11-02 14:08:08.088404+00', '2025-11-02 15:05:14.570573+00'),
('473b53fa-098e-4454-9be2-e44c4a7d19a4', 'zxxa', '147258', 10, '2025-11-02 22:06:42.046732+00', '2025-11-02 14:08:08.088404+00'),
('473b53fa-098e-4454-9be2-e44c4a7d19a5', 'zxxb', '147258', 3, '2025-11-02 22:13:42.046732+00', '2025-11-02 14:42:47.514312+00');

-- ========================================
-- 2. student_status 表
-- ========================================
CREATE TABLE IF NOT EXISTS public.student_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    gender TEXT,
    birth_date TEXT,
    school TEXT NOT NULL,
    major TEXT NOT NULL,
    study_type TEXT,
    degree_level TEXT,
    nationality TEXT,
    id_number TEXT,
    status TEXT,
    enrollment_date TEXT,
    graduation_date TEXT,
    duration TEXT,
    education_type TEXT,
    branch TEXT,
    department TEXT,
    class TEXT,
    student_id TEXT,
    personal_info TEXT,
    admission_photo TEXT,
    degree_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- student_status 表数据 (由于包含大量base64图片数据，这里仅展示部分字段)
-- 注意：实际导出时admission_photo和degree_photo字段包含完整的base64编码图片数据
-- 如需完整数据，请从数据库直接导出

-- ========================================
-- 3. education 表
-- ========================================
CREATE TABLE IF NOT EXISTS public.education (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    gender TEXT,
    birth_date TEXT,
    school TEXT NOT NULL,
    major TEXT NOT NULL,
    study_type TEXT,
    degree_level TEXT,
    enrollment_date TEXT,
    graduation_date TEXT,
    duration TEXT,
    education_type TEXT,
    graduation_status TEXT,
    principal_name TEXT,
    certificate_number TEXT,
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- education 表数据
INSERT INTO public.education (id, user_id, name, gender, birth_date, school, major, study_type, degree_level, enrollment_date, graduation_date, duration, education_type, graduation_status, principal_name, certificate_number, photo, created_at, updated_at) VALUES
('f7dd100b-8412-4934-adcb-df364db5f0e4', 'ece8311e-229e-4355-a5ed-2b5eb602cc57', '浆果儿', '女', '2004年1月14日', '浙江大学', '计算机科学与技术', '普通全日制', '本科', '2022年09月01日', '2025年06月30日', '4', '普通高等教育', '毕业', '竺可桢', '1034 5234 2344 1234 55', NULL, '2025-10-28 03:30:13.496202+00', '2025-11-02 14:57:19.110018+00'),
('802c5ab8-3448-416f-ba9c-240a0b2feb77', 'ece8311e-229e-4355-a5ed-2b5eb602cc57', '浆果儿', '女', '2004年1月14日', '浙江大学', '计算机技术', '全日制', '硕士研究生', '2025年09月03日', '2028年06月13日', '3', '普通高等教育', '在读', '竺可桢', '1034 5234 2344 1234 55', NULL, '2025-10-28 03:30:13.496202+00', '2025-11-02 14:57:44.612808+00'),
('5c883cba-cfb7-4fa8-bc8a-d366fd3bca4d', '473b53fa-098e-4454-9be2-e44c4a7d19a6', '赵子怡', '女', '1999年09月17日', '中国地质大学', '宝石及材料', NULL, '本科', '2016年9月1日', '2020年06月30日', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-02 14:56:53.468097+00', '2025-11-02 15:05:38.289854+00');

-- ========================================
-- 4. degree 表
-- ========================================
CREATE TABLE IF NOT EXISTS public.degree (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    gender TEXT,
    birth_date TEXT,
    school TEXT NOT NULL,
    major TEXT,
    degree_type TEXT NOT NULL,
    degree_level TEXT,
    degree_date TEXT,
    certificate_number TEXT,
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- degree 表数据
INSERT INTO public.degree (id, user_id, name, gender, birth_date, school, major, degree_type, degree_level, degree_date, certificate_number, photo, created_at, updated_at) VALUES
('22e8bb88-c01c-4cfb-aaef-d76afcbec81a', 'ece8311e-229e-4355-a5ed-2b5eb602cc57', '新用户', NULL, NULL, '浙江大学', '工学学士学位', '学士', '', NULL, NULL, NULL, '2025-10-29 12:15:55.032948+00', '2025-10-29 12:16:25.655201+00'),
('c44e79e3-453d-433f-8d22-5546f4c1dfb1', 'ece8311e-229e-4355-a5ed-2b5eb602cc57', '哈哈哈', NULL, NULL, '浙江大学', '电子信息硕士专业学位', '硕士', '', NULL, NULL, NULL, '2025-10-29 12:16:30.390174+00', '2025-10-29 12:28:29.614344+00');

-- ========================================
-- 5. exam 表
-- ========================================
CREATE TABLE IF NOT EXISTS public.exam (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    school TEXT NOT NULL,
    year TEXT,
    exam_location TEXT,
    registration_number TEXT,
    exam_unit TEXT,
    department TEXT,
    major TEXT,
    research_direction TEXT,
    exam_type TEXT,
    special_program TEXT,
    politics_name TEXT,
    politics_score TEXT,
    foreign_language_name TEXT,
    foreign_language_score TEXT,
    business_course1_name TEXT,
    business_course1_score TEXT,
    business_course2_name TEXT,
    business_course2_score TEXT,
    total_score TEXT,
    admission_unit TEXT,
    admission_major TEXT,
    note TEXT,
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- exam 表数据
INSERT INTO public.exam (id, user_id, name, school, year, exam_location, registration_number, exam_unit, department, major, research_direction, exam_type, special_program, politics_name, politics_score, foreign_language_name, foreign_language_score, business_course1_name, business_course1_score, business_course2_name, business_course2_score, total_score, admission_unit, admission_major, note, photo, created_at, updated_at) VALUES
('baf85f9b-30cd-4777-bd7e-133ce5c2c00a', 'ece8311e-229e-4355-a5ed-2b5eb602cc57', '浆果儿', '浙江大学', '2025', '3306', '330673851', '10335', '无', '085400', '无', '全国统考', '非专项计划', '思想政治理论', '78', '英语（一）', '60', '数学（一）', '139', '408计算机专业基础综合', '129', '406.0', '浙江大学', '电子信息', '系统提供2006年以来入学的硕士研究生报名和成绩数据。', NULL, '2025-10-28 03:30:13.496202+00', '2025-10-29 07:27:03.611253+00');

-- ========================================
-- RLS 策略
-- ========================================

-- 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.degree ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam ENABLE ROW LEVEL SECURITY;

-- users 表策略
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT
    USING (username = current_setting('app.current_user'::text, true));

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE
    USING (username = current_setting('app.current_user'::text, true));

-- student_status 表策略
CREATE POLICY "Users can manage own student status" ON public.student_status
    FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE username = current_setting('app.current_user'::text, true)));

-- education 表策略
CREATE POLICY "Users can manage own education" ON public.education
    FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE username = current_setting('app.current_user'::text, true)));

-- degree 表策略
CREATE POLICY "Users can manage own degree" ON public.degree
    FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE username = current_setting('app.current_user'::text, true)));

-- exam 表策略
CREATE POLICY "Users can manage own exam" ON public.exam
    FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE username = current_setting('app.current_user'::text, true)));

-- ========================================
-- 触发器函数
-- ========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ========================================
-- 触发器
-- ========================================
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_status_updated_at
    BEFORE UPDATE ON public.student_status
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_education_updated_at
    BEFORE UPDATE ON public.education
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_degree_updated_at
    BEFORE UPDATE ON public.degree
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_updated_at
    BEFORE UPDATE ON public.exam
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 注意事项
-- ========================================
-- 1. student_status 表中的 admission_photo 和 degree_photo 字段包含大量base64图片数据，已省略
-- 2. education 表中部分记录的 photo 字段包含base64图片数据，已省略
-- 3. 如需完整的图片数据，请使用数据库工具直接导出
-- 4. 导入前请确保目标数据库为空或使用 DROP TABLE IF EXISTS 清空相关表
