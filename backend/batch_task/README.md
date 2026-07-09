# 批量任务脚本说明

本目录包含用于批量处理和维护数据库的Node.js脚本。

## 📋 脚本列表

### 1. findAbnormalLoginUsers.js - 查找剩余登录次数异常的用户 ⭐ NEW

**功能说明：**
- 从指定日期开始检索users表内所有有登录次数的用户（remaining_logins > 0）
- 检索每个用户使用过的登录次数充值卡（type='login'且used=TRUE）
- 计算用户所有使用过的登录次数充值卡的总充值数量
- 筛选出：用户当前剩余登录次数 >= 使用过的充值卡总数量 且 剩余次数 > 0 的用户
- 输出这些用户的详细信息（用户名、剩余次数、充值卡总数等）

**业务逻辑：**
- 正常情况下，用户使用的充值卡总数应该等于或大于当前剩余次数
- 如果剩余次数 >= 充值卡总数，说明可能存在数据异常（如手动修改数据库）
- 此脚本用于排查这类异常情况

**使用方法：**
```bash
cd /home/ctkj/edit-my-degree/backend
node batch_task/findAbnormalLoginUsers.js [起始日期]
```

**参数说明：**
- 起始日期格式：YYYY-MM-DD（可选，默认为今天）
- 示例：`node batch_task/findAbnormalLoginUsers.js 2024-01-01`

**输出结果：**
- 控制台显示详细的统计信息和异常用户列表
- 自动生成CSV文件保存到 `batch_task/output/` 目录
- CSV文件名格式：`abnormal_users_YYYY-MM-DD_timestamp.csv`

**CSV字段说明：**
- 用户名：用户的登录名
- 剩余登录次数：当前remaining_logins字段的值
- PDF积分：当前pdf_limit字段的值
- 使用过的充值卡总数：该用户使用的所有type='login'充值卡的values总和
- 差值(剩余-充值)：remaining_logins - total_login_cards
- 创建时间：用户账号创建时间
- 更新时间：用户信息最后更新时间
- 是否异常：是/否

**注意事项：**
- 确保 `.env` 文件中数据库配置正确
- 只读操作，不会修改任何数据
- 利用现有的数据库连接池管理
- 大数据量时会自动分批处理并显示进度

---

### 2. updateIPLocation.js - 批量更新IP地理位置

**功能说明：**
- 查询所有需要更新的登录记录（ip_location包含"未知"或"X"字符）
- 调用更精确的IP归属地API进行查询
- 批量更新数据库中的ip_location字段
- 提供详细的处理进度和统计信息

**使用方法：**
```bash
cd /home/ctkj/edit-my-degree/backend
node batch_task/updateIPLocation.js
```

**注意事项：**
- 确保 `.env` 文件中数据库配置正确
- 利用现有的24小时IP缓存机制，避免重复查询
- 采用分批处理，每批100条记录，避免API限流

---

### 3. downloadDatabasesBackup.js - 下载数据库备份

**功能说明：**
- 从MinIO存储桶下载数据库备份文件
- 支持指定备份文件路径
- 自动创建本地备份目录

**使用方法：**
```bash
cd /home/ctkj/edit-my-degree/backend
node batch_task/downloadDatabasesBackup.js [备份文件名]
```

---

### 4. clearMinioReports.js - 清理MinIO报告文件

**功能说明：**
- 清理过期的PDF报告文件
- 支持按天数筛选
- 提供清理统计信息

**使用方法：**
```bash
cd /home/ctkj/edit-my-degree/backend
node batch_task/clearMinioReports.js [保留天数]
```

---

## 🔧 通用规范

### 脚本开发要求

1. **头部注释**：详细说明功能、使用方法、注意事项
2. **环境变量加载**：`require('dotenv').config({ path: '../../.env' })`
3. **兼容性处理**：
```javascript
if (!console.safe) {
  console.safe = console.log;
}
```
4. **导入dbManager**：`const dbManager = require('../src/db-utils');`
5. **配置参数**：使用CONFIG对象定义批处理大小、延迟等
6. **统计信息**：使用stats对象记录处理进度
7. **资源清理**：脚本结束时调用`await dbManager.close()`

### 执行环境

- Node.js 版本：建议 v16+
- 依赖包：确保已运行 `npm install`
- 数据库：MySQL 8.0+
- 配置文件：根目录的 `.env` 文件

### 最佳实践

1. **测试先行**：在测试环境验证脚本功能
2. **数据备份**：执行写操作前备份数据库
3. **分批处理**：大数据量时使用分批处理，避免内存溢出
4. **进度输出**：提供清晰的进度和统计信息
5. **错误处理**：完善的try-catch和资源清理
6. **日志记录**：使用console.safe输出关键信息

---

## 📝 添加新脚本

如需添加新的批量任务脚本，请遵循以下步骤：

1. 在 `backend/batch_task/` 目录下创建新的 `.js` 文件
2. 按照上述规范编写代码
3. 在本README中添加脚本说明
4. 在测试环境充分测试
5. 提交代码前确认无语法错误

---

## ⚠️ 注意事项

- 所有脚本都必须在 `backend` 目录下执行
- 确保 `.env` 配置文件存在且配置正确
- 生产环境执行前务必先在测试环境验证
- 涉及数据修改的操作需要先获得审批
- 定期清理 `output` 目录下的临时文件
