# 学位编辑系统 API 文档

## 目录
- [1. 概述](#1-概述)
- [2. 认证模块](#2-认证模块)
- [3. 数据管理模块](#3-数据管理模块)
- [4. 用户管理模块](#4-用户管理模块)
- [5. 充值卡管理模块](#5-充值卡管理模块)
- [6. PDF生成模块](#6-pdf生成模块)
- [7. 统计分析模块](#7-统计分析模块)
- [8. 留言管理模块](#8-留言管理模块)
- [9. 安全管理模块](#9-安全管理模块)
- [10. 留言板管理增强](#10-留言板管理增强)
- [11. 二维码重定向](#11-二维码重定向)
- [12. 安全机制](#12-安全机制)
- [13. 附录](#13-附录)

---

## 1. 概述

### 1.1 系统架构

---

## 2. 认证模块
本系统是一个基于 Node.js + Express + MySQL 的学位验证管理系统，提供用户注册、登录、学历信息管理、PDF报告生成等功能。

### 1.2 基础配置
- **Base URL**: `http://your-domain.com/api`
- **Content-Type**: `application/json`
- **认证方式**: JWT Bearer Token（部分接口需要）
- **签名验证**: 大部分接口需要请求签名验证

### 1.3 通用响应格式
``json
{
  "success": true/false,
  "data": {},
  "error": "错误信息（仅在失败时返回）",
  "message": "提示信息"
}
```

### 1.4 限流规则说明

系统采用多层限流策略保护API安全：

#### 全局限流
- **规则**: 每IP每5分钟最多100次请求
- **适用范围**: 所有API端点（除特殊说明外）
- **超限响应**: HTTP 429，返回错误提示"请求过多，IP已经封禁！"

#### 注册限流
- **规则**: 每IP每天最多5次注册
- **适用范围**: `/api/register`
- **超限响应**: HTTP 429，返回错误提示"注册次数太多了，稍后再试！"

#### PDF生成限流
- **规则**: 每用户每分钟最多2次PDF生成
- **适用范围**: `/api/generate-degree-pdf`, `/api/generate-education-pdf`, `/api/generate-student-status-pdf`
- **限流键**: IP + 用户ID组合
- **超限响应**: HTTP 429，返回错误提示"PDF生成操作过于频繁（每分钟最多2次），请稍后再试"

#### 充值卡创建限流
- **规则**: 每管理员每小时最多3次创建操作
- **适用范围**: `/api/manage-cards` (action: create)
- **限流键**: IP + 管理员ID组合
- **超限响应**: HTTP 429，返回错误提示"充值卡创建操作过于频繁（每小时最多3次），请稍后再试"

#### 充值卡使用限流
- **规则**: 每IP每分钟最多10次使用操作
- **适用范围**: `/api/manage-cards` (action: use)
- **超限响应**: HTTP 429，返回错误提示"充值卡使用操作过于频繁（每分钟最多10次），请稍后再试"

#### 留言添加限流（双重限流）
- **第一层**: 每IP每分钟最多3次
- **第二层**: 每IP每小时最多20次
- **适用范围**: `/api/add-message`
- **超限响应**: HTTP 429，分别返回对应的错误提示

### 1.5 数据库表结构概览
  "password": "password123"
}
```

#### 响应示例
**成功**:
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "username": "testuser",
    "remaining_logins": 9,
    "pdf_limit": 5,
    "is_trial_user": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionDuration": 480000
}
```

**失败 - 密码错误**:
```json
{
  "error": "用户名或密码错误",
  "message": "用户名或密码错误"
}
```

**失败 - 登录次数不足**:
```json
{
  "error": "您的剩余登录次数为0，请购买或续费后再登录！",
  "message": "您的账号剩余可登录次数为 0 ，请购买或续费套餐后再登录！"
}
```

---

### 2.2 管理员登录

#### 接口信息
- **路径**: `POST /api/admin-auth`
- **认证**: 无需认证
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
验证管理员凭据并返回JWT令牌（有效期72小时）。

#### 业务逻辑
1. **管理员验证**: 从 `admins` 表查询用户名和密码
2. **生成JWT Token**: 包含 `isAdmin: true` 标识，有效期72小时
3. **记录审计日志**: 记录管理员登录操作

#### 数据库表关联
**读取表**: `admins`
```sql
SELECT * FROM admins WHERE username = ?
-- 字段: id, username, password, created_at, updated_at
```

#### 请求参数示例
```json
{
  "username": "zxx",
  "password": "991218zxnmA-"
}
```

#### 响应示例
**成功**:
```json
{
  "success": true,
  "admin": {
    "id": "uuid-string",
    "username": "zxx"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2.3 用户注册

#### 接口信息
- **路径**: `POST /api/register`
- **认证**: 无需认证
- **限流**: 每IP每天最多5次注册
- **签名验证**: ✅ 需要

#### 功能描述
创建新用户账户，初始登录次数为0，并创建默认学籍记录。

#### 业务逻辑
1. **参数验证**:
   - 用户名长度 >= 3
   - 用户名格式: 仅允许字母、数字、下划线 `/^[a-zA-Z0-9_]+$/`
2. **IP频率检查**: 检查该IP在过去24小时内注册次数 <= 2
3. **用户名唯一性检查**: 确保用户名未被占用
4. **创建用户**: 
   - 生成UUID作为用户ID
   - 初始 `remaining_logins = 0`
   - 记录注册IP地址
5. **创建默认学籍**: 自动为用户创建一条默认学籍记录
6. **记录注册日志**: 记录注册操作到审计系统

#### 数据库表关联
**检查表**: `users`
```sql
-- 检查IP注册频率
SELECT id, username FROM users 
WHERE registration_ip = ? 
AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)

-- 检查用户名是否存在
SELECT id FROM users WHERE username = ?
```

**插入表**: `users`
```sql
INSERT INTO users (id, username, password, remaining_logins, registration_ip) 
VALUES (?, ?, ?, ?, ?)
-- 字段: id(UUID), username, password, remaining_logins(0), registration_ip
```

**插入表**: `student_status`
```sql
INSERT INTO student_status (id, user_id, name, school, major, study_type, degree_level) 
VALUES (?, ?, ?, ?, ?, ?, ?)
-- 默认值: name='浆果儿', school='清华大学', major='汉语言文学', 
--         study_type='普通全日制', degree_level='本科'
```

#### 请求参数示例
```json
{
  "username": "newuser123",
  "password": "securePassword"
}
```

#### 响应示例
**成功**:
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "username": "newuser123",
    "remaining_logins": 0
  }
}
```

**失败 - 用户名已存在**:
```json
{
  "success": false,
  "error": "用户名已存在，请选择其他用户名"
}
```

**失败 - IP注册超限**:
```json
{
  "success": false,
  "error": "阿里云安全服务器已拦截您的请求，若再请求一次将永久封禁机器码！"
}
```

---

## 3. 数据管理模块

### 3.1 获取用户数据

#### 接口信息
- **路径**: `POST /api/get-user-data`
- **认证**: 需要签名验证
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
获取指定用户的所有相关数据（学籍、学历、学位、考试信息）。

#### 业务逻辑
1. 根据 `userId` 从四个表中查询数据
2. 返回所有相关记录的完整信息

#### 数据库表关联
**读取表**: `student_status`, `education`, `degree`, `exam`
```sql
SELECT * FROM student_status WHERE user_id = ?
SELECT * FROM education WHERE user_id = ?
SELECT * FROM degree WHERE user_id = ?
SELECT * FROM exam WHERE user_id = ?
```

#### 请求参数示例
```json
{
  "userId": "uuid-string"
}
```

#### 响应示例
```json
{
  "student_status": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "张三",
      "gender": "男",
      "school": "北京大学",
      "major": "计算机科学",
      ...
    }
  ],
  "education": [...],
  "degree": [...],
  "exam": [...]
}
```

---

### 3.2 更新/插入/删除数据

#### 接口信息
- **路径**: `POST /api/update-data`
- **认证**: 需要签名验证
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
对用户的学籍、学历、学位、考试数据进行增删改操作。

#### 业务逻辑
1. **参数验证**:
   - 表名必须在白名单内: `['student_status', 'education', 'degree', 'exam']`
   - 必须提供 `userId`
   - 更新/删除操作必须提供记录 `id`
2. **字段过滤**: 通过 `INFORMATION_SCHEMA.COLUMNS` 获取有效字段，过滤无效字段
3. **数据清理**: 将 `undefined` 转换为 `null`
4. **执行操作**:
   - **insert**: 生成UUID，插入新记录
   - **update**: 更新指定记录（需匹配 `user_id` 确保权限）
   - **delete**: 删除指定记录（需匹配 `user_id` 确保权限）
5. **记录审计日志**: 记录操作类型、数据变更等

#### 数据库表关联
**读取表**: `INFORMATION_SCHEMA.COLUMNS`（获取字段列表）
```sql
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
```

**操作表**: `student_status` | `education` | `degree` | `exam`

**Insert**:
```sql
INSERT INTO {table} (id, user_id, field1, field2, ...) 
VALUES (?, ?, ?, ?, ...)
```

**Update**:
```sql
UPDATE {table} SET field1 = ?, field2 = ? 
WHERE id = ? AND user_id = ?
```

**Delete**:
```sql
DELETE FROM {table} WHERE id = ? AND user_id = ?
```

#### 请求参数示例
**插入**:
```json
{
  "table": "education",
  "action": "insert",
  "userId": "uuid-string",
  "data": {
    "name": "张三",
    "school": "清华大学",
    "major": "计算机科学与技术",
    "degree_level": "本科"
  }
}
```

**更新**:
```json
{
  "table": "student_status",
  "action": "update",
  "userId": "uuid-string",
  "id": "record-uuid",
  "data": {
    "name": "李四",
    "major": "软件工程"
  }
}
```

**删除**:
```json
{
  "table": "degree",
  "action": "delete",
  "userId": "uuid-string",
  "id": "record-uuid"
}
```

#### 响应示例
**成功**:
```json
{
  "success": true,
  "result": {
    "id": "record-uuid"
  }
}
```

---

## 4. 用户管理模块

### 4.1 查询用户

#### 接口信息
- **路径**: `POST /api/query-user`
- **认证**: 需要签名验证
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
根据条件查询特定用户信息。

#### 业务逻辑
支持多种查询条件组合，返回匹配的用户列表。

#### 数据库表关联
**读取表**: `users`
```sql
SELECT * FROM users WHERE [conditions]
-- 字段: id, username, password, remaining_logins, pdf_limit, 
--       registration_ip, created_at, updated_at
```

#### 请求参数示例
```json
{
  "username": "testuser"
}
```

---

### 4.2 获取所有用户

#### 接口信息
- **路径**: `POST /api/get-all-users`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
获取系统中所有用户的完整信息（仅管理员可用）。

#### 业务逻辑
1. 验证JWT Token中的管理员身份
2. 查询所有用户及其统计数据

#### 数据库表关联
**读取表**: `users`, `login_logs`, `cards`
```sql
SELECT u.*, 
       COUNT(DISTINCT ll.id) as login_count,
       COUNT(DISTINCT c.id) as card_usage_count
FROM users u
LEFT JOIN login_logs ll ON u.id = ll.user_id
LEFT JOIN cards c ON u.id = c.used_by
GROUP BY u.id
ORDER BY u.created_at DESC
```

#### 请求参数示例
```json
{}
```

---

### 4.3 删除用户

#### 接口信息
- **路径**: `POST /api/delete-user`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
彻底删除用户及其所有相关数据（级联删除）。

#### 业务逻辑
1. 验证管理员权限
2. 执行级联删除（外键约束 `ON DELETE CASCADE` 会自动删除关联数据）
3. 记录删除操作日志

#### 数据库表关联
**删除表**: `users`（级联删除 `student_status`, `education`, `degree`, `exam`, `login_logs`）
```sql
DELETE FROM users WHERE id = ?
-- 由于外键约束 ON DELETE CASCADE，以下表的相关记录会被自动删除：
-- - student_status
-- - education
-- - degree
-- - exam
-- - login_logs
```

#### 请求参数示例
```json
{
  "userId": "uuid-string"
}
```

---

### 4.4 修改密码

#### 接口信息
- **路径**: `POST /api/change-password`
- **认证**: 需要签名验证 + JWT认证
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
用户修改自己的密码，或管理员修改任意用户密码。

#### 业务逻辑
1. 验证JWT Token获取当前用户身份
2. 如果是普通用户，只能修改自己的密码
3. 如果是管理员，可以修改任意用户的密码
4. 更新密码并记录操作日志

#### 数据库表关联
**更新表**: `users`
```sql
UPDATE users SET password = ? WHERE id = ?
```

#### 请求参数示例
**普通用户**:
```json
{
  "oldPassword": "oldPass123",
  "newPassword": "newPass456"
}
```

**管理员**:
```json
{
  "targetUserId": "uuid-string",
  "newPassword": "newPass456"
}
```

---

### 4.5 更新用户登录次数

#### 接口信息
- **路径**: `POST /api/update-user-logins`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
增加或减少指定用户的登录次数（管理员功能）。

#### 业务逻辑
1. 验证管理员权限
2. 根据 `action` 参数执行增加或减少操作
3. 记录操作日志

#### 数据库表关联
**更新表**: `users`
```sql
-- 增加
UPDATE users SET remaining_logins = remaining_logins + ? WHERE id = ?

-- 减少
UPDATE users SET remaining_logins = remaining_logins - ? WHERE id = ?
```

#### 请求参数示例
```json
{
  "userId": "uuid-string",
  "action": "increase",
  "amount": 10
}
```

---

### 4.6 重置用户登录次数

#### 接口信息
- **路径**: `POST /api/reset-user-logins`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
将指定用户的登录次数重置为0（管理员功能）。

#### 数据库表关联
**更新表**: `users`
```sql
UPDATE users SET remaining_logins = 0 WHERE id = ?
```

#### 请求参数示例
```json
{
  "userId": "uuid-string"
}
```

---

### 4.7 减少用户登录次数

#### 接口信息
- **路径**: `POST /api/decrease-user-logins`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
减少指定用户的登录次数（管理员功能）。

#### 数据库表关联
**更新表**: `users`
```sql
UPDATE users SET remaining_logins = remaining_logins - ? WHERE id = ?
```

#### 请求参数示例
```json
{
  "userId": "uuid-string",
  "amount": 5
}
```

---

## 5. 充值卡管理模块

### 5.1 充值卡管理

#### 接口信息
- **路径**: `POST /api/manage-cards`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
创建、查询和使用充值卡。充值卡分为两种类型：
- `login`: 增加登录次数
- `pdf`: 增加PDF下载积分

#### 业务逻辑

**创建充值卡 (action: create)**:
1. 验证参数: `type`, `values`, `count`
2. 限制单次创建数量 <= 100张
3. 批量生成UUID并插入数据库

**查询充值卡 (action: list)**:
1. 查询所有充值卡及其使用状态
2. LEFT JOIN users 表获取使用者信息

**使用充值卡 (action: use)**:
1. **安全验证**: 必须提供 `SBverify`（加密的卡ID）和 `username`
2. **解密卡ID**: 使用 `crypto-utils.decrypt()` 解密 `SBverify`
3. **验证卡有效性**:
   - 检查卡是否存在
   - 检查卡是否已被使用
4. **查找用户**: 根据 `username` 查询用户
5. **事务处理**:
   - 标记卡为已使用 (`used = TRUE`)
   - 记录使用者和使用时间
   - 根据卡类型更新用户资源
     - `login` 类型: 增加 `remaining_logins`
     - `pdf` 类型: 增加 `pdf_limit`
   - **特殊规则**: 
     - 使用1次登录卡且当前剩余0次 → 设置 `is_trial_user = 1`
     - 使用>1次登录卡 → 设置 `is_trial_user = 0`
6. **提交事务**: 确保数据一致性
7. **记录审计日志**: 详细记录充值前后的状态变化

#### 数据库表关联

**创建 - 插入表**: `cards`
```sql
INSERT INTO cards (id, type, `values`) VALUES (?, ?, ?)
-- 字段: id(UUID), type('login'|'pdf'), values(INT), used(FALSE), 
--       used_by(NULL), used_at(NULL), created_at(自动)
```

**查询 - 读取表**: `cards`, `users`
```sql
SELECT c.id, c.type, c.values, c.used, u.username as used_by, 
       c.used_at, c.created_at 
FROM cards c 
LEFT JOIN users u ON c.used_by = u.id 
ORDER BY c.created_at DESC
```

**使用 - 检查表**: `cards`, `users`
```sql
-- 检查卡是否存在
SELECT id, type, `values`, used FROM cards WHERE id = ?

-- 查找用户
SELECT id, remaining_logins, pdf_limit, is_trial_user 
FROM users WHERE username = ?
```

**使用 - 更新表**: `cards`, `users`
```sql
-- 标记卡已使用
UPDATE cards SET used = TRUE, used_by = ?, used_at = CURRENT_TIMESTAMP 
WHERE id = ?

-- 更新登录次数
UPDATE users SET remaining_logins = remaining_logins + ? WHERE id = ?

-- 更新体验用户标记（如果需要）
UPDATE users SET is_trial_user = ? WHERE id = ?

-- 更新PDF积分
UPDATE users SET pdf_limit = pdf_limit + ? WHERE id = ?
```

#### 请求参数示例

**创建充值卡**:
```json
{
  "action": "create",
  "type": "login",
  "values": 10,
  "count": 5
}
```

**查询充值卡**:
```json
{
  "action": "list"
}
```

**使用充值卡**:
```json
{
  "action": "use",
  "username": "testuser",
  "SBverify": "encrypted-card-id-string"
}
```

#### 响应示例

**创建成功**:
```json
{
  "success": true,
  "cards": [
    {
      "id": "uuid-1",
      "type": "login",
      "values": 10
    },
    {
      "id": "uuid-2",
      "type": "login",
      "values": 10
    }
  ]
}
```

**使用成功**:
```json
{
  "success": true,
  "message": "充值成功，用户 testuser 当前登录次数剩余 15 次",
  "card": {
    "id": "uuid",
    "type": "login",
    "values": 10
  },
  "user": {
    "remaining_logins": 15,
    "pdf_limit": 5,
    "is_trial_user": 0
  },
  "isPermanentCard": false
}
```

---

## 6. PDF生成模块

### 6.1 生成学位验证报告PDF

#### 接口信息
- **路径**: `POST /api/generate-degree-pdf`
- **认证**: 需要签名验证
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
根据提供的学位信息生成PDF格式的学位在线验证报告，包含照片和二维码。

#### 业务逻辑
1. **参数验证**: 检查必要字段（姓名、性别、出生日期、学位日期、学校、学位类型、专业、证书编号）
2. **加载PDF模板**: 从 `assets/xuewei_tmp.pdf` 读取模板
3. **嵌入字体**: 加载中文字体文件（`msyh.ttf`, `SourceHanSansK-Regular.TTF`）
4. **填充文本**: 在指定坐标位置填入用户信息
5. **处理照片**:
   - 上传照片到MinIO对象存储
   - 在PDF中嵌入证件照（标准1:1.33比例）
6. **生成二维码**:
   - 构建验证URL（包含所有学位信息参数）
   - 生成短码（存储在 `qr_code_urls` 表）
   - 使用短码URL生成高清二维码（12倍分辨率）
   - 二维码模式: `available`（正常）或 `maintenance`（维护提示）
7. **保存PDF**:
   - 优先上传到MinIO的 `reports/` 目录
   - 本地备份到 `report_records/` 目录
8. **返回结果**: 返回MinIO下载链接或直接发送PDF数据

#### 数据库表关联

**读取表**: 无（纯生成操作）

**插入表**: `qr_code_urls`（由 `qrCodeManager.saveUrlWithShortCode()` 调用）
```sql
INSERT INTO qr_code_urls (id, short_code, full_url, pdf_type, expires_at) 
VALUES (?, ?, ?, 'degree', ?)
-- 字段: id(UUID), short_code(VARCHAR(20)), full_url(TEXT), 
--       pdf_type('degree'), created_at(自动), expires_at(TIMESTAMP),
--       scan_count(0), last_scanned_at(NULL)
```

**MinIO存储**:
- 照片: `photos/{name}_{timestamp}_{random}.jpg|png`
- PDF报告: `reports/{fileName}_{timestamp}_{random}.pdf`

#### 请求参数示例
```json
{
  "name": "张三",
  "gender": "男",
  "birthDate": "1998-05-15",
  "degreeDate": "2020-06-30",
  "university": "北京大学",
  "degreeType": "工学学士",
  "major": "计算机科学与技术",
  "certificateNumber": "12345678901234",
  "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

#### 响应示例

**成功（MinIO上传）**:
```json
{
  "success": true,
  "downloadUrl": "http://cheerot.cn:19000/editmydegree/reports/中国高等教育学位在线验证报告_张三_1234567890_abc123.pdf",
  "fileName": "中国高等教育学位在线验证报告_张三_1234567890.pdf",
  "message": "PDF 生成成功"
}
```

**成功（直接发送）**:
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="*.pdf"`
- Body: PDF二进制数据

---

### 6.2 生成学历验证报告PDF

#### 接口信息
- **路径**: `POST /api/generate-education-pdf`
- **认证**: 需要签名验证
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
生成教育部学历证书电子注册备案表PDF。

#### 业务逻辑
与学位PDF类似，但使用不同的模板和字段。

#### 数据库表关联
**插入表**: `qr_code_urls`
```sql
INSERT INTO qr_code_urls (id, short_code, full_url, pdf_type, expires_at) 
VALUES (?, ?, ?, 'education', ?)
```

#### 请求参数示例
```json
{
  "name": "张三",
  "gender": "男",
  "birthDate": "1998-05-15",
  "enrollmentDate": "2016-09-01",
  "graduationDate": "2020-06-30",
  "school": "北京大学",
  "major": "计算机科学与技术",
  "duration": "4年",
  "level": "本科",
  "educationType": "普通高等教育",
  "studyType": "全日制",
  "graduationStatus": "毕业",
  "certificateNumber": "12345678901234",
  "principalName": "李四",
  "photo": "data:image/jpeg;base64,..."
}
```

---

### 6.3 生成学籍验证报告PDF

#### 接口信息
- **路径**: `POST /api/generate-student-status-pdf`
- **认证**: 需要签名验证
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
生成教育部学籍在线验证报告PDF。

#### 数据库表关联
**插入表**: `qr_code_urls`
```sql
INSERT INTO qr_code_urls (id, short_code, full_url, pdf_type, expires_at) 
VALUES (?, ?, ?, 'student_status', ?)
```

#### 请求参数示例
```json
{
  "name": "张三",
  "gender": "男",
  "birthDate": "1998-05-15",
  "enrollmentDate": "2016-09-01",
  "school": "北京大学",
  "major": "计算机科学与技术",
  "studyType": "全日制",
  "degreeLevel": "本科",
  "status": "在籍",
  "photo": "data:image/jpeg;base64,..."
}
```

---

## 7. 统计分析模块

### 7.1 获取今日登录统计

#### 接口信息
- **路径**: `POST /api/get-today-login-count`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
获取当天系统的登录统计数据。

#### 数据库表关联
**读取表**: `login_logs`
```sql
SELECT COUNT(*) as total_logins,
       COUNT(DISTINCT user_id) as unique_users,
       COUNT(DISTINCT login_ip) as unique_ips
FROM login_logs 
WHERE DATE(login_time) = CURDATE()
```

#### 请求参数示例
```json
{}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "total_logins": 150,
    "unique_users": 80,
    "unique_ips": 75
  }
}
```

---

### 7.2 获取每小时登录统计

#### 接口信息
- **路径**: `POST /api/get-hourly-login-stats`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
获取指定日期每小时的登录统计数据。

#### 数据库表关联
**读取表**: `login_logs`
```sql
SELECT HOUR(login_time) as hour,
       COUNT(*) as login_count
FROM login_logs 
WHERE DATE(login_time) = ?
GROUP BY HOUR(login_time)
ORDER BY hour
```

#### 请求参数示例
```json
{
  "date": "2024-01-15"
}
```

---

### 7.3 获取登录统计范围

#### 接口信息
- **路径**: `POST /api/get-login-stats-range`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
获取一周或一月内的每日登录统计数据。

#### 数据库表关联
**读取表**: `login_logs`
```sql
SELECT DATE(login_time) as date,
       COUNT(*) as login_count,
       COUNT(DISTINCT user_id) as unique_users
FROM login_logs 
WHERE login_time >= ? AND login_time <= ?
GROUP BY DATE(login_time)
ORDER BY date
```

#### 请求参数示例
```json
{
  "range": "week",  // 或 "month"
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

---

### 7.4 获取用户活跃度热力图

#### 接口信息
- **路径**: `POST /api/get-user-activity-heatmap`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
展示7天×24小时的登录密度分布热力图数据。

#### 数据库表关联
**读取表**: `login_logs`
```sql
SELECT DAYOFWEEK(login_time) as day_of_week,
       HOUR(login_time) as hour,
       COUNT(*) as login_count
FROM login_logs 
WHERE login_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DAYOFWEEK(login_time), HOUR(login_time)
```

#### 请求参数示例
```json
{}
```

#### 响应示例
```json
{
  "success": true,
  "data": [
    { "day": 1, "hour": 0, "count": 5 },
    { "day": 1, "hour": 1, "count": 3 },
    ...
  ]
}
```

---

### 7.5 获取Top活跃用户排行榜

#### 接口信息
- **路径**: `POST /api/get-top-active-users`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
显示登录次数最多的前N个用户。

#### 数据库表关联
**读取表**: `login_logs`, `users`
```sql
SELECT u.username,
       COUNT(ll.id) as login_count,
       MAX(ll.login_time) as last_login
FROM login_logs ll
JOIN users u ON ll.user_id = u.id
GROUP BY u.id, u.username
ORDER BY login_count DESC
LIMIT 10
```

#### 请求参数示例
```json
{
  "limit": 10
}
```

---

### 7.6 获取省份登录统计

#### 接口信息
- **路径**: `POST /api/get-province-login-stats`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
展示各省份用户登录次数分布（基于IP地理位置）。

#### 数据库表关联
**读取表**: `login_logs`
```sql
SELECT ip_location,
       COUNT(*) as login_count
FROM login_logs 
WHERE ip_location IS NOT NULL AND ip_location != '未知'
GROUP BY ip_location
ORDER BY login_count DESC
```

#### 请求参数示例
```json
{}
```

---

### 7.7 获取今日登录详情

#### 接口信息
- **路径**: `POST /api/get-today-login-details`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
获取今天所有用户的详细登录记录。

#### 数据库表关联
**读取表**: `login_logs`
```sql
SELECT ll.*, u.username
FROM login_logs ll
LEFT JOIN users u ON ll.user_id = u.id
WHERE DATE(ll.login_time) = CURDATE()
ORDER BY ll.login_time DESC
```

#### 请求参数示例
```json
{}
```

---

### 7.8 查询用户登录次数和PDF积分

#### 接口信息
- **路径**: `POST /api/query-user-logins-pdf`
- **认证**: 无需签名验证
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
用户查询自己的登录次数和PDF积分。

#### 数据库表关联
**读取表**: `users`
```sql
SELECT username, remaining_logins, pdf_limit 
FROM users WHERE username = ?
```

#### 请求参数示例
```json
{
  "username": "testuser"
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "username": "testuser",
    "remaining_logins": 15,
    "pdf_limit": 10
  }
}
```

---

### 7.9 获取用户卡密使用记录

#### 接口信息
- **路径**: `POST /api/get-user-card-history`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
查看指定用户使用过的充值卡详情。

#### 数据库表关联
**读取表**: `cards`, `users`
```sql
SELECT c.id, c.type, c.values, c.used_at, c.created_at
FROM cards c
WHERE c.used_by = ?
ORDER BY c.used_at DESC
```

#### 请求参数示例
```json
{
  "userId": "uuid-string"
}
```

---

## 8. 留言管理模块

### 8.1 获取留言列表

#### 接口信息
- **路径**: `POST /api/get-messages`
- **认证**: 无需认证
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
分页获取所有用户的留言列表。

#### 数据库表关联
**读取表**: `messages`
```sql
SELECT id, username, content, reply_content, replied_at, created_at
FROM messages
ORDER BY created_at DESC
LIMIT ? OFFSET ?
```

#### 请求参数示例
```json
{
  "page": 1,
  "pageSize": 10
}
```

---

### 8.2 添加留言

#### 接口信息
- **路径**: `POST /api/add-message`
- **认证**: 无需认证
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
用户提交新留言。

#### 数据库表关联
**插入表**: `messages`
```sql
INSERT INTO messages (id, username, content) 
VALUES (UUID(), ?, ?)
-- 字段: id(UUID), username, content, reply_content(NULL), 
--       replied_at(NULL), created_at(自动)
```

#### 请求参数示例
```json
{
  "username": "testuser",
  "content": "这是一条留言内容"
}
```

---

## 9. 安全管理模块

### 9.1 IP黑名单管理

#### 接口信息
- **路径**: `POST /api/manage-ip-blacklist`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
管理IP黑名单（查询、更新、删除）。

#### 业务逻辑

**查询黑名单 (action: list)**:
1. 查询所有IP黑名单记录
2. 支持按IP地址搜索
3. 分页显示

**更新黑名单 (action: update)**:
1. 修改封禁原因和封禁截止时间
2. 记录操作日志

**删除黑名单 (action: delete)**:
1. 删除指定的IP黑名单记录
2. 记录操作日志

#### 数据库表关联

**查询 - 读取表**: `ip_blacklist`
```sql
SELECT id, ip_address, reason, blocked_until, created_at
FROM ip_blacklist
WHERE ip_address LIKE ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?
```

**更新 - 更新表**: `ip_blacklist`
```sql
UPDATE ip_blacklist 
SET reason = ?, blocked_until = ? 
WHERE id = ?
```

**删除 - 删除表**: `ip_blacklist`
```sql
DELETE FROM ip_blacklist WHERE id = ?
```

#### 请求参数示例

**查询**:
```json
{
  "action": "list",
  "search": "192.168",
  "page": 1,
  "pageSize": 10
}
```

**更新**:
```json
{
  "action": "update",
  "id": "uuid-string",
  "reason": "恶意攻击",
  "blockedUntil": "2024-12-31T23:59:59Z"
}
```

**删除**:
```json
{
  "action": "delete",
  "id": "uuid-string"
}
```

---

### 9.2 PDF生成管理

#### 接口信息
- **路径**: `POST /api/manage-pdf-generation`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
查看和管理PDF生成记录及二维码信息。

#### 业务逻辑

**查询记录 (action: list)**:
1. 查询所有PDF生成记录
2. 从URL参数中提取用户姓名信息
3. 计算二维码过期状态和剩余天数
4. 支持多维度筛选（类型、用户名、姓名、短码）
5. 分页显示

**更新过期时间 (action: update)**:
1. 修改指定二维码的过期时间
2. 记录操作日志

#### 数据库表关联

**查询 - 读取表**: `qr_code_urls`
```sql
SELECT id, short_code, full_url, pdf_type, created_at, 
       expires_at, scan_count, last_scanned_at
FROM qr_code_urls
ORDER BY created_at DESC
LIMIT ? OFFSET ?
```

**URL参数提取逻辑**:
```javascript
// 从 full_url 中提取 name 参数
const urlObj = new URL(full_url);
const name = urlObj.searchParams.get('name') || '未知用户';
```

**更新 - 更新表**: `qr_code_urls`
```sql
UPDATE qr_code_urls 
SET expires_at = ? 
WHERE id = ?
```

#### 请求参数示例

**查询**:
```json
{
  "action": "list",
  "pdfType": "degree",
  "search": "张三",
  "page": 1,
  "pageSize": 10
}
```

**更新**:
```json
{
  "action": "update",
  "id": "uuid-string",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**删除**:
```json
{
  "action": "delete",
  "id": "uuid-string"
}
```

#### 响应示例
``json
{
  "success": true,
  "records": [
    {
      "id": "uuid",
      "short_code": "ABC123",
      "pdf_type": "degree",
      "created_at": "2024-01-15T10:30:00Z",
      "expires_at": "2024-01-16T10:30:00Z",
      "scan_count": 5,
      "last_scanned_at": "2024-01-15T15:20:00Z",
      "username": "testuser",
      "name": "张三",
      "pdf_type_label": "学位验证",
      "is_expired": false,
      "remaining_days": 1
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

**更新成功**:
```json
{
  "success": true,
  "message": "二维码过期时间已更新",
  "newExpiresAt": "2024-12-31T23:59:59Z"
}
```

**删除成功**:
```json
{
  "success": true,
  "message": "二维码记录已删除"
}
```

---

### 9.3 减少PDF限制

#### 接口信息
- **路径**: `POST /api/decrease-pdf-limit`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
减少用户的PDF下载积分（管理员功能）。

#### 数据库表关联
**更新表**: `users`
```sql
UPDATE users SET pdf_limit = pdf_limit - ? WHERE id = ?
```

#### 请求参数示例
```json
{
  "userId": "uuid-string",
  "amount": 5
}
```

---

### 9.4 增加PDF限制

#### 接口信息
- **路径**: `POST /api/increase-pdf-limit`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
增加用户的PDF下载积分（管理员功能）。

#### 数据库表关联
**更新表**: `users`
```sql
UPDATE users SET pdf_limit = pdf_limit + ? WHERE id = ?
```

#### 请求参数示例
```json
{
  "userId": "uuid-string",
  "amount": 10
}
```

---

### 9.5 重置PDF限制

#### 接口信息
- **路径**: `POST /api/reset-pdf-limit`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
重置用户的PDF下载积分为默认值（管理员功能）。

#### 数据库表关联
**更新表**: `users`
```sql
UPDATE users SET pdf_limit = 0 WHERE id = ?
```

#### 请求参数示例
```json
{
  "userId": "uuid-string"
}
```

---

### 9.6 管理员直接登录用户

#### 接口信息
- **路径**: `POST /api/admin-impersonate-login`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
允许管理员免积分、免次数限制直接登录到指定用户账号（用于技术支持和问题排查）。

#### 业务逻辑
1. 验证管理员JWT Token
2. 根据目标用户名查找用户
3. 生成该用户的JWT Token（不消耗登录次数）
4. 记录审计日志（包含管理员ID和目标用户ID）
5. 返回目标用户的Token和用户信息

#### 数据库表关联
**读取表**: `users`
```sql
SELECT id, username, remaining_logins, pdf_limit 
FROM users WHERE username = ?
```

**插入表**: `login_logs`（可选，记录管理员代登录行为）
```sql
INSERT INTO login_logs (user_id, username, login_ip, ip_location, is_admin_impersonate) 
VALUES (?, ?, ?, ?, TRUE)
```

#### 请求参数示例
```json
{
  "targetUsername": "testuser"
}
```

#### 响应示例
**成功**:
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "username": "testuser",
    "remaining_logins": 10,
    "pdf_limit": 5
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "管理员已成功登录到用户 testuser 的账号"
}
```

**失败 - 用户不存在**:
```json
{
  "success": false,
  "error": "用户不存在"
}
```

---

### 9.7 忘记密码重置

#### 接口信息
- **路径**: `POST /api/reset-password`
- **认证**: 需要签名验证
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
用户通过充值卡密验证身份后重置密码（无需提供原密码）。

#### 业务逻辑
1. 验证卡密有效性（加密的卡ID通过`SBverify`传递）
2. 解密卡ID并检查是否已使用
3. 根据用户名查找用户
4. 更新用户密码
5. 标记卡密为已使用
6. 记录操作日志

#### 数据库表关联
**读取表**: `cards`, `users`
```sql
-- 检查卡密
SELECT id, type, values, used FROM cards WHERE id = ?

-- 查找用户
SELECT id FROM users WHERE username = ?
```

**更新表**: `users`, `cards`
```sql
-- 更新密码
UPDATE users SET password = ? WHERE id = ?

-- 标记卡密已使用
UPDATE cards SET used = TRUE, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?
```

#### 请求参数示例
```json
{
  "username": "testuser",
  "newPassword": "newSecurePass123",
  "SBverify": "encrypted-card-id-string"
}
```

#### 响应示例
**成功**:
```json
{
  "success": true,
  "message": "密码重置成功"
}
```

**失败 - 卡密无效**:
```json
{
  "success": false,
  "error": "无效的充值卡或卡密已被使用"
}
```

---

### 9.8 异常登录检测

#### 接口信息
- **路径**: `POST /api/get-anomaly-login-detection`
- **认证**: 需要签名验证 + JWT管理员权限
- **限流**: 每IP每5分钟最多100次请求

#### 功能描述
检测系统中的异常登录行为，包括频繁登录、异常时间段登录等。

#### 业务逻辑
1. **频繁登录检测**: 1小时内登录超过5次的用户
2. **异常时间段检测**: 凌晨0-5点的登录记录
3. **单日登录异常**: 单日登录超过20次的用户
4. 返回所有检测到的异常数据

#### 数据库表关联
**读取表**: `login_logs`, `users`
```sql
-- 频繁登录检测
SELECT u.username, DATE(l.login_time) as login_date, 
       HOUR(l.login_time) as hour, COUNT(*) as login_count
FROM login_logs l
JOIN users u ON l.user_id = u.id
WHERE l.login_time >= ?
GROUP BY u.id, DATE(l.login_time), HOUR(l.login_time)
HAVING login_count > 5

-- 异常时间段登录
SELECT u.username, l.login_time, HOUR(l.login_time) as hour
FROM login_logs l
JOIN users u ON l.user_id = u.id
WHERE l.login_time >= ? AND HOUR(l.login_time) >= 0 AND HOUR(l.login_time) < 5

-- 单日登录异常
SELECT u.username, DATE(l.login_time) as login_date, COUNT(*) as daily_logins
FROM login_logs l
JOIN users u ON l.user_id = u.id
WHERE l.login_time >= ?
GROUP BY u.id, DATE(l.login_time)
HAVING daily_logins > 20
```

#### 请求参数示例
```json
{
  "days": 7
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "frequentLogins": [
      {
        "username": "testuser",
        "login_date": "2024-01-15",
        "hour": 14,
        "login_count": 8
      }
    ],
    "abnormalTimeLogins": [
      {
        "username": "nightowl",
        "login_time": "2024-01-15T02:30:00Z",
        "hour": 2
      }
    ],
    "dailyAnomalies": [
      {
        "username": "poweruser",
        "login_date": "2024-01-15",
        "daily_logins": 25
      }
    ]
  }
}
```

---

## 10. 留言板管理增强

### 10.1 留言板管理（完整功能）

#### 接口信息
- **路径**: `POST /api/message-board`
- **认证**: 部分操作需要签名验证 + JWT管理员权限
- **限流**: 见各子操作的限流规则

#### 功能描述
提供完整的留言板管理功能，包括获取留言、回复留言、设置优先级、删除留言等。

#### 业务逻辑

**获取留言列表 (action: getMessages)**:
1. 分页查询所有留言
2. 按优先级排序（有优先级的在前，按priority升序）
3. 无优先级的按创建时间降序排列
4. 返回总记录数和分页数据

**回复留言 (action: replyMessage)**:
1. 验证管理员权限
2. 更新留言的回复内容和回复时间
3. 记录操作日志

**设置优先级 (action: setPriority)**:
1. 验证管理员权限
2. 设置留言的优先级值（数字越小优先级越高）
3. 记录操作日志

**删除留言 (action: deleteMessage)**:
1. 验证管理员权限
2. 删除指定留言
3. 记录操作日志

#### 数据库表关联

**读取表**: `messages`
```sql
-- 获取留言列表
SELECT id, username, content, reply_content, replied_at, priority, created_at 
FROM messages 
ORDER BY 
  CASE WHEN priority IS NOT NULL THEN 0 ELSE 1 END,
  priority ASC,
  created_at DESC 
LIMIT ? OFFSET ?

-- 查询总数
SELECT COUNT(*) as total FROM messages
```

**更新表**: `messages`
```sql
-- 回复留言
UPDATE messages 
SET reply_content = ?, replied_at = CURRENT_TIMESTAMP 
WHERE id = ?

-- 设置优先级
UPDATE messages SET priority = ? WHERE id = ?
```

**删除表**: `messages`
```sql
DELETE FROM messages WHERE id = ?
```

#### 请求参数示例

**获取留言**:
```json
{
  "action": "getMessages",
  "page": 1,
  "pageSize": 10
}
```

**回复留言**:
```json
{
  "action": "replyMessage",
  "id": "uuid-string",
  "replyContent": "这是管理员的回复内容"
}
```

**设置优先级**:
```json
{
  "action": "setPriority",
  "id": "uuid-string",
  "priority": 1
}
```

**删除留言**:
```json
{
  "action": "deleteMessage",
  "id": "uuid-string"
}
```

#### 响应示例

**获取留言成功**:
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "username": "testuser",
      "content": "这是一条留言",
      "reply_content": "管理员回复",
      "replied_at": "2024-01-15T10:00:00Z",
      "priority": 1,
      "created_at": "2024-01-14T08:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

**操作成功**:
```json
{
  "success": true,
  "message": "操作成功"
}
```

---

## 11. 二维码重定向

### 11.1 二维码短码重定向

#### 接口信息
- **路径**: `GET /qr/:shortCode`
- **认证**: 无需认证
- **签名验证**: ❌ 不需要（公开访问）

#### 功能描述
处理扫码后的短码重定向，跳转到完整的验证页面URL。

#### 业务逻辑
1. 根据短码查询 `qr_code_urls` 表
2. 如果找到且未过期：
   - 增加扫描计数 `scan_count + 1`
   - 更新最后扫描时间 `last_scanned_at`
   - 重定向到 `full_url`
3. 如果未找到或已过期：
   - 返回404错误页面

#### 数据库表关联

**读取表**: `qr_code_urls`
```sql
SELECT full_url, expires_at FROM qr_code_urls 
WHERE short_code = ?
```

**更新表**: `qr_code_urls`
```sql
UPDATE qr_code_urls 
SET scan_count = scan_count + 1, 
    last_scanned_at = CURRENT_TIMESTAMP 
WHERE short_code = ?
```

#### 请求示例
```
GET /qr/ABC123
```

#### 响应
- **成功**: HTTP 302 重定向到完整URL
- **失败**: HTTP 404 错误页面

---

## 12. 安全机制

### 12.1 JWT身份认证

#### 工作原理
1. 用户/管理员登录后获得JWT Token
2. 后续请求在Header中携带: `Authorization: Bearer <token>`
3. 服务端验证Token的有效性和权限

#### Token结构
```json
{
  "id": "user-uuid",
  "username": "testuser",
  "isAdmin": true,  // 仅管理员Token包含
  "iat": 1234567890,
  "exp": 1234567890
}
```

#### 有效期
- 普通用户: 24小时
- 管理员: 72小时

---

### 11.2 签名验证中间件

#### 适用接口
除 `/api/auth` 和 `/api/admin-auth` 外的所有接口

#### 验证流程
1. **检查必要Header**:
   - `x-timestamp`: 请求时间戳
   - `x-signature`: 签名字符串
   - `x-app-key`: 应用密钥

2. **时间戳验证**: 允许5分钟的时间差

3. **App Key验证**: 从环境变量 `VALID_APP_KEYS` 中验证

4. **签名生成与比对**:
   ```javascript
   // 构造待签名字符串
   const signString = `${METHOD}${URL}${sortedParams}${timestamp}`;
   
   // 生成签名（哈希算法）
   const signature = generateHash(signString + secretKey);
   ```

5. **验证失败**: 返回401错误

#### 免签白名单
- `/api/auth` - 用户登录
- `/api/admin-auth` - 管理员登录

---

### 11.3 速率限制

#### 全局限流
- **规则**: 每IP每5分钟最多100次请求
- **响应**: 429 Too Many Requests

#### 注册限流
- **规则**: 每IP每天最多5次注册
- **响应**: 429 Too Many Requests

---

### 11.4 IP黑名单

#### 工作机制
1. **数据库存储**: `ip_blacklist` 表存储动态管理的黑名单（通过管理员界面或自动封禁）
2. **频率限制**: 基于IP的请求频率检测，超过阈值自动封禁15分钟
3. **中间件检查**: 每个请求首先检查IP是否在黑名单中
4. **自动告警**: 检测到黑名单IP访问时发送邮件告警

#### 封禁效果
- HTTP 403 Forbidden
- 记录访问日志
- 发送安全告警邮件
- 前端显示友好提示："由于请求过于频繁，您的IP已被临时封禁。请在15分钟后再试。"

---

### 11.5 审计日志

#### 记录内容
- 用户操作（登录、注册、数据修改）
- 管理员操作（用户管理、系统配置）
- 安全事件（IP黑名单访问、非法API调用）

#### 日志级别
- `info`: 正常操作
- `warn`: 警告事件
- `error`: 错误事件
- `safe`: 敏感操作（如充值卡使用）

---

### 11.6 邮件告警

#### 触发场景
1. 黑名单IP尝试登录
2. IP注册频率超限
3. 充值卡使用缺少必要参数
4. 使用不存在的充值卡
5. 其他安全异常

#### 告警内容
- 事件类型
- IP地址
- User-Agent
- 时间戳
- 详细信息

---

### 11.7 数据加密

#### 充值卡加密
- 使用 `crypto-utils` 模块加密/解密卡ID
- 前端传递加密后的 `SBverify` 参数
- 后端解密后验证卡的有效性

#### 密码存储
- 当前使用明文存储（生产环境应使用bcrypt加密）

---

## 附录

### A. 数据库表结构详解

#### users - 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| username | VARCHAR(255) | 用户名（唯一） |
| password | VARCHAR(255) | 密码 |
| remaining_logins | INT | 剩余登录次数 |
| pdf_limit | INT | PDF下载积分（最大90） |
| registration_ip | VARCHAR(45) | 注册IP地址 |
| is_trial_user | TINYINT | 是否为体验用户（0/1） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### student_status - 学籍信息表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| user_id | VARCHAR(36) | 外键关联users.id |
| name | TEXT | 姓名 |
| gender | TEXT | 性别 |
| birth_date | TEXT | 出生日期 |
| school | TEXT | 学校 |
| major | TEXT | 专业 |
| study_type | TEXT | 学习形式 |
| degree_level | TEXT | 层次 |
| status | TEXT | 学籍状态 |
| enrollment_date | TEXT | 入学日期 |
| graduation_date | TEXT | 毕业日期 |
| photo | LONGTEXT | Base64照片 |
| ... | ... | 其他字段 |

#### education - 学历信息表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| user_id | VARCHAR(36) | 外键关联users.id |
| name | TEXT | 姓名 |
| school | TEXT | 学校 |
| major | TEXT | 专业 |
| certificate_number | TEXT | 证书编号 |
| graduation_status | TEXT | 毕业状态 |
| photo | LONGTEXT | Base64照片 |
| ... | ... | 其他字段 |

#### degree - 学位信息表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| user_id | VARCHAR(36) | 外键关联users.id |
| name | TEXT | 姓名 |
| school | TEXT | 学校 |
| major | TEXT | 专业 |
| degree_type | TEXT | 学位类型 |
| certificate_number | TEXT | 证书编号 |
| degree_date | TEXT | 学位授予日期 |
| photo | LONGTEXT | Base64照片 |

#### exam - 考试信息表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| user_id | VARCHAR(36) | 外键关联users.id |
| name | TEXT | 姓名 |
| school | TEXT | 学校 |
| year | TEXT | 年份 |
| total_score | TEXT | 总分 |
| photo | LONGTEXT | Base64照片 |
| ... | ... | 其他成绩字段 |

#### login_logs - 登录日志表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| user_id | VARCHAR(36) | 外键关联users.id |
| username | TEXT | 用户名 |
| login_time | TIMESTAMP | 登录时间 |
| login_ip | VARCHAR(45) | 登录IP |
| ip_location | TEXT | IP地理位置 |

#### cards - 充值卡表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| values | INT | 面值 |
| type | ENUM | 类型（login/pdf） |
| used | BOOLEAN | 是否已使用 |
| used_by | VARCHAR(36) | 使用者ID（外键） |
| used_at | TIMESTAMP | 使用时间 |
| created_at | TIMESTAMP | 创建时间 |

#### admins - 管理员表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| username | VARCHAR(255) | 用户名（唯一） |
| password | VARCHAR(255) | 密码 |
| created_at | TIMESTAMP | 创建时间 |

#### messages - 留言表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| username | VARCHAR(255) | 用户名 |
| content | TEXT | 留言内容 |
| reply_content | TEXT | 回复内容（管理员回复） |
| replied_at | TIMESTAMP | 回复时间 |
| priority | INT | 优先级（数字越小优先级越高，NULL表示无优先级） |
| created_at | TIMESTAMP | 创建时间 |

#### ip_blacklist - IP黑名单表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| ip_address | VARCHAR(45) | IP地址（支持IPv4和IPv6） |
| reason | TEXT | 封禁原因 |
| blocked_until | TIMESTAMP | 封禁截止时间（NULL表示永久封禁） |
| created_at | TIMESTAMP | 创建时间 |

#### qr_code_urls - 二维码短码表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| short_code | VARCHAR(20) | 短码（唯一，用于生成短URL） |
| full_url | TEXT | 完整URL（包含所有查询参数，如username、name等） |
| pdf_type | ENUM | PDF类型：'degree'（学位验证）、'education'（学历验证）、'student_status'（学籍验证） |
| created_at | TIMESTAMP | 创建时间 |
| expires_at | TIMESTAMP | 过期时间（超过此时间的二维码将失效） |
| scan_count | INT | 扫描次数（每次扫码后自动+1） |
| last_scanned_at | TIMESTAMP | 最后扫描时间 |

---

### B. 环境变量配置

``env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=edit_my_degree
DB_PORT=3306

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
SUPERADD_JWT_EXPIRES_IN=72h

# 会话时长配置（毫秒）
SESSION_DURATION_LEVEL_1=180000    # 3分钟（≤1次登录）
SESSION_DURATION_LEVEL_2=480000    # 8分钟（≤5次登录）
SESSION_DURATION_LEVEL_3=1200000   # 20分钟（≤50次登录）
SESSION_DURATION_LEVEL_4=86400000  # 24小时（>50次登录，如永久卡）

# API签名验证
API_SECRET_KEY=your-api-secret
VALID_APP_KEYS=key1,key2,key3

# MinIO对象存储
MINIO_ENDPOINT=cheerot.cn:19000
MINIO_ACCESS_KEY=access-key
MINIO_SECRET_KEY=secret-key
MINIO_BUCKET=editmydegree
MINIO_USE_SSL=false

# PDF二维码模式
PDF_QR_CODE_MODE=available  # available | maintenance

# 验证基础URL
VERIFICATION_BASE_URL=https://your-domain.com

# 二维码过期时间（天）
QR_CODE_EXPIRES_IN_DAYS=1
```

---

### C. 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（签名验证失败） |
| 403 | 禁止访问（IP黑名单/登录次数不足） |
| 404 | 资源不存在 |
| 429 | 请求过多（速率限制） |
| 500 | 服务器内部错误 |
| 503 | 服务不可用（数据库连接问题） |

---

### D. 最佳实践

1. **安全性**:
   - 始终使用HTTPS传输敏感数据
   - 定期更换JWT密钥
   - 生产环境使用bcrypt加密密码
   - 定期审查和更新IP黑名单

2. **性能优化**:
   - 合理使用数据库索引
   - 启用查询缓存
   - 使用连接池管理数据库连接
   - 异步处理非关键操作（如邮件发送）

3. **监控与日志**:
   - 定期检查审计日志
   - 监控API调用频率
   - 设置异常告警阈值
   - 定期备份数据库

4. **数据完整性**:
   - 使用事务确保数据一致性
   - 实现外键约束
   - 定期清理过期数据
   - 验证输入数据格式

---

### E. API端点总览

#### 认证模块
| 方法 | 路径 | 认证 | 签名 | 限流 | 说明 |
|------|------|------|------|------|------|
| POST | `/api/auth` | ❌ | ❌ | 100次/5分钟 | 用户登录 |
| POST | `/api/admin-auth` | ❌ | ❌ | 100次/5分钟 | 管理员登录 |
| POST | `/api/register` | ❌ | ✅ | 5次/天 | 用户注册 |

#### 数据管理模块
| 方法 | 路径 | 认证 | 签名 | 限流 | 说明 |
|------|------|------|------|------|------|
| POST | `/api/get-user-data` | ❌ | ✅ | 100次/5分钟 | 获取用户数据 |
| POST | `/api/update-data` | ❌ | ✅ | 100次/5分钟 | 增删改数据 |

#### 用户管理模块
| 方法 | 路径 | 认证 | 签名 | 限流 | 说明 |
|------|------|------|------|------|------|
| POST | `/api/query-user` | ❌ | ✅ | 100次/5分钟 | 查询用户 |
| POST | `/api/get-all-users` | JWT(Admin) | ✅ | 100次/5分钟 | 获取所有用户 |
| POST | `/api/delete-user` | JWT(Admin) | ✅ | 100次/5分钟 | 删除用户 |
| POST | `/api/change-password` | JWT | ✅ | 100次/5分钟 | 修改密码 |
| POST | `/api/update-user-logins` | JWT(Admin) | ✅ | 100次/5分钟 | 更新登录次数 |
| POST | `/api/reset-user-logins` | JWT(Admin) | ✅ | 100次/5分钟 | 重置登录次数 |
| POST | `/api/decrease-user-logins` | JWT(Admin) | ✅ | 100次/5分钟 | 减少登录次数 |
| POST | `/api/admin-impersonate-login` | JWT(Admin) | ✅ | 100次/5分钟 | 管理员代登录 |
| POST | `/api/reset-password` | ❌ | ✅ | 100次/5分钟 | 忘记密码重置 |

#### 充值卡管理模块
| 方法 | 路径 | 认证 | 签名 | 限流 | 说明 |
|------|------|------|------|------|------|
| POST | `/api/manage-cards` | JWT(Admin) | ✅ | 3次/小时(create)<br>10次/分钟(use) | 充值卡管理 |

#### PDF生成模块
| 方法 | 路径 | 认证 | 签名 | 限流 | 说明 |
|------|------|------|------|------|------|
| POST | `/api/generate-degree-pdf` | JWT | ✅ | 2次/分钟 | 生成学位PDF |
| POST | `/api/generate-education-pdf` | JWT | ✅ | 2次/分钟 | 生成学历PDF |
| POST | `/api/generate-student-status-pdf` | JWT | ✅ | 2次/分钟 | 生成学籍PDF |

#### 统计分析模块
| 方法 | 路径 | 认证 | 签名 | 限流 | 说明 |
|------|------|------|------|------|------|
| POST | `/api/get-today-login-count` | JWT(Admin) | ✅ | 100次/5分钟 | 今日登录统计 |
| POST | `/api/get-hourly-login-stats` | JWT(Admin) | ✅ | 100次/5分钟 | 每小时统计 |
| POST | `/api/get-login-stats-range` | JWT(Admin) | ✅ | 100次/5分钟 | 范围统计 |
| POST | `/api/get-user-activity-heatmap` | JWT(Admin) | ✅ | 100次/5分钟 | 活跃度热力图 |
| POST | `/api/get-top-active-users` | JWT(Admin) | ✅ | 100次/5分钟 | Top活跃用户 |
| POST | `/api/get-province-login-stats` | JWT(Admin) | ✅ | 100次/5分钟 | 省份统计 |
| POST | `/api/get-today-login-details` | JWT(Admin) | ✅ | 100次/5分钟 | 今日登录详情 |
| POST | `/api/query-user-logins-pdf` | ❌ | ❌ | 100次/5分钟 | 查询用户资源 |
| POST | `/api/get-user-card-history` | JWT(Admin) | ✅ | 100次/5分钟 | 卡密使用记录 |
| POST | `/api/get-anomaly-login-detection` | JWT(Admin) | ✅ | 100次/5分钟 | 异常登录检测 |

#### 留言管理模块
| 方法 | 路径 | 认证 | 签名 | 限流 | 说明 |
|------|------|------|------|------|------|
| POST | `/api/get-messages` | ❌ | ❌ | 100次/5分钟 | 获取留言列表 |
| POST | `/api/add-message` | ❌ | ✅ | 3次/分钟<br>20次/小时 | 添加留言 |
| POST | `/api/message-board` | JWT(Admin) | ✅ | 100次/5分钟 | 留言板管理 |

#### 安全管理模块
| 方法 | 路径 | 认证 | 签名 | 限流 | 说明 |
|------|------|------|------|------|------|
| POST | `/api/manage-ip-blacklist` | JWT(Admin) | ✅ | 100次/5分钟 | IP黑名单管理 |
| POST | `/api/manage-pdf-generation` | JWT(Admin) | ✅ | 100次/5分钟 | PDF生成管理（查询/更新/删除） |
| POST | `/api/decrease-pdf-limit` | JWT(Admin) | ✅ | 100次/5分钟 | 减少PDF积分 |
| POST | `/api/increase-pdf-limit` | JWT(Admin) | ✅ | 100次/5分钟 | 增加PDF积分 |
| POST | `/api/reset-pdf-limit` | JWT(Admin) | ✅ | 100次/5分钟 | 重置PDF积分 |

#### 二维码重定向
| 方法 | 路径 | 认证 | 签名 | 限流 | 说明 |
|------|------|------|------|------|------|
| GET | `/qr/:shortCode` | ❌ | ❌ | 无 | 二维码短码重定向 |

**图例说明**:
- ✅ = 需要 / ❌ = 不需要
- JWT(Admin) = 需要JWT且必须是管理员
- 限流规则中的"次/时间单位"表示该IP或用户在指定时间窗口内最多可请求的次数

---

## 文档版本

- **版本**: 2.0.0
- **更新日期**: 2026-09-23
- **维护者**: 系统开发团队
- **更新内容**: 
  - 新增管理员直接登录用户API（admin-impersonate-login）
  - 新增忘记密码重置API（reset-password）
  - 新增异常登录检测API（get-anomaly-login-detection）
  - 新增留言板完整管理功能API（message-board）
  - PDF生成管理新增删除记录功能
  - 完善数据库表字段注释（添加priority、full_url等字段说明）
  - 补充所有限流规则的详细说明
  - 添加API端点总览表

---

**注意**: 本文档涵盖系统所有API接口的详细说明，包括业务逻辑、数据库操作和安全机制。如有更新，请及时同步文档。
