# 批量任务模块 (Batch Task Module)

## 📋 概述

批量任务模块是独立于主后端服务的任务调度系统，用于执行定时批量操作，如IP地理位置更新、数据备份等。

### 特点
- ✅ 独立运行，不影响主服务
- ✅ 支持定时任务调度
- ✅ 使用PM2进行进程管理
- ✅ 独立的配置文件
- ✅ 完善的日志记录
- ✅ 防止并发执行

## 📁 目录结构

```
backend/batch_task/
├── .env                    # 批量任务配置文件
├── scheduler.js            # 定时任务调度器（主入口）
├── updateIPLocation.js     # IP地理位置更新任务
├── start.sh                # 启动脚本
├── stop.sh                 # 停止脚本
├── restart.sh              # 重启脚本
├── logs/                   # 日志目录
│   ├── out.log            # 标准输出日志
│   └── error.log          # 错误日志
└── README.md              # 本文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /home/ctkj/edit-my-degree/backend
npm install node-cron
```

### 2. 配置环境变量

编辑 `backend/batch_task/.env` 文件，确保以下配置正确：

```bash
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=991218aa
DB_NAME=degree_management
DB_PORT=3306

# 定时任务配置（已预设为每天0:30、12:30、17:30执行）
UPDATE_IP_LOCATION_CRON_1=30 0 * * *
UPDATE_IP_LOCATION_CRON_2=30 12 * * *
UPDATE_IP_LOCATION_CRON_3=30 17 * * *
CRON_TIMEZONE=Asia/Shanghai
```

### 3. 设置脚本权限

```bash
cd /home/ctkj/edit-my-degree/backend/batch_task
chmod +x start.sh stop.sh restart.sh
```

### 4. 启动服务

```bash
# 启动批量任务调度器（默认生产环境）
./start.sh

# 或指定环境
./start.sh development
```

### 5. 查看状态

```bash
# 查看进程状态
pm2 status

# 查看实时日志
pm2 logs batch-task-scheduler

# 查看最近50行日志
pm2 logs batch-task-scheduler --lines 50

# 监控面板
pm2 monit
```

### 6. 停止服务

```bash
./stop.sh
```

### 7. 重启服务

```bash
./restart.sh
```

## ⏰ 定时任务配置

### Cron表达式格式

```
分 时 日 月 周
*  *  *  *  *
│  │  │  │  │
│  │  │  │  └─ 星期几 (0-7, 0和7都表示周日)
│  │  │  └──── 月份 (1-12)
│  │  └─────── 日期 (1-31)
│  └────────── 小时 (0-23)
└───────────── 分钟 (0-59)
```

### 常用示例

| 描述 | Cron表达式 |
|------|-----------|
| 每天0:30 | `30 0 * * *` |
| 每天12:30 | `30 12 * * *` |
| 每天17:30 | `30 17 * * *` |
| 每小时整点 | `0 * * * *` |
| 每5分钟 | `*/5 * * * *` |
| 每周一9:00 | `0 9 * * 1` |
| 每月1号0:00 | `0 0 1 * *` |

### 当前配置

IP地理位置更新任务每天执行三次：
- **凌晨 0:30** - 处理前一天的登录IP
- **中午 12:30** - 处理上午的登录IP
- **下午 17:30** - 处理下午的登录IP

如需修改时间，编辑 `.env` 文件中的对应配置项。

## 📝 添加新任务

### 步骤1: 创建任务脚本

在 `backend/batch_task/` 目录下创建新的任务文件，例如 `clearOldData.js`：

```javascript
/**
 * 清理旧数据任务示例
 */

require('dotenv').config({ path: './.env' });

if (!console.safe) {
  console.safe = console.log;
}

const dbManager = require('../src/db-utils');

async function main() {
  console.log('🚀 开始执行清理旧数据任务...');
  
  try {
    await dbManager.initializePool();
    
    // 执行你的业务逻辑
    const query = 'DELETE FROM some_table WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)';
    const [result] = await dbManager.execute(query);
    
    console.log(`✅ 清理完成，删除了 ${result.affectedRows} 条记录`);
    
    return { 
      success: true, 
      message: '清理完成',
      deletedCount: result.affectedRows
    };
    
  } catch (error) {
    console.error('❌ 任务执行失败:', error.message);
    return { success: false, message: error.message };
  } finally {
    await dbManager.close();
  }
}

// 导出主函数
module.exports = { main };

// 支持直接运行
if (require.main === module) {
  main().catch(error => {
    console.error('未捕获的错误:', error);
    process.exit(1);
  });
}
```

### 步骤2: 在调度器中注册任务

编辑 `scheduler.js`，添加以下内容：

