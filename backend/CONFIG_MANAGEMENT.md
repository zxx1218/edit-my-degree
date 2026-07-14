# 配置文件管理规范

## 📋 配置统一管理原则

### ⚠️ 重要规则

**所有环境配置信息统一在项目根目录的 `.env` 文件中管理，禁止在 `backend/` 目录下创建单独的 `.env` 文件。**

---

## 🗂️ 配置文件结构

```
/home/ctkj/edit-my-degree/
├── .env                    # ✅ 唯一的环境配置文件（根目录）
├── .env.example            # 配置模板（可选）
├── .gitignore              # 确保 .env 不被提交到Git
└── backend/
    ├── server.js           # 主服务入口
    ├── src/
    │   ├── email-notifier.js
    │   └── routes/index.js
    └── test/
        └── *.js
```

**❌ 禁止的文件结构：**
```
/home/ctkj/edit-my-degree/
├── .env                    # ✅ 正确位置
└── backend/
    ├── .env                # ❌ 禁止在此处创建
    └── .env.example        # ❌ 禁止在此处创建
```

---

## 🔧 后端模块加载配置

所有后端模块必须使用以下方式加载根目录的 `.env` 文件：

### 1. 主服务入口 (server.js)
```javascript
require('dotenv').config({ path: '../.env' });
```

### 2. 路由模块 (src/routes/index.js)
```javascript
require('dotenv').config({ path: '../../.env' });
```

### 3. 邮件通知模块 (src/email-notifier.js)
```javascript
require('dotenv').config({ path: '../.env' });
```

### 4. 测试脚本 (test/*.js)
```javascript
require('dotenv').config({ path: '../.env' });
```

### 5. 批处理任务 (batch_task/*.js)
```javascript
// 从 backend/batch_task/ 目录
require('dotenv').config({ path: '../../.env' });
```

---

## 📝 路径规则说明

| 文件位置 | 相对路径 | 示例 |
|---------|---------|------|
| `backend/server.js` | `../.env` | 向上一级到根目录 |
| `backend/src/*.js` | `../../.env` | 向上两级到根目录 |
| `backend/test/*.js` | `../.env` | 向上一级到根目录 |
| `backend/batch_task/*.js` | `../../.env` | 向上两级到根目录 |

---

## 🎯 当前已修改的文件

以下文件已更新为正确加载根目录 `.env`：

- ✅ `backend/server.js` - `path: '../.env'`
- ✅ `backend/src/email-notifier.js` - `path: '../.env'`
- ✅ `backend/src/routes/index.js` - `path: '../../.env'`
- ✅ `backend/test/test-card-encryption.js` - `path: '../.env'`
- ✅ `backend/test/test-email-notification.js` - `path: '../.env'`
- ✅ `backend/test/test-error-email-notification.js` - `path: '../.env'`

---

## 📋 配置项分类

根目录 `.env` 文件中的配置按功能模块组织：

### 1. 应用基础配置
```bash
PORT=20000
VITE_API_BASE_URL="/api"
NODE_ENV=production
```

### 2. 数据库配置
```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=991218aa
DB_NAME=degree_management
DB_PORT=3306
```

### 3. JWT认证配置
```bash
JWT_SECRET=edit_my_degree_secret_key
JWT_EXPIRES_IN=2h
SUPERADD_JWT_EXPIRES_IN=30d
```

### 4. API安全配置
```bash
API_SECRET_KEY=edit_my_degree_api_secret_key
VITE_API_SECRET_KEY=edit_my_degree_api_secret_key
VITE_APP_KEY=sadwgfsefsdgfsdgf
VALID_APP_KEYS=sadwgfsefsdgfsdgf,asddsdoaiwd_asdlawnnn,zczxcvbnm123456
```

### 5. 会话管理配置
```bash
SESSION_DURATION_LEVEL_1=300000
SESSION_DURATION_LEVEL_2=1200000
SESSION_DURATION_LEVEL_3=1800000
SESSION_DURATION_LEVEL_4=7200000
```

