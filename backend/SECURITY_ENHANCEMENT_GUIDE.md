# 用户资源变更接口安全增强使用说明

## 📋 概述

本次更新为用户资源变更接口（登录次数、PDF积分）添加了双重身份验证机制：
1. **管理员操作**：需要传递 `isad=true` 和 `adminToken`
2. **充值卡充值**：需要传递 `SBverify` 字段（充值卡ID的Base64编码）

---

## 🔐 一、管理员操作接口

### 1.1 接口列表

- `POST /api/update-user-logins` - 调整用户登录次数
- `POST /api/increase-pdf-limit` - 增加用户PDF积分
- `POST /api/decrease-pdf-limit` - 减少用户PDF积分

### 1.2 请求格式

```javascript
// 管理员操作示例
const response = await fetch('/api/update-user-logins', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <普通用户JWT Token>', // 可选，用于基础认证
    'X-Timestamp': Date.now().toString(),
    'X-Signature': '<签名>',
    'X-App-Key': '<应用密钥>'
  },
  body: JSON.stringify({
    username: '张三',           // 目标用户名
    addLogins: 10,              // 调整数量（可正可负）
    isad: true,                 // 标识为管理员操作
    adminToken: '<管理员JWT Token>'  // 必须：管理员专用Token
  })
});
```

### 1.3 管理员Token获取

管理员需要先通过管理员登录接口获取Token：

```javascript
// 管理员登录
const loginResponse = await fetch('/api/admin-auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin_password'
  })
});

const { token } = await loginResponse.json();
// token即为adminToken，有效期由SUPERADD_JWT_EXPIRES_IN配置决定
```

### 1.4 响应示例

**成功响应：**
```json
{
  "success": true,
  "newLogins": 110,
  "oldLogins": 100,
  "added": 10
}
```

**失败响应：**
```json
{
  "success": false,
  "error": "管理员身份验证失败: 管理员Token已过期"
}
```

---

## 💳 二、充值卡充值接口

### 2.1 接口路径

`POST /api/manage-cards`

### 2.2 请求格式

```javascript
// 充值卡充值示例
const cardId = '550e8400-e29b-41d4-a716-446655440000'; // 真实充值卡ID

// 前端加密充值卡ID
const SBverify = Buffer.from(cardId, 'utf-8').toString('base64');

const response = await fetch('/api/manage-cards', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Timestamp': Date.now().toString(),
    'X-Signature': '<签名>',
    'X-App-Key': '<应用密钥>'
  },
  body: JSON.stringify({
    action: 'use',              // 操作类型：使用充值卡
    username: '张三',           // 充值目标用户
    SBverify: SBverify          // 必须：加密后的充值卡ID
  })
});
```

### 2.3 前端加密工具函数

```typescript
// src/lib/crypto.ts
export function encryptCardId(cardId: string): string {
  return Buffer.from(cardId, 'utf-8').toString('base64');
}

// 使用示例
const encryptedCardId = encryptCardId('550e8400-e29b-41d4-a716-446655440000');
console.log(encryptedCardId); // "NTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAw"
```

### 2.4 响应示例

**成功响应：**
```json
{
  "success": true,
  "message": "充值成功，用户 张三 当前登录次数剩余 110 次",
  "card": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "login",
    "values": 10
  },
  "user": {
    "remaining_logins": 110,
    "pdf_limit": 50,
    "is_trial_user": 0
  },
  "isPermanentCard": false
}
```

**失败响应：**
```json
{
  "success": false,
  "error": "充值卡不存在或已失效"
}
```

---

## 📝 三、审计日志说明

所有资源变更操作都会在 `info` 级别的日志文件中记录详细审计信息，格式如下：

### 3.1 管理员操作日志

```
[审计日志] 管理员调整登录次数 - 
  操作类型: 管理员直接操作,
  操作者: admin(ID:1),
  目标用户: 张三(ID:5),
  资源类型: 登录次数,
  变更前值: 100,
  变更量: 10,
  变更后值: 110,
  PDF积分: 50,
  IP地址: 192.168.1.100,
  User-Agent: Mozilla/5.0...,
  时间戳: 2024-01-15T10:30:00.000Z
```

### 3.2 充值卡充值日志

```
[审计日志] 充值卡充值成功 - 
  操作类型: 自助充值,
  充值卡ID: 550e8400-e29b-41d4-a716-446655440000,
  充值卡类型: login,
  充值面值: 10,
  目标用户: 张三(ID:5),
  登录次数: 100 → 110,
  PDF积分: 50 → 50,
  IP地址: 192.168.1.100,
  User-Agent: Mozilla/5.0...,
  时间戳: 2024-01-15T10:30:00.000Z
```

---

## 🔍 四、测试方法

### 4.1 运行加密测试脚本

```bash
cd /home/ctkj/edit-my-degree/backend
node test/test-card-encryption.js
```

输出示例：
```
=== 充值卡加密解密测试 ===

1. 原始充值卡ID: 550e8400-e29b-41d4-a716-446655440000
2. 加密后的SBverify值: NTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAw
3. 解密后的充值卡ID: 550e8400-e29b-41d4-a716-446655440000
4. 验证结果: ✅ 成功

=== 管理员Token验证测试 ===

1. 生成的管理员Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
2. Token验证结果: ✅ 成功
   - 用户名: admin
   - 是否为管理员: true

3. 测试普通用户Token验证:
   验证结果: ✅ 正确拒绝 - 该Token不属于管理员账户

=== 测试完成 ===
```

### 4.2 查看审计日志

```bash
# 查看最新的审计日志
tail -f /home/ctkj/edit-my-degree/backend/logs/info.log | grep "审计日志"
```

---

## ⚠️ 五、安全注意事项

### 5.1 管理员操作
- ✅ 必须使用 `isad: true` 标识管理员操作
- ✅ 必须提供有效的 `adminToken`
- ✅ adminToken 应从管理员登录接口获取
- ❌ 禁止将 adminToken 暴露给前端代码
- ❌ 禁止在客户端存储管理员Token

### 5.2 充值卡充值
- ✅ 必须对充值卡ID进行Base64编码后传递
- ✅ 后端会自动解密并验证卡片有效性
- ❌ 禁止直接传递明文充值卡ID
- ❌ 禁止尝试重用已使用的充值卡

### 5.3 通用安全建议
- 所有敏感操作都应通过HTTPS传输
- 定期轮换JWT_SECRET密钥
- 监控审计日志中的异常行为
- 限制管理员账号的访问IP范围

---

## 🛠️ 六、常见问题

### Q1: 为什么充值卡要加密传输？
A: 防止充值卡ID在网络传输中被截获，避免恶意用户直接使用卡ID进行充值。

### Q2: Base64加密安全吗？
A: Base64是编码而非加密，主要目的是防止明文暴露。真正的安全性来自于：
- 充值卡一次性使用机制
- 后端严格的验证逻辑
- HTTPS传输加密
- 审计日志追踪

### Q3: 管理员Token和普通Token有什么区别？
A: 
- 管理员Token包含 `is_admin: true` 标识
- 有效期更长（默认30天 vs 1天）
- 可用于执行管理操作
- 需要通过 `/api/admin-auth` 接口获取

### Q4: 如果忘记传递 isad 或 adminToken 会怎样？
A: 系统会返回401错误，提示需要提供有效的认证信息。

---

## 📞 七、技术支持

如有问题，请查看：
1. 后端日志文件：`backend/logs/info.log`
2. 错误日志：`backend/logs/error.log`
3. 测试脚本：`backend/test/test-card-encryption.js`