```javascript
// 导入新任务
const clearOldDataTask = require('./clearOldData');

// 在 taskRunningStatus 中添加状态跟踪
const taskRunningStatus = {
  updateIPLocation: false,
  clearOldData: false  // 新增
};

// 注册定时任务
function registerClearOldDataTask() {
  const cronExp = process.env.CLEAR_OLD_DATA_CRON || '0 2 * * *';  // 每天凌晨2点
  
  cron.schedule(cronExp, () => {
    printSeparator('清理旧数据任务');
    safeExecuteTask('clearOldData', clearOldDataTask.main);
  }, {
    scheduled: true,
    timezone: TIMEZONE
  });
  
  console.log(`   ✅ 清理旧数据任务已注册: ${cronExp}`);
}

// 在主函数中调用
async function main() {
  // ... existing code ...
  registerUpdateIPLocationTask();
  registerClearOldDataTask();  // 新增
  // ... existing code ...
}
```

### 步骤3: 在 .env 中添加配置

```bash
# 清理旧数据任务配置
CLEAR_OLD_DATA_CRON=0 2 * * *
```

### 步骤4: 重启服务

```bash
./restart.sh
```

## 🔧 故障排查

### 问题1: 任务未执行

**检查清单：**
1. 确认调度器正在运行：`pm2 status`
2. 检查日志是否有错误：`pm2 logs batch-task-scheduler`
3. 验证Cron表达式是否正确
4. 确认时区设置为 `Asia/Shanghai`
5. 检查任务是否因前一次执行未完成而被跳过

### 问题2: 数据库连接失败

**解决方案：**
1. 检查 `.env` 中的数据库配置是否正确
2. 确认MySQL服务正在运行
3. 测试数据库连接：`mysql -h localhost -u root -p`
4. 检查防火墙设置

### 问题3: PM2进程异常退出

**解决方案：**
1. 查看详细日志：`pm2 logs batch-task-scheduler --err`
2. 检查内存使用：`pm2 monit`
3. 重启服务：`./restart.sh`
4. 查看系统资源：`top` 或 `htop`

### 问题4: 任务执行时间过长

**优化建议：**
1. 调整批次大小（BATCH_SIZE）
2. 增加批次间延迟（DELAY_BETWEEN_BATCHES）
3. 检查API限流策略
4. 考虑分片处理大数据集

## 📊 监控与日志

### 日志位置

```
backend/batch_task/logs/
├── out.log       # 标准输出和任务执行日志
└── error.log     # 错误日志
```

### 查看日志

```bash
# 实时查看所有日志
pm2 logs batch-task-scheduler

# 仅查看错误日志
pm2 logs batch-task-scheduler --err

# 查看最近100行
pm2 logs batch-task-scheduler --lines 100

# 清空日志
pm2 flush batch-task-scheduler
```

### 日志内容示例

```
[2026-07-23 00:30:00] 🚀 开始执行任务: updateIPLocation
[2026-07-23 00:30:01] 🔍 正在查询需要更新的记录...
[2026-07-23 00:30:02] ✅ 找到 150 个需要更新的唯一IP地址
[2026-07-23 00:30:02] 🚀 开始处理...
[2026-07-23 00:35:30] ✅ 任务 [updateIPLocation] 执行成功
   耗时: 330.45秒
   统计: { total: 150, processed: 150, success: 145, failed: 0, skipped: 5 }
```

## 🔐 安全注意事项

1. **配置文件保护**
   - `.env` 文件包含敏感信息，不要提交到版本控制
   - 确保文件权限正确：`chmod 600 .env`

2. **API密钥管理**
   - 定期轮换API密钥
   - 不要在代码中硬编码密钥

3. **访问控制**
   - 限制对日志文件的访问
   - 定期清理旧日志

4. **错误处理**
   - 所有任务都有错误捕获机制
   - 关键错误会记录详细堆栈信息

## 🎯 最佳实践

1. **任务设计**
   - 保持任务单一职责
   - 实现幂等性（可重复执行）
   - 提供详细的进度反馈

2. **性能优化**
   - 使用分批处理避免内存溢出
   - 合理设置延迟避免API限流
   - 利用缓存减少重复查询

3. **错误处理**
   - 捕获所有异常
   - 记录详细错误信息
   - 确保资源正确释放

4. **监控告警**
   - 定期检查任务执行状态
   - 设置失败通知机制
   - 监控系统资源使用

## 📞 技术支持

如有问题，请：
1. 查看日志文件定位问题
2. 检查配置文件是否正确
3. 参考本文档的故障排查章节
4. 联系系统管理员

---

**最后更新**: 2025-05-13  
**维护者**: 系统开发团队