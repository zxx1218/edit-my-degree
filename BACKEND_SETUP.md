# 后端数据库配置说明

## 概述

本项目已完成后端数据库集成，使用Lovable Cloud作为后端服务，实现了：
- 用户登录认证和登录次数管理
- 所有学籍、学历、学位、考研信息的数据库存储
- 数据的增删改查功能

## 数据库表结构

### 1. users 表（用户表）
存储用户登录信息和剩余登录次数
- `id` (UUID): 主键
- `username` (TEXT): 用户名
- `password` (TEXT): 密码（明文存储）
- `remaining_logins` (INTEGER): 剩余登录次数
- `created_at` / `updated_at`: 时间戳

### 2. student_status 表（学籍信息）
存储用户的学籍信息记录
- `id` (UUID): 主键
- `user_id` (UUID): 关联用户ID
- `name`, `gender`, `birth_date`: 基本信息
- `school`, `major`, `study_type`, `degree_level`: 学校专业信息
- `admission_photo`, `degree_photo`: 照片路径（base64或URL）
- 其他字段...

### 3. education 表（学历信息）
存储用户的学历信息记录
- `id` (UUID): 主键
- `user_id` (UUID): 关联用户ID
- `school`, `major`, `enrollment_date`, `graduation_date`: 学历信息
- `photo`: 照片路径
- 其他字段...

### 4. degree 表（学位信息）
存储用户的学位信息记录
- `id` (UUID): 主键
- `user_id` (UUID): 关联用户ID
- `school`, `degree_type`, `degree_level`, `degree_date`: 学位信息
- `photo`: 照片路径
- 其他字段...

### 5. exam 表（考研信息）
存储用户的考研信息记录
- `id` (UUID): 主键
- `user_id` (UUID): 关联用户ID
- `school`, `year`, `exam_location`: 考试信息
- `politics_score`, `foreign_language_score`: 成绩信息
- `photo`: 照片路径
- 其他字段...

## API 接口

项目创建了3个Edge Functions：

### 1. `/auth` - 登录认证
**请求参数：**
```json
{
  "username": "用户名",
  "password": "密码"
}
```

**返回结果：**
```json
{
  "success": true,
  "user": {
    "id": "用户ID",
    "username": "用户名",
    "remaining_logins": 9
  }
}
```

### 2. `/get-user-data` - 获取用户数据
**请求参数：**
```json
{
  "userId": "用户ID"
}
```

**返回结果：**
```json
{
  "studentStatus": [...],
  "education": [...],
  "degree": [...],
  "exam": [...]
}
```

### 3. `/update-data` - 更新数据
**请求参数：**
```json
{
  "table": "student_status | education | degree | exam",
  "action": "insert | update | delete",
  "userId": "用户ID",
  "data": {...},  // insert/update时需要
  "id": "记录ID"  // update/delete时需要
}
```

## 测试数据

数据库已预置以下测试账号：

1. **admin** / **123456** (剩余10次登录)
   - 包含完整的学籍、学历、学位、考研信息

2. **user1** / **password1** (剩余5次登录)
   - 包含完整的测试数据

3. **test** / **test123** (剩余0次登录)
   - 用于测试登录次数为0的情况

4. **zhangsan** / **password123** (剩余15次登录)
5. **lisi** / **pass456** (剩余20次登录)

## 功能特性

1. **用户登录**
   - 每次登录自动减少登录次数
   - 次数为0时禁止登录并提示

2. **数据持久化**
   - 所有用户数据存储在数据库中
   - 支持新用户自动使用默认值

3. **图片存储**
   - 照片字段存储base64编码或URL路径
   - 前端上传后自动保存到数据库

4. **数据隔离**
   - 使用RLS策略确保用户只能访问自己的数据
   - 所有表都通过user_id关联

## 数据库SQL文件

完整的数据库建表SQL文件保存在 `database-schema.sql`，包含：
- 所有表的创建语句
- RLS安全策略
- 触发器和函数
- 测试数据插入

可以直接在其他MySQL/PostgreSQL数据库中执行该文件来重建数据库结构。

## 前端集成

前端代码已完全集成后端API：
- `src/lib/api.ts`: API调用封装
- `src/pages/Login.tsx`: 使用后端登录API
- `src/pages/Index.tsx`: 从数据库加载数据
- 所有详情页面: 数据实时同步到数据库

## 使用说明

1. 使用测试账号登录（如 admin/123456）
2. 系统自动从数据库加载该用户的所有数据
3. 修改、添加、删除操作都会实时同步到数据库
4. 关闭页面后再次打开需要重新登录
5. 登录次数会随着每次登录递减

## 注意事项

- 密码采用明文存储（仅用于演示，生产环境应加密）
- 图片建议使用base64编码存储在数据库中
- 新用户首次登录时，若数据库无数据则使用前端默认值
