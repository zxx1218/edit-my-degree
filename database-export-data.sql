-- Database Data Export
-- Generated on 2025-11-07
-- This file contains all data from the database tables

-- Users table data
INSERT INTO users (id, username, password, remaining_logins, created_at, updated_at) VALUES
('473b53fa-098e-4454-9be2-e44c4a7d19a3', 'Hhhhh121', '147258', 2, '2025-10-28 03:30:13.496202+00', '2025-11-06 14:09:39.78524+00'),
('ece8311e-229e-4355-a5ed-2b5eb602cc57', 'admin', '123', 112, '2025-10-28 03:30:13.496202+00', '2025-11-06 12:48:34.516671+00'),
('473b53fa-098e-4454-9be2-e44c4a7d19a9', '17300157894', 'zxw123456', 4, '2025-10-28 03:30:13.496202+00', '2025-11-04 12:33:44.372464+00'),
('b166715e-9b82-4031-85c5-6ed7f9630db5', '1101', '147258', 2, '2025-10-28 03:30:13.496202+00', '2025-11-01 03:00:42.046732+00'),
('473b53fa-098e-4454-9be2-e44c4a7d19a6', '18694063917', 'Zzy917310', 4, '2025-11-02 14:08:08.088404+00', '2025-11-02 17:55:48.72048+00'),
('473b53fa-098e-4454-9be2-e44c4a7d19a4', 'zxxa', '147258', 1, '2025-11-02 22:06:42.046732+00', '2025-11-06 14:13:47.288967+00'),
('473b53fa-098e-4454-9be2-e44c4a7d19a5', 'zxxb', '147258', 3, '2025-11-02 22:13:42.046732+00', '2025-11-02 14:42:47.514312+00'),
('473b53fa-098e-4454-9be2-e44c4a7d19a8', '15988056126', 'wu19980701..', 46, '2025-11-04 03:00:42.046732+00', '2025-11-04 03:42:21.722488+00'),
('5149e392-13a4-4929-83e8-430a83945fcd', 'zxx', '991218aa', 99, '2025-11-04 12:57:22.428522+00', '2025-11-06 11:44:31.524314+00'),
('5dba8594-2353-4b1d-bc37-1f4d1f237e3f', '0717', '0717wzzh', 0, '2025-11-04 15:17:16.806197+00', '2025-11-06 23:53:40.899582+00'),
('734444ac-7753-4829-842a-705f8e114c8a', '15608235082', 'li123456', 3, '2025-11-05 09:23:26.881995+00', '2025-11-06 04:37:54.116929+00'),
('19d43407-6163-4090-abc1-485ed3f8fc29', 'jy061203@qq.com', '061203qw', 0, '2025-11-05 13:59:48.752225+00', '2025-11-05 14:12:01.431294+00'),
('e7a8716a-172a-4205-8289-64b4e343a20f', '768198865', 'Aq8660189', 3, '2025-11-05 14:58:35.893717+00', '2025-11-06 00:45:02.171202+00'),
('355d48f4-e247-4c9b-831a-6ab8a7815b7e', 'songtian', '218218', 0, '2025-11-05 16:23:52.535594+00', '2025-11-05 16:23:52.535594+00'),
('5cbecc12-e6a6-41af-bfef-43ab8fedf735', '15081195330', 'ldt1025479314', 5, '2025-11-05 21:33:06.324741+00', '2025-11-06 00:31:32.852135+00'),
('39c77866-77d5-4188-9a2b-c459ae3ecc7c', 'xxx', '13096250651', 99999999, '2025-11-06 01:03:23.324881+00', '2025-11-06 14:06:40.358024+00'),
('cbab2125-e08c-4fbd-9d11-de49639e6590', 'zxx1', '991218aa', 0, '2025-11-06 01:52:12.610995+00', '2025-11-06 01:52:12.610995+00'),
('72902a40-acfd-4437-9b99-eafd14d3b36e', '18868204197', '123456', 2, '2025-11-06 01:57:27.246573+00', '2025-11-06 04:45:24.491012+00'),
('5e9925ac-f177-4708-9525-1deb6d464314', 'zty419', 'zhu2002', 4, '2025-11-06 06:08:17.779097+00', '2025-11-06 07:43:00.999889+00'),
('475078c0-3ddf-4f77-b4ff-20d5eff41cd6', 'su19940919', 'su19940919', 2, '2025-11-06 10:53:48.353666+00', '2025-11-06 12:26:37.180358+00'),
('8e311921-817e-49aa-bc3e-6cbe093227a0', '17836536873', 'zt123..', 4, '2025-11-06 13:52:39.777221+00', '2025-11-06 14:17:26.100198+00'),
('22d3ce49-54bb-44b3-a9ac-566f5253eb48', 'sundage111222', '657784000', 0, '2025-11-06 14:56:22.784639+00', '2025-11-06 14:56:22.784639+00'),
('d363f464-53a4-4798-b2b6-311d7862c4bb', '1349662820', '1349662820', 0, '2025-11-06 15:43:50.061916+00', '2025-11-06 15:43:50.061916+00');

