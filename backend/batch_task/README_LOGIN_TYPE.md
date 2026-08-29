# 登录类型字段迁移说明

## 概述

本次更新为 `login_logs` 表添加了 `login_type` 字段，用于区分不同类型的登录：

- **normal**: 普通用户通过网页端登录（消耗登录次数）
- **admin_impersonate**: 管理员代用户登录（不消耗登录次数）

## 数据库迁移

### 执行迁移脚本

```bash
cd /home/ctkj/edit-my-degree/backend
node batch_task/addLoginTypeField.js
```

### 迁移内容

1. 在 `login_logs` 表中添加 `login_type` 字段
2. 字段类型：`VARCHAR(20)`
3. 默认值：`'normal'`
4. 位置：在 `ip_location` 字段之后
5. 自动更新所有现有记录的 `login_type` 为 `'normal'`

## 代码变更

### 后端变更

1. **auth.js** - 普通用户登录
   - 在插入登录日志时添加 `login_type = 'normal'`

2. **admin-impersonate-login.js** - 管理员代登录
   - 在插入登录日志时添加 `login_type = 'admin_impersonate'`

3. **get-today-login-details.js** - 今日登录详情接口
   - 查询时包含 `login_type` 字段
   - 返回数据中包含每个登录时间的类型信息

### 前端变更

**TodayLoginList.tsx** - 今日登录情况组件
- 添加登录类型图标显示：
  - 🖥️ Monitor 图标：普通用户登录
  - 👤 User 图标：管理员代登录
- 管理员代登录会显示红色标签 "管理员代登"
- 普通登录显示蓝色背景

## 功能效果

在管理端的"今日登录情况"模块中，每次登录都会显示：

1. **普通用户登录**（蓝色背景 + Monitor图标）
   ```
   🖥️ 14:30:25
   ```

2. **管理员代登录**（红色背景 + User图标 + 标签）
   ```
   👤 15:45:10 [管理员代登]
   ```

## 验证迁移

执行迁移后，可以通过以下SQL验证：

```sql
-- 查看字段是否添加成功
DESCRIBE login_logs;

-- 查看不同登录类型的统计
SELECT login_type, COUNT(*) as count 
FROM login_logs 
GROUP BY login_type;

-- 查看今天的登录记录及类型
SELECT username, login_time, login_type 
FROM login_logs 
WHERE DATE(login_time) = CURDATE()
ORDER BY login_time DESC;
```

## 注意事项

1. 迁移脚本是幂等的，可以多次执行
2. 如果字段已存在，脚本会自动跳过
3. 建议在执行迁移前备份数据库
4. 迁移不会影响现有功能，只是增强数据显示

## 回滚方案

如果需要回滚（删除login_type字段）：

```sql
ALTER TABLE login_logs DROP COLUMN login_type;
```

注意：回滚会导致登录类型信息丢失。
