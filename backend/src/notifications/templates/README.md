# Bark 通知模板管理

本目录集中管理所有Bark通知的消息模板，遵循软件工程规范，将消息内容与业务逻辑分离。

## 📁 目录结构

```
templates/
├── index.js                      # 统一导出所有模板
├── system-notifications.js       # 系统级通知（启动、关闭等）
├── recharge-notifications.js     # 充值相关通知
├── security-notifications.js     # 安全告警通知
└── user-notifications.js         # 用户相关通知
```

## 📋 文件说明

### 1. system-notifications.js
系统生命周期相关的通知：
- `getStartupNotification()` - 服务启动成功
- `getShutdownNotification()` - 服务关闭
- `getDatabaseErrorNotification()` - 数据库连接异常

### 2. recharge-notifications.js
充值业务相关的通知：
- `getLoginRechargeNotification()` - 登录次数充值成功
- `getPdfRechargeNotification()` - PDF积分充值成功
- `getRechargeNotification()` - 通用充值通知（根据类型自动选择）

### 3. security-notifications.js
安全相关的告警通知：
- `getIpBlacklistBlockNotification()` - IP黑名单拦截
- `getUserBlacklistBlockNotification()` - 用户黑名单拦截
- `getSuspiciousLoginNotification()` - 异常登录行为
- `getFailedLoginNotification()` - 多次登录失败
- `getIpRateLimitBlockNotification()` - IP频率限制封禁
- `getFrequentPasswordChangeNotification()` - 频繁密码修改尝试

### 4. user-notifications.js
用户行为相关的通知：
- `getNewUserRegistrationNotification()` - 新用户注册
- `getNewMessageNotification()` - 新留言
- `getPasswordChangeNotification()` - 密码修改

## 💡 使用示例

### 基本用法

```javascript
const { getStartupNotification } = require('../notifications/templates');
const barkNotifier = require('./bark-notifier');

// 获取通知模板
const notification = getStartupNotification({
  hostname: require('os').hostname(),
  port: 3001,
  env: process.env.NODE_ENV || 'development',
  startTime: new Date().toLocaleString('zh-CN')
});

// 发送通知
await barkNotifier.sendNotification(notification);
```

### 充值通知示例

```javascript
const { getRechargeNotification } = require('../notifications/templates');

// 自动根据类型选择模板
const notification = getRechargeNotification({
  username: '张三',
  cardType: 'login',           // 或 'pdf'
  cardValues: 10,
  remainingLogins: 50,
  remainingPdfLimit: 100,
  timestamp: new Date().toLocaleString('zh-CN')
});

await barkNotifier.sendNotification(notification);
```

### 安全告警示例

```javascript
const { getIpBlacklistBlockNotification } = require('../notifications/templates');

const notification = getIpBlacklistBlockNotification({
  ip: '192.168.1.100',
  username: 'test_user',
  action: '登录',
  timestamp: new Date().toLocaleString('zh-CN')
});

await barkNotifier.sendNotification(notification);
```

## 🎯 设计规范

### 1. 函数命名
- 使用 `get` + 名词 + `Notification` 格式
- 例如：`getStartupNotification`, `getRechargeNotification`

### 2. 参数设计
- 所有动态内容通过参数传入
- 提供完整的JSDoc注释说明每个参数
- 可选参数使用 `[parameter]` 标记

### 3. 返回值格式
```javascript
{
  title: string,      // 通知标题（必需）
  body: string,       // 通知正文（必需）
  subtitle?: string,  // 副标题（可选）
  group: string,      // 消息分组（必需）
  level?: string,     // 推送级别（可选）
  sound?: string      // 铃声（可选）
}
```

### 4. 消息分组规范
- **系统消息**: `'系统消息'` - 服务启停、系统异常
- **学位管理系统充值通知**: `'学位管理系统充值通知'` - 各类充值
- **安全告警**: `'安全告警'` - 黑名单拦截、异常行为
- **用户通知**: `'用户通知'` - 注册、留言等用户行为

### 5. 推送级别
- `critical` - 紧急告警（数据库异常、安全威胁）
- `active` - 重要通知（充值成功、异常登录）
- `passive` - 普通通知（新用户注册、新留言）
- `timeSensitive` - 时效性通知

## ✨ 优势

1. **集中管理** - 所有消息模板在一处维护，便于查找和修改
2. **职责分离** - 消息格式化与业务逻辑完全分离
3. **易于测试** - 纯函数设计，无需依赖即可单元测试
4. **类型安全** - 统一的返回格式，减少运行时错误
5. **可维护性** - 修改文案无需在多个文件中搜索
6. **国际化准备** - 为未来多语言支持奠定基础
7. **可扩展性** - 新增通知类型只需添加新函数

## 🔧 添加新通知模板

1. 确定通知类别（系统/充值/安全/用户）
2. 在对应的文件中添加新函数
3. 编写完整的JSDoc注释
4. 在 `index.js` 中确保已导出（使用展开运算符自动导出）
5. 更新本文档的使用示例

## ⚠️ 注意事项

- ❌ **禁止**在模板中包含业务逻辑
- ❌ **禁止**在模板中硬编码配置值
- ✅ **必须**提供完整的JSDoc注释
- ✅ **必须**使用参数化设计
- ✅ **必须**遵循统一的返回值格式
- ✅ **建议**为复杂模板添加使用示例

## 📝 最佳实践

### 好的做法
```javascript
// ✅ 参数化设计，清晰明了
function getStartupNotification({ hostname, port, env, startTime }) {
  return {
    title: '🚀 后端服务启动成功',
    body: `主机: ${hostname}\n端口: ${port}\n环境: ${env}\n启动时间: ${startTime}`,
    // ...
  };
}
```

### 不好的做法
```javascript
// ❌ 硬编码值，难以维护
function getStartupNotification() {
  return {
    title: '服务启动',
    body: '服务器已经在 localhost:3001 启动',  // 硬编码！
    // ...
  };
}
```

## 🔄 迁移指南

如果现有代码中直接构建了通知对象，应该迁移到使用模板：

**之前：**
```javascript
// 在 server.js 中
await barkNotifier.sendNotification({
  title: '🚀 后端服务启动成功',
  body: `主机: ${hostname}\n端口: ${PORT}...`,
  subtitle: '系统消息',
  group: '系统消息',
  // ...
});
```

**之后：**
```javascript
// 在 server.js 中
const { getStartupNotification } = require('./notifications/templates');

const notification = getStartupNotification({
  hostname,
  port: PORT,
  env: process.env.NODE_ENV,
  startTime: new Date().toLocaleString('zh-CN')
});

await barkNotifier.sendNotification(notification);
```

## 📧 邮件通知使用范围

**重要说明**：邮件通知仅用于充值接口的恶意调用告警（高优先级安全事件），其余所有通知均使用Bark推送。

### 邮件通知场景
- ✅ 充值接口非法调用（未授权访问、权限不足等）

### Bark通知场景
- ✅ IP/用户黑名单拦截
- ✅ IP频率限制封禁
- ✅ 频繁密码修改尝试
- ✅ 服务启停/异常
- ✅ 充值成功
- ✅ 用户注册/留言

---

**最后更新**: 2026-09-24  
**维护者**: 开发团队
