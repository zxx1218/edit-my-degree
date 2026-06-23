# 数据库迁移执行指南

## 快速开始

### 方式一：执行所有迁移（推荐）

```bash
cd /home/ctkj/edit-my-degree/backend
npm run migrate
```

这将按时间顺序自动执行 `migrations` 目录下的所有迁移脚本。

### 方式二：执行单个迁移

```bash
cd /home/ctkj/edit-my-degree/backend
npm run migrate:single
```

或直接运行：

```bash
node src/database/migrations/20260622_193000_add_id_number_to_education.js
```

## 环境变量配置

迁移脚本会自动加载项目根目录的 `.env` 文件中的配置。确保以下数据库配置正确：

```env
DB_HOST=192.168.1.201
DB_USER=degree_management_test
DB_PASSWORD=your_password
DB_NAME=degree_management_test
DB_PORT=3306
```

## 当前需要执行的迁移

### 迁移：添加 id_number 字段到 education 表

**目的**：支持自考本科的证件号码显示功能

**影响**：
- 表：`education`
- 新增字段：`id_number` (TEXT类型)
- 位置：在 `certificate_number` 字段之后

**执行命令**：

```bash
cd /home/ctkj/edit-my-degree/backend
npm run migrate
```

或单独执行：

```bash
npm run migrate:single
```

**预期输出**：

```
✓ 环境变量加载成功
DB_HOST: 192.168.1.201
DB_USER: degree_management_test
DB_PASSWORD: ***已设置***
DB_NAME: degree_management_test
开始执行迁移：为 education 表添加 id_number 字段...
数据库连接池初始化成功
✓ 成功为 education 表添加 id_number 字段
数据库连接已关闭
✓ 20260622_193000_add_id_number_to_education.js 执行成功

============================================================
所有迁移执行完成！
============================================================
```

如果字段已存在：

```
开始执行迁移：为 education 表添加 id_number 字段...
id_number 字段已存在，跳过迁移
数据库连接已关闭
```

## 注意事项

⚠️ **重要提示**：

1. **备份数据库**：在执行任何迁移之前，请务必备份数据库
   ```bash
   mysqldump -u [username] -p [database_name] > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **测试环境验证**：先在开发/测试环境执行，确认无误后再应用到生产环境

3. **幂等性**：迁移脚本设计为可重复执行，如果字段已存在会自动跳过

4. **执行时机**：建议在低峰期执行迁移，避免影响用户访问

5. **回滚方案**：如需回滚，可以手动执行：
   ```sql
   ALTER TABLE education DROP COLUMN id_number;
   ```

## 故障排查

### 问题：无法连接到数据库

**解决方案**：
- 检查 `.env` 文件中的数据库配置是否正确
- 确认数据库服务正在运行
- 检查网络连接和防火墙设置

### 问题：权限不足

**解决方案**：
- 确保数据库用户有 ALTER TABLE 权限
- 联系数据库管理员授予必要权限

### 问题：迁移执行失败

**解决方案**：
- 查看错误日志了解具体原因
- 检查数据库表结构是否已被手动修改
- 确认没有其他进程正在修改该表

## 验证迁移结果

执行以下 SQL 查询验证字段是否添加成功：

```sql
DESCRIBE education;
```

应该能看到 `id_number` 字段在输出列表中。

或者查询特定字段：

```sql
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'education' 
  AND COLUMN_NAME = 'id_number';
```
