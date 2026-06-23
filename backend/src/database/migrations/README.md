# 数据库迁移脚本

本目录包含用于管理数据库结构变更的迁移脚本。

## 命名规范

迁移脚本文件名格式：`YYYYMMDD_HHMMSS_description.js`

示例：
- `20260622_193000_add_id_number_to_education.js` - 为 education 表添加 id_number 字段

## 执行迁移

### 方法一：直接运行单个迁移脚本

```bash
cd /home/ctkj/edit-my-degree/backend
node src/database/migrations/20260622_193000_add_id_number_to_education.js
```

### 方法二：按顺序执行所有未执行的迁移（待实现）

未来可以创建一个迁移管理器来自动追踪和执行所有未执行的迁移。

## 迁移脚本结构

每个迁移脚本应遵循以下结构：

```javascript
const dbManager = require('../../db-utils');

async function migrationFunction() {
  let pool;
  
  try {
    // 1. 获取数据库连接池
    pool = await dbManager.initializePool();
    
    // 2. 检查是否已执行（幂等性）
    // 例如：检查字段、表、索引是否已存在
    
    // 3. 执行 DDL 操作
    // ALTER TABLE, CREATE INDEX, etc.
    
    console.log('✓ 迁移成功');
    
  } catch (error) {
    console.error('✗ 迁移失败:', error.message);
    throw error;
  } finally {
    // 4. 关闭连接池
    if (pool) {
      await dbManager.closePool();
    }
  }
}

// 支持直接运行
if (require.main === module) {
  migrationFunction()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrationFunction;
```

## 最佳实践

1. **幂等性**：迁移脚本应该可以安全地多次运行，不会造成错误
   - 使用 `IF NOT EXISTS` 或先检查再创建
   - 检查字段/表/索引是否已存在

2. **错误处理**：始终包含 try-catch-finally 块
   - 在 finally 中关闭数据库连接
   - 提供清晰的错误信息

3. **日志输出**：使用 console.log 记录迁移进度
   - 开始执行时输出描述
   - 成功时输出 ✓ 标记
   - 失败时输出 ✗ 标记和错误信息

4. **备份建议**：在生产环境执行迁移前，务必备份数据库

5. **测试**：在开发环境充分测试后再应用到生产环境

## 当前迁移列表

### 20260622_193000_add_id_number_to_education.js
- **日期**: 2026-06-22
- **描述**: 为 education 表添加 id_number 字段，支持自考本科的证件号码显示
- **影响表**: education
- **新增字段**: id_number (TEXT)
- **执行命令**: 
  ```bash
  node src/database/migrations/20260622_193000_add_id_number_to_education.js
  ```
