# 安全增强实施检查清单

## ✅ 已完成的工作

### 1. 后端模块修改

#### 1.1 新增邮件通知模块
- [x] `backend/src/email-notifier.js` - 创建完成
  - sendSecurityAlert() 函数
  - sendIllegalApiCallAlert() 函数
  - 频率限制机制（每小时30封）
  - HTML邮件模板

#### 1.2 充值卡管理接口增强
- [x] `backend/src/manage-cards.js` - 修改完成
  - 强制要求SBverify字段
  - 自动解密并验证卡片
  - 审计日志改为safe级别
  - 5种非法调用场景触发邮件告警

#### 1.3 管理员操作接口增强
- [x] `backend/src/update-user-logins.js` - 修改完成
  - 支持isad和adminToken验证
  - 审计日志改为safe级别
  
- [x] `backend/src/increase-pdf-limit.js` - 修改完成
  - 支持isad和adminToken验证
  - 审计日志改为safe级别
  
- [x] `backend/src/decrease-pdf-limit.js` - 修改完成
  - 支持isad和adminToken验证
  - 审计日志改为safe级别
  
- [x] `backend/src/decrease-user-logins.js` - 修改完成
  - 支持isad和adminToken验证
  - 审计日志改为safe级别
  - 单次操作上限验证（1000次）

### 2. 前端API修改

#### 2.1 adminApi.ts 全面更新
- [x] `src/lib/adminApi.ts` - 修改完成
  - updateUserLogins() - 添加isad和adminToken
  - decreaseUserLogins() - 添加isad和adminToken
  - increasePdfLimit() - 添加isad和adminToken
  - decreasePdfLimit() - 添加isad和adminToken
  - encryptCardId() - 新增加密函数
  - useRechargeCard() - 新增充值函数

### 3. 配置文件和文档

- [x] `backend/.env.example` - 配置模板
- [x] `backend/UPDATE_NOTES_v2.0.md` - 更新说明
- [x] `backend/test/test-email-notification.js` - 邮件测试脚本

---

## 📋 部署前检查清单

### 第一步：配置文件准备

**⚠️ 重要提示：**
- **所有配置信息统一在项目根目录的 `.env` 文件中管理**
- **不要在 `backend/` 目录下创建单独的 `.env` 文件**
- 后端通过 `require('dotenv').config({ path: '../.env' })` 加载根目录配置

```bash
# 1. 编辑根目录的.env文件
cd /home/ctkj/edit-my-degree
nano .env

# 2. 确认邮件配置已存在（已在根目录.env中配置）
grep "SMTP_" .env
grep "ENABLE_ERROR_EMAIL" .env
```

**必须配置的关键项（在根目录.env文件中）：**
```bash
# JWT密钥（必须与现有配置一致）
JWT_SECRET=your_existing_jwt_secret

# SMTP配置（用于邮件告警）
ENABLE_ERROR_EMAIL_NOTIFICATION=true
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your_email@163.com
SMTP_PASS=your_authorization_code  # 注意：是授权码，不是密码
ERROR_NOTIFICATION_EMAIL=zxx12182022@163.com

# API密钥（必须与现有配置一致）
API_SECRET_KEY=your_existing_api_secret
VALID_APP_KEYS=key1,key2,key3
```

### 第二步：重启后端服务

```bash
# 1. 重启所有PM2进程
pm2 restart all

# 2. 查看服务状态
pm2 status

# 3. 查看启动日志
pm2 logs --lines 50

# 4. 确认无错误
pm2 logs | grep -i error
```

### 第三步：重新构建前端

```bash
cd /home/ctkj/edit-my-degree

# 1. 清理旧构建
rm -rf dist

# 2. 重新构建
npm run build

# 3. 重启前端服务（根据实际部署方式）
# 如果使用PM2:
pm2 restart frontend

# 如果使用Nginx:
sudo systemctl reload nginx
```

### 第四步：功能测试

#### 4.1 测试邮件发送
```bash
cd /home/ctkj/edit-my-degree/backend
node test/test-email-notification.js
```

**预期结果：**
- 控制台显示"✅ 发送成功"
- 邮箱收到2封测试邮件
- safe日志文件中有发送记录

#### 4.2 测试管理员操作
使用管理员账号登录SuperAdd页面，尝试：
- [ ] 增加用户登录次数
- [ ] 减少用户登录次数
- [ ] 增加PDF积分
- [ ] 减少PDF积分

**验证点：**
- 操作成功返回
- safe日志中有审计记录
- 数据库值正确更新

#### 4.3 测试充值卡充值
在前端或Postman中测试：
```javascript
// 生成SBverify
const cardId = '550e8400-e29b-41d4-a716-446655440000';
const SBverify = btoa(unescape(encodeURIComponent(cardId)));
console.log('SBverify:', SBverify);

// 调用充值接口
{
  "action": "use",
  "username": "testuser",
  "SBverify": "NTUwZTg0MDAt..."
}
```

**验证点：**
- 充值成功
- 卡片标记为已使用
- safe日志中有审计记录

#### 4.4 测试非法调用告警
故意发送错误请求：
```bash
# 缺少SBverify
curl -X POST http://localhost:3001/api/manage-cards \
  -H "Content-Type: application/json" \
  -d '{"action":"use","username":"test"}'

# 无效的SBverify
curl -X POST http://localhost:3001/api/manage-cards \
  -H "Content-Type: application/json" \
  -d '{"action":"use","username":"test","SBverify":"invalid"}'
```

