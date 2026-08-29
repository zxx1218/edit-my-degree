# 登录类型标识功能说明

## 功能概述

为管理端页面的"今日登录情况"模块添加了登录类型标识，可以清晰区分：
- **普通用户登录**（网页端登录，消耗登录次数）
- **管理员代登录**（管理员代为登录，不消耗登录次数）

## 实现方案

### 1. 数据库层面

在 `login_logs` 表中添加 `login_type` 字段：

```sql
ALTER TABLE login_logs 
ADD COLUMN login_type VARCHAR(20) DEFAULT 'normal' 
COMMENT '登录类型：normal-普通用户登录, admin_impersonate-管理员代登录'
AFTER ip_location;
```

**字段说明：**
- `normal`: 普通用户通过用户名密码登录（消耗积分）
- `admin_impersonate`: 管理员代用户登录（不消耗积分）

### 2. 后端接口修改

#### 2.1 普通用户登录 (auth.js)

```javascript
await dbManager.execute(
  'INSERT INTO login_logs (user_id, username, login_ip, ip_location, login_type) VALUES (?, ?, ?, ?, ?)',
  [user.id, username, ipAddress, ipLocation, 'normal']
);
```

#### 2.2 管理员代登录 (admin-impersonate-login.js)

```javascript
await db.execute(
  'INSERT INTO login_logs (user_id, username, login_ip, ip_location, login_type) VALUES (?, ?, ?, ?, ?)',
  [targetUser.id, username, ipAddress, ipLocation, 'admin_impersonate']
);
```

#### 2.3 今日登录详情接口 (get-today-login-details.js)

修改查询语句，包含 `login_type` 字段：

```javascript
const [loginDetails] = await db.execute(`
  SELECT 
    u.username,
    l.login_time,
    l.login_type
  FROM login_logs l
  JOIN users u ON l.user_id = u.id
  WHERE DATE(l.login_time) = ?
  ORDER BY l.login_time DESC
`, [todayStr]);
```

返回数据结构：

```json
{
  "success": true,
  "loginDetails": [
    {
      "username": "testuser",
      "loginCount": 3,
      "loginTimes": [
        { "time": "14:30:25", "type": "normal" },
        { "time": "15:45:10", "type": "admin_impersonate" },
        { "time": "16:20:33", "type": "normal" }
      ]
    }
  ]
}
```

### 3. 前端界面修改

#### 3.1 TypeScript 接口定义

```typescript
interface LoginTime {
  time: string;
  type: 'normal' | 'admin_impersonate';
}

interface LoginDetail {
  username: string;
  loginCount: number;
  loginTimes: LoginTime[];
}
```

#### 3.2 UI 显示效果

**普通用户登录：**
- 🔵 蓝色背景
- 🖥️ Monitor 图标
- 显示时间

**管理员代登录：**
- 🔴 红色背景
- 👤 User 图标
- 显示时间 + "管理员代登" 标签

## 使用方式

### 1. 执行数据库迁移

```bash
cd /home/ctkj/edit-my-degree/backend
node batch_task/addLoginTypeField.js
```

### 2. 重启后端服务

```bash
pm2 restart backend
```

### 3. 查看效果

1. 登录管理端页面
2. 滚动到"今日登录情况"模块
3. 每次登录都会显示对应的类型标识

## 测试验证

### 方法1: 手动测试

1. **普通用户登录测试：**
   - 使用普通用户账号登录
   - 在管理端查看"今日登录情况"
   - 应该显示蓝色背景的普通登录标识

2. **管理员代登录测试：**
   - 在管理端用户列表中使用"代登录"功能
   - 查看"今日登录情况"
   - 应该显示红色背景的管理员代登标识

### 方法2: 自动化测试

```bash
cd /home/ctkj/edit-my-degree/backend
node test/test-login-type.js
```

### 方法3: SQL 验证

```sql
-- 查看今天的登录记录及类型
SELECT 
  u.username,
  l.login_time,
  l.login_type,
  CASE l.login_type
    WHEN 'normal' THEN '普通登录'
    WHEN 'admin_impersonate' THEN '管理员代登'
    ELSE '未知'
  END as login_type_cn
FROM login_logs l
JOIN users u ON l.user_id = u.id
WHERE DATE(l.login_time) = CURDATE()
ORDER BY l.login_time DESC;

-- 统计今日各类型登录次数
SELECT 
  login_type,
  COUNT(*) as count,
  CASE login_type
    WHEN 'normal' THEN '普通登录'
    WHEN 'admin_impersonate' THEN '管理员代登'
  END as login_type_cn
FROM login_logs
WHERE DATE(login_time) = CURDATE()
GROUP BY login_type;
```

## 业务价值

1. **审计追踪**：清晰记录每次登录的来源，便于安全审计
2. **数据分析**：可以统计分析管理员代登录的频率和模式
3. **异常检测**：如果发现大量管理员代登录，可能表示存在问题
4. **用户体验**：管理员可以清楚看到哪些是自己操作的登录

## 注意事项

1. **向后兼容**：现有记录的 `login_type` 会自动设置为 `normal`
2. **性能影响**：仅增加一个VARCHAR字段，对性能影响极小
3. **数据安全**：不影响现有的认证和授权机制
4. **日志完整性**：所有新登录都会正确记录类型

## 扩展建议

未来可以考虑添加更多登录类型：

- `api`: API调用登录
- `mobile`: 移动端登录
- `oauth`: OAuth第三方登录
- `sso`: 单点登录

只需在数据库中插入时使用对应的类型值即可。