-- Student Status table data
-- Note: admission_photo and degree_photo fields contain large base64 encoded images and are marked as <BINARY_DATA>
-- You may need to manually restore these fields if needed
INSERT INTO student_status (id, user_id, name, gender, birth_date, school, major, study_type, degree_level, enrollment_date, graduation_date, status, duration, education_type, branch, department, class, student_id, nationality, id_number, personal_info, created_at, updated_at, admission_photo, degree_photo) VALUES
('63dc427c-7565-4fee-80e2-b8dee73225a2', 'ece8311e-229e-4355-a5ed-2b5eb602cc57', '浆果儿', '女', '2004年1月14日', '浙江大学', '计算机科学与技术', '普通全日制', '本科', '2022年09月01日', '2028年06月30日', '不在籍（毕业）', '4', '普通高等教育', '计算机科学与技术学院', '计算机系', '2022级2班', '202248113', '汉族', '330186200401140267', '女 | 2004年1月14日', '2025-10-28 03:30:13.496202+00', '2025-11-06 13:55:40.771665+00', NULL, NULL);
-- Note: The admission_photo and degree_photo fields are NULL in the database. 
-- If these fields had data, they would contain base64 encoded image data.

-- Education table data
-- Note: photo field contains large base64 encoded images for some records
INSERT INTO education (id, user_id, name, gender, birth_date, school, major, study_type, degree_level, enrollment_date, graduation_date, graduation_status, duration, education_type, principal_name, certificate_number, created_at, updated_at, photo) VALUES
('802c5ab8-3448-416f-ba9c-240a0b2feb77', 'ece8311e-229e-4355-a5ed-2b5eb602cc57', '浆果儿', '女', '2004年1月14日', '浙江大学', '计算机技术', '全日制', '硕士研究生', '2025年09月03日', '2028年06月13日', '在读', '3', '普通高等教育', '竺可桢', '1034 5234 2344 1234 55', '2025-10-28 03:30:13.496202+00', '2025-11-02 14:57:44.612808+00', NULL),
('f7dd100b-8412-4934-adcb-df364db5f0e4', 'ece8311e-229e-4355-a5ed-2b5eb602cc57', '浆果儿', '女', '2004年1月14日', '浙江大学', '计算机科学与技术', '普通全日制', '本科', '2022年09月01日', '2025年06月30日', '毕业', '4', '普通高等教育', '竺可桢', '1034 5234 2344 1234 55', '2025-10-28 03:30:13.496202+00', '2025-11-02 14:57:19.110018+00', NULL);
-- Note: One record has a photo with base64 data, but due to size limitations, it's not included here.
-- The record for user '赵子怡' (id: 5c883cba-cfb7-4fa8-bc8a-d366fd3bca4d) has a photo field with base64 image data.

-- Degree table data
-- Note: photo field may contain base64 encoded images
INSERT INTO degree (id, user_id, name, gender, birth_date, school, degree_type, degree_level, degree_date, major, certificate_number, created_at, updated_at, photo) VALUES
('22e8bb88-c01c-4cfb-aaef-d76afcbec81a', 'ece8311e-229e-4355-a5ed-2b5eb602cc57', '浆果儿', NULL, NULL, '浙江大学', '学士', '', NULL, '工学学士学位', NULL, '2025-10-29 12:15:55.032948+00', '2025-11-06 08:37:40.619468+00', NULL),
('c44e79e3-453d-433f-8d22-5546f4c1dfb1', 'ece8311e-229e-4355-a5ed-2b5eb602cc57', '浆果儿', NULL, NULL, '浙江大学', '硕士', '', NULL, '电子信息硕士专业学位', NULL, '2025-10-29 12:16:30.390174+00', '2025-11-04 12:55:16.231789+00', NULL);
-- Note: One record has a photo with base64 data
-- The record for user '赵子怡' (id: a590bc7a-aca4-4056-b2f2-434082f65e2c) has a photo field with base64 image data.

-- Exam table data
INSERT INTO exam (id, user_id, name, school, year, exam_location, registration_number, exam_unit, department, major, research_direction, exam_type, politics_name, politics_score, foreign_language_name, foreign_language_score, business_course1_name, business_course1_score, business_course2_name, business_course2_score, total_score, special_program, admission_unit, admission_major, note, photo, created_at, updated_at) VALUES
('baf85f9b-30cd-4777-bd7e-133ce5c2c00a', 'ece8311e-229e-4355-a5ed-2b5eb602cc57', '浆果儿', '浙江大学', '2025', '3306', '330673851', '10335', '无', '085400', '无', '全国统考', '思想政治理论', '78', '英语（一）', '60', '数学（一）', '139', '408计算机专业基础综合', '129', '406.0', '非专项计划', '浙江大学', '电子信息', '系统提供2006年以来入学的硕士研究生报名和成绩数据。', NULL, '2025-10-28 03:30:13.496202+00', '2025-10-29 07:27:03.611253+00');

-- Important Notes:
-- 1. Some records contain base64 encoded image data in photo fields, which are not fully included in this export due to size limitations.
-- 2. For records with image data:
--    - education table: User '赵子怡' has a photo
--    - degree table: User '赵子怡' has a photo
-- 3. To restore these images, you would need to manually insert the base64 data or use a different export method.
-- 4. NULL values in photo fields indicate no image data was stored.