**预期结果：**
- 返回400错误
- warn日志中有安全警告
- 收到邮件告警（如果启用）

### 第五步：日志验证

```bash
# 1. 查看safe级别审计日志
tail -f backend/logs/application-*.safe | grep "审计日志"

# 2. 查看邮件发送日志
tail -f backend/logs/application-*.safe | grep "邮件通知"

# 3. 查看安全警告
tail -f backend/logs/application-*.warn | grep "安全警告"

# 4. 确认日志格式正确
cat backend/logs/application-*.safe | head -20
```

**safe日志应包含：**
- `[审计日志]` 前缀
- 操作类型、操作者、目标用户
- 变更前后的值
- IP地址和User-Agent
- 时间戳

---

## ⚠️ 常见问题排查

### 问题1：邮件发送失败

**症状：**
- 测试脚本返回"❌ 发送失败"
- safe日志中有"邮件发送失败"记录

**排查步骤：**
```bash
# 1. 检查.env配置
grep SMTP_ backend/.env

# 2. 测试SMTP连接
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
transporter.verify((err, success) => {
  console.log(err ? '失败: ' + err.message : '成功');
});
"

# 3. 检查邮箱授权码
# 登录邮箱网页版 → 设置 → POP3/IMAP/SMTP → 查看授权码
```

**解决方案：**
- 确保使用授权码而非登录密码
- 确认SMTP端口正确（465为SSL，587为TLS）
- 检查防火墙是否阻止SMTP连接

### 问题2：管理员操作返回401

**症状：**
- 前端调用返回"认证令牌无效或已过期"

**排查步骤：**
```bash
# 1. 检查JWT_SECRET是否一致
grep JWT_SECRET backend/.env

# 2. 解码token查看内容
node -e "
const jwt = require('jsonwebtoken');
const token = 'your_token_here';
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log(decoded);
} catch (err) {
  console.error('验证失败:', err.message);
}
"

# 3. 检查token是否过期
# JWT_EXPIRES_IN默认24h，SUPERADD_JWT_EXPIRES_IN默认30d
```

### 问题3：充值卡验证失败

**症状：**
- 返回"充值卡验证失败，请检查充值卡是否正确"

**排查步骤：**
```bash
# 1. 测试Base64编解码
node -e "
const cardId = '550e8400-e29b-41d4-a716-446655440000';
const encoded = Buffer.from(cardId, 'utf-8').toString('base64');
const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
console.log('原始:', cardId);
console.log('编码:', encoded);
console.log('解码:', decoded);
console.log('一致:', cardId === decoded);
"

# 2. 检查数据库中卡片是否存在
mysql -u root -p degree_management -e "SELECT * FROM cards WHERE id='550e8400-e29b-41d4-a716-446655440000';"
```

### 问题4：safe日志未生成

**症状：**
- logs目录中没有.safe文件

**排查步骤：**
```bash
# 1. 检查logger.js配置
grep "safe" backend/src/logger.js

# 2. 确认使用的是console.safe()
grep "console.safe" backend/src/*.js

# 3. 检查logs目录权限
ls -la backend/logs/

# 4. 手动创建测试日志
node -e "console.safe('测试safe日志');"
```

---

## 🎯 验收标准

### 功能验收
- [ ] 管理员可以正常操作用户资源
- [ ] 充值卡可以正常充值
- [ ] 非法调用能触发邮件告警
- [ ] 审计日志完整记录所有操作

### 安全验收
- [ ] 管理员操作需要isad和adminToken
- [ ] 充值卡ID通过SBverify加密传输
- [ ] 单次操作有数值上限
- [ ] 所有敏感操作都有审计日志

### 性能验收
- [ ] API响应时间无明显增加（<10ms额外开销）
- [ ] 邮件发送不阻塞主流程
- [ ] safe日志异步写入不影响性能

### 日志验收
- [ ] safe日志文件格式正确
- [ ] 包含完整的操作上下文
- [ ] 3天后自动清理
- [ ] 可以通过grep快速检索

---

## 📞 紧急回滚方案

如果部署后出现严重问题，可以快速回滚：

```bash
# 1. 停止当前服务
pm2 stop all

# 2. 恢复代码（如果有git）
cd /home/ctkj/edit-my-degree
git stash  # 或 git checkout <previous_commit>

# 3. 重新启动
pm2 start all

# 4. 或者只禁用邮件通知
# 在.env中设置
ENABLE_ERROR_EMAIL_NOTIFICATION=false
# 然后重启
pm2 restart all
```

---

## ✨ 后续优化建议

### 短期（1周内）
- [ ] 完善前端UI，展示充值卡加密过程
- [ ] 添加管理员操作二次确认
- [ ] 实现审计日志查询界面

### 中期（1个月内）
- [ ] 集成实时告警系统（钉钉/企业微信）
- [ ] 实现操作审批流程
- [ ] 添加异常行为自动封禁

### 长期（3个月内）
- [ ] 实现细粒度权限控制（RBAC）
- [ ] 定期进行安全渗透测试
- [ ] 建立完整的安全审计体系

---

**检查清单版本：** v1.0  
**最后更新：** 2024-01-15  
**负责人：** 开发团队
