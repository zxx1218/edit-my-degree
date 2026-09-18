# 黑名单用户登录邮件通知IP冷却机制

## 功能说明

当黑名单中的用户尝试登录时，系统会发送告警邮件通知管理员。为了避免同一IP地址在短时间内频繁触发邮件告警，实现了**IP级别的15分钟冷却机制**。

## 实现细节

### 1. 核心组件

#### email-notifier.js
- **ipAlertCache**: 内存中的Map对象，存储 `{ ip: timestamp }` 格式的数据
- **ALERT_COOLDOWN**: 冷却时间常量，设置为15分钟（15 * 60 * 1000毫秒）
- **isIpInCooldown(ipAddress)**: 检查指定IP是否在冷却期内
- **recordIpAlert(ipAddress)**: 记录IP的告警时间戳
- **sendBlacklistUserLoginAlert(params)**: 发送黑名单用户登录告警邮件，内置IP冷却检查

#### auth.js
- 在检测到黑名单用户登录时调用 `sendBlacklistUserLoginAlert()`
- 异步发送邮件，不阻塞登录流程
- 错误处理使用 `.catch()` 避免未捕获的Promise异常

### 2. 工作流程

```
黑名单用户尝试登录
    ↓
检查用户是否在黑名单中
    ↓
获取客户端IP地址
    ↓
检查该IP是否在15分钟冷却期内
    ↓
├─ 是 → 跳过邮件发送，记录日志
└─ 否 → 发送告警邮件
         ↓
      记录IP到冷却缓存
         ↓
      返回403错误给用户
```

### 3. 冷却机制特点

- **基于IP地址**: 每个IP独立计算冷却时间
- **内存缓存**: 使用Map对象存储在内存中，重启后清空
- **自动清理**: 当缓存超过100条记录时，自动清理过期的条目
- **非阻塞**: 邮件发送失败不影响正常的登录拦截逻辑

## 测试方法

### 运行测试脚本

```bash
cd /home/ctkj/edit-my-degree/backend
node test/test-blacklist-login-cooldown.js
```

### 测试场景

1. **第一次尝试**: 应该成功发送邮件
2. **第二次尝试** (2秒后): 在冷却期内，应跳过发送
3. **第三次尝试** (4秒后): 仍在冷却期内，应跳过发送

### 预期结果

```
第1次: ✅ 发送成功
第2次: ✅ 正确跳过
第3次: ✅ 正确跳过

✅ 所有测试通过！IP冷却机制工作正常。
```

## 配置要求

确保 `.env` 文件中已配置以下参数：

```env
ENABLE_ERROR_EMAIL_NOTIFICATION=true
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your_email@163.com
SMTP_PASS=your_authorization_code
ERROR_NOTIFICATION_EMAIL=admin@example.com
APP_NAME=学位管理系统
```

## 监控和调试

### 查看日志

```bash
# 查看应用日志
tail -f backend/logs/application-*.log | grep "邮件通知"

# 查看黑名单用户登录告警
tail -f backend/logs/application-*.log | grep "黑名单用户尝试登录"

# 查看冷却期跳过记录
tail -f backend/logs/application-*.log | grep "在冷却期内"
```

### 日志示例

```
[邮件通知] IP 192.168.1.100 在冷却期内，跳过发送黑名单用户登录告警
[邮件通知] 安全告警邮件发送成功: <message-id>
[认证] 发送黑名单用户登录告警邮件失败: Connection timeout
```

## 注意事项

1. **内存限制**: 冷却缓存存储在内存中，服务重启后会清空
2. **多实例环境**: 如果部署多个后端实例，每个实例有独立的冷却缓存
3. **冷却时间调整**: 如需修改冷却时间，编辑 `email-notifier.js` 中的 `ALERT_COOLDOWN` 常量
4. **邮件频率**: 除了IP冷却机制，还有全局的每小时最多30封邮件的限制

## 相关文件

- `/backend/src/email-notifier.js` - 邮件通知模块（核心实现）
- `/backend/src/auth.js` - 认证模块（调用点）
- `/backend/test/test-blacklist-login-cooldown.js` - 测试脚本
- `/backend/test/README_BLACKLIST_LOGIN_COOLDOWN.md` - 本文档

## 版本历史

- **v1.0** (2026-09-18): 初始实现，添加IP级别的15分钟冷却机制
