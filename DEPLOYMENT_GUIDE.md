# 登录类型标识功能 - 快速部署指南

## 📋 部署步骤

### 1️⃣ 执行数据库迁移

```bash
cd /home/ctkj/edit-my-degree/backend
node batch_task/addLoginTypeField.js
```

**预期输出：**
```
开始执行数据库迁移：添加login_type字段...
正在添加login_type字段...
✓ 成功添加login_type字段
正在更新现有记录的login_type字段...
✓ 更新了 XXX 条记录的login_type字段

迁移完成！
login_type字段说明：
  - normal: 普通用户通过网页端登录
  - admin_impersonate: 管理员代用户登录（不消耗积分）
```

### 2️⃣ 重启后端服务

```bash
# 如果使用PM2
pm2 restart backend

# 或者直接重启Node进程
pm2 restart all
```

### 3️⃣ 重新构建前端（如果需要）

```bash
cd /home/ctkj/edit-my-degree
npm run build
```

### 4️⃣ 验证功能

#### 方法A：查看数据库
```sql
-- 检查字段是否添加成功
DESCRIBE login_logs;

-- 应该看到 login_type 字段
```

#### 方法B：测试登录
1. 使用普通用户账号登录一次
2. 使用管理员代登录功能登录一次
3. 在管理端查看"今日登录情况"模块

#### 方法C：运行测试脚本
```bash
cd /home/ctkj/edit-my-degree/backend
node test/test-login-type.js
```

## ✅ 验证清单

- [ ] 数据库迁移脚本执行成功
- [ ] `login_logs` 表中存在 `login_type` 字段
- [ ] 后端服务已重启
- [ ] 前端可以正常访问
- [ ] 普通用户登录显示蓝色标识
- [ ] 管理员代登录显示红色标识和标签

## 🔍 故障排查

### 问题1：迁移脚本报错 "Table doesn't exist"

**解决方案：**
```sql
-- 检查表是否存在
SHOW TABLES LIKE 'login_logs';

-- 如果不存在，需要创建表
CREATE TABLE login_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  username VARCHAR(100) NOT NULL,
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  login_ip VARCHAR(45),
  ip_location VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 问题2：字段已存在错误

**解决方案：**
迁移脚本已经处理了这种情况，会跳过。如果手动执行SQL报错，可以忽略。

### 问题3：前端显示异常

**解决方案：**
```bash
# 清除浏览器缓存
# 或者强制刷新：Ctrl + F5 (Windows) / Cmd + Shift + R (Mac)

# 重新构建前端
cd /home/ctkj/edit-my-degree
npm run build
```

### 问题4：登录类型没有显示

**检查步骤：**
1. 确认数据库字段已添加：`DESCRIBE login_logs;`
2. 确认有新的登录记录：`SELECT * FROM login_logs ORDER BY login_time DESC LIMIT 5;`
3. 检查浏览器控制台是否有错误
4. 检查API响应是否包含type字段

## 📊 监控建议

### 1. 登录类型统计

```sql
-- 今日登录类型分布
SELECT 
  login_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM login_logs WHERE DATE(login_time) = CURDATE()), 2) as percentage
FROM login_logs
WHERE DATE(login_time) = CURDATE()
GROUP BY login_type;
```

### 2. 异常检测

```sql
-- 检测管理员代登录频率异常
SELECT 
  u.username,
  COUNT(*) as impersonate_count
FROM login_logs l
JOIN users u ON l.user_id = u.id
WHERE l.login_type = 'admin_impersonate'
  AND DATE(l.login_time) = CURDATE()
GROUP BY u.username
HAVING impersonate_count > 10
ORDER BY impersonate_count DESC;
```

## 🎯 回滚方案

如果需要回滚此功能：

### 1. 删除数据库字段
```sql
ALTER TABLE login_logs DROP COLUMN login_type;
```

### 2. 恢复代码版本
```bash
# 如果有git
git checkout HEAD~1 -- backend/src/get-today-login-details.js
git checkout HEAD~1 -- backend/src/auth.js
git checkout HEAD~1 -- backend/src/admin-impersonate-login.js
git checkout HEAD~1 -- src/components/admin/TodayLoginList.tsx
```

### 3. 重启服务
```bash
pm2 restart backend
```

## 📝 注意事项

1. **数据备份**：建议在迁移前备份数据库
   ```bash
   mysqldump -u root -p your_database > backup_$(date +%Y%m%d).sql
   ```

2. **停机时间**：迁移过程很快（通常<1秒），几乎无感知

3. **兼容性**：旧数据会自动设置为 'normal' 类型

4. **性能影响**：新增VARCHAR字段对性能影响极小

## 🚀 后续优化建议

1. 添加登录类型的筛选功能
2. 在登录统计图表中区分显示不同类型
3. 添加管理员代登录的操作日志
4. 实现登录类型的导出功能

---

**部署完成后，请删除此文档或移动到docs目录**
