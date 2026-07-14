# 安全增强快速参考卡

## 🔑 管理员操作

### 请求格式
```javascript
{
  username: "目标用户",
  addLogins: 10,           // 或 increaseAmount/decreaseAmount
  isad: true,              // ⭐ 必须
  adminToken: "JWT_TOKEN"  // ⭐ 必须
}
```

### 获取adminToken
```bash
POST /api/admin-auth
Body: {"username": "admin", "password": "xxx"}
Response: {"token": "eyJhbG..."}
```

---

## 💳 充值卡充值

### 前端加密
```javascript
const SBverify = Buffer.from(cardId, 'utf-8').toString('base64');
```

### 请求格式
```javascript
{
  action: "use",
  username: "目标用户",
  SBverify: "NTUwZTg0MDAt..."  // ⭐ Base64编码的卡ID
}
```

---

## 📝 审计日志查看

```bash
# 实时查看
tail -f backend/logs/info.log | grep "审计日志"

# 最近100条
tail -100 backend/logs/info.log | grep "审计日志"

# 统计数量
grep "审计日志" backend/logs/info.log | wc -l
```

---

## 🧪 测试命令

```bash
# 加密解密测试
cd backend && node test/test-card-encryption.js

# 手动加密测试
node -e "console.log(Buffer.from('test-id', 'utf-8').toString('base64'))"

# 手动解密测试
node -e "console.log(Buffer.from('dGVzdC1pZA==', 'base64').toString('utf-8'))"
```

---

## ⚠️ 常见错误

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| 缺少adminToken | isad=true但未传token | 添加adminToken字段 |
| Token验证失败 | Token过期或无效 | 重新登录获取新Token |
| 缺少SBverify | 充值卡未加密 | 使用Buffer.from()编码 |
| 充值卡不存在 | 卡ID错误或已使用 | 检查卡ID是否正确 |

---

## 🔍 日志关键字

```bash
# 安全警告
grep "安全警告" backend/logs/warn.log

# 管理员操作
grep "管理员.*操作" backend/logs/info.log

# 充值成功
grep "充值成功" backend/logs/info.log

# 验证失败
grep "验证失败" backend/logs/*.log
```

---

## 📊 限制参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 登录次数单次上限 | ±1000 | 防止异常大额调整 |
| PDF积分单次上限 | ±500 | 防止异常大额调整 |
| 登录次数系统上限 | 999999 | 数据库约束 |
| PDF积分系统上限 | 999999 | 数据库约束 |
| 充值卡每日使用 | 10次/用户 | 防滥用限制 |

---

## 🚀 快速部署

```bash
# 1. 重启后端
pm2 restart all

# 2. 查看状态
pm2 status

# 3. 查看日志
pm2 logs --lines 20

# 4. 运行测试
cd backend && node test/test-card-encryption.js
```