### 6. MinIO对象存储配置
```bash
MINIO_ENDPOINT=cheerout.cn:19000
MINIO_BUCKET=editmydegree
MINIO_ACCESS_KEY=zxx
MINIO_SECRET_KEY=991218aa
MINIO_USE_SSL=false
```

### 7. 邮件通知配置
```bash
ENABLE_ERROR_EMAIL_NOTIFICATION=true
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=zxx12182022@163.com
SMTP_PASS=DNT9XEEwchW3FjwZ
ERROR_NOTIFICATION_EMAIL=zxx12182022@163.com
APP_NAME=学位管理系统
```

### 8. 日志配置
```bash
LOG_RETENTION_DAYS=3
```

---

## 🔍 验证配置加载

### 方法1：检查环境变量
```bash
cd /home/ctkj/edit-my-degree/backend
node -e "console.log('SMTP_HOST:', process.env.SMTP_HOST)"
```

### 方法2：查看启动日志
```bash
pm2 logs --lines 20 | grep "SMTP"
```

### 方法3：测试邮件发送
```bash
cd backend
node test/test-email-notification.js
```

---

## ⚠️ 常见错误

### 错误1：在backend目录下创建.env文件
```bash
# ❌ 错误做法
cd backend
touch .env

# ✅ 正确做法
cd /home/ctkj/edit-my-degree
nano .env
```

### 错误2：未指定.env路径
```javascript
// ❌ 错误写法（会查找当前目录的.env）
require('dotenv').config();

// ✅ 正确写法（明确指定根目录的.env）
require('dotenv').config({ path: '../.env' });
```

### 错误3：路径层级错误
```javascript
// backend/src/routes/index.js 中
// ❌ 错误路径（只向上一级）
require('dotenv').config({ path: '../.env' });

// ✅ 正确路径（向上两级到根目录）
require('dotenv').config({ path: '../../.env' });
```

---

## 🛡️ 安全规范

### 1. Git忽略规则
确保 `.gitignore` 包含：
```gitignore
# 环境配置文件
.env
.env.local
.env.*.local

# 但保留模板文件
!.env.example
```

### 2. 敏感信息管理
- ⚠️ 数据库密码、API密钥等敏感信息仅在 `.env` 中配置
- ⚠️ 不要将 `.env` 提交到版本控制系统
- ⚠️ 使用 `.env.example` 作为配置模板（不含真实密钥）

### 3. 权限设置
```bash
# 限制.env文件访问权限
chmod 600 /home/ctkj/edit-my-degree/.env
```

---

## 📞 故障排查

### 问题：环境变量未加载

**症状：**
```javascript
console.log(process.env.SMTP_HOST); // undefined
```

**排查步骤：**
```bash
# 1. 确认.env文件存在
ls -la /home/ctkj/edit-my-degree/.env

# 2. 检查dotenv加载路径
cd backend
node -e "
const path = require('path');
console.log('当前目录:', process.cwd());
console.log('.env路径:', path.resolve('../.env'));
const fs = require('fs');
console.log('文件存在:', fs.existsSync(path.resolve('../.env')));
"

# 3. 手动加载测试
node -e "
require('dotenv').config({ path: '../.env' });
console.log('SMTP_HOST:', process.env.SMTP_HOST);
"
```

### 问题：不同模块读取的配置不一致

**原因：** 某些模块使用了不同的路径或未指定路径

**解决方案：** 统一使用本文档规定的路径格式

---

## ✨ 最佳实践

1. **单一数据源**：所有配置集中在根目录 `.env`
2. **明确路径**：每个模块显式指定 `.env` 路径
3. **文档同步**：修改配置时同步更新相关文档
4. **定期审查**：定期检查 `.env` 的有效性和安全性
5. **备份管理**：定期备份 `.env` 文件（加密存储）

---

**文档版本：** v1.0  
**最后更新：** 2024-01-15  
**维护者：** 开发团队
