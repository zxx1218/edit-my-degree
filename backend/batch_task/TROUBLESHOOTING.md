# 批量任务模块故障排查指南

## 常见问题及解决方案

### 问题1: start.sh启动失败，提示"项目启动失败，请检查日志"

#### 症状
- 运行 `./start.sh` 后提示启动失败
- PM2进程列表中看不到batch-task-scheduler或状态为stopped
- 日志文件为空或没有内容

#### 根本原因
PM2版本兼容性问题。项目使用的是PM2 6.x版本，但脚本中使用了旧版本的参数：
- `--exec-mode fork` - PM2 6.x不支持此参数
- `--env production` - 在某些版本中可能导致问题

#### 解决方案（已修复）
已修改以下文件：

1. **start.sh** (第70-76行)
   ```bash
   # 修复前
   pm2 start $SCRIPT_PATH \
       --name $PROCESS_NAME \
       --instances 1 \
       --exec-mode fork \      # ❌ 移除
       --env $ENVIRONMENT \    # ❌ 移除
       ...
   
   # 修复后
   pm2 start $SCRIPT_PATH \
       --name $PROCESS_NAME \
       --instances 1 \
       --log-date-format "YYYY-MM-DD HH:mm:ss" \
       --merge-logs \
       --output "./logs/out.log" \
       --error "./logs/error.log"
   ```

2. **restart.sh** (第45行)
   ```bash
   # 修复前
   pm2 restart $PROCESS_NAME --env $ENVIRONMENT
   
   # 修复后
   pm2 restart $PROCESS_NAME
   ```

3. **start.sh进程检查逻辑** (第35-39行)
   ```bash
   # 修复前 - 会检测到stopped状态的进程
   if pm2 list | grep -q "$PROCESS_NAME"; then
   
   # 修复后 - 只检测online状态的进程
   if pm2 list | grep "$PROCESS_NAME" | grep -q "online"; then
   ```

#### 验证方法
```bash
cd /home/ctkj/edit-my-degree/backend/batch_task

# 1. 停止现有进程
pm2 stop batch-task-scheduler

# 2. 删除旧进程
pm2 delete batch-task-scheduler

# 3. 重新启动
./start.sh

# 4. 检查状态
pm2 status

# 应该看到：
# │ id  │ name                 │ ... │ status  │ ...
# │ xxx │ batch-task-scheduler │ ... │ online  │ ...

# 5. 查看日志
pm2 logs batch-task-scheduler --lines 20
```

#### 预期输出
```
══════════════════════════════════════════════════════════════════════
═══════════════════════ 批量任务调度器信息 ═══════════════════════════
══════════════════════════════════════════════════════════════════════

🕐 当前时间: 2026/07/23 15:29:31
🌍 时区设置: Asia/Shanghai
📦 Node环境: production
🔧 进程ID: 2181136

📋 已注册的任务:

  1. IP地理位置更新任务 (updateIPLocation)
     - 执行时间: 每天 0:30, 12:30, 17:30
     - 功能: 批量更新login_logs表中的IP地理位置信息
     - 配置来源: backend/batch_task/.env

💡 提示:
  - 使用 Ctrl+C 停止调度器
  - 查看日志: pm2 logs batch-task-scheduler
  - 重启服务: pm2 restart batch-task-scheduler

[2026/07/23 15:29:31] ✅ 调度器启动完成，等待定时任务触发...
```

---

### 问题2: 依赖未安装导致启动失败

#### 症状
- 启动时提示找不到node-cron模块
- 错误信息：`Error: Cannot find module 'node-cron'`

#### 解决方案
```bash
cd /home/ctkj/edit-my-degree/backend
npm install node-cron

# 验证安装
ls node_modules | grep cron
```

---

### 问题3: 配置文件缺失或错误

#### 症状
- 启动时提示数据库连接失败
- Cron表达式验证失败

#### 解决方案
1. 检查 `.env` 文件是否存在：
   ```bash
   ls -la backend/batch_task/.env
   ```

2. 验证配置内容：
   ```bash
   cat backend/batch_task/.env | grep -E "DB_|CRON_"
   ```

3. 运行测试脚本：
   ```bash
   cd backend/batch_task
   node test-batch-task.js
   ```

---

### 问题4: 端口或资源冲突

#### 症状
- PM2进程启动后立即退出
- 日志中出现端口占用错误

#### 解决方案
```bash
# 1. 检查是否有其他进程占用
pm2 list

# 2. 删除冲突进程
pm2 delete <process-id>

# 3. 重新启动
./start.sh
```

---

### 问题5: 定时任务未执行

#### 症状
- 调度器正常运行
- 但预定时间没有执行任务

#### 排查步骤
1. 检查系统时区：
   ```bash
   timedatectl
   # 应该显示：Time zone: Asia/Shanghai
   ```

2. 检查Cron表达式：
   ```bash
   cat backend/batch_task/.env | grep CRON
   ```

3. 查看调度器日志：
   ```bash
   pm2 logs batch-task-scheduler --lines 50
   ```

4. 手动触发测试：
   ```bash
   cd backend/batch_task
   node updateIPLocation.js
   ```

---

## 常用诊断命令

### 查看进程状态
```bash
pm2 status
pm2 list
```

### 查看实时日志
```bash
pm2 logs batch-task-scheduler
pm2 logs batch-task-scheduler --err  # 仅错误日志
pm2 logs batch-task-scheduler --lines 100  # 最近100行
```

### 查看进程详情
```bash
pm2 describe batch-task-scheduler
```

### 监控面板
```bash
pm2 monit
```

### 重启服务
```bash
cd backend/batch_task
./restart.sh
# 或
pm2 restart batch-task-scheduler
```

### 停止服务
```bash
cd backend/batch_task
./stop.sh
# 或
pm2 stop batch-task-scheduler
```

### 删除进程
```bash
pm2 delete batch-task-scheduler
```

### 保存配置
```bash
pm2 save
```

### 开机自启
```bash
pm2 startup systemd -u $USER --hp /home/$USER
pm2 save
```

---

## 日志文件位置

### PM2日志
```
/home/ctkj/.pm2/logs/
├── batch-task-scheduler-out.log
└── batch-task-scheduler-error.log
```

### 应用日志（配置的）
```
backend/batch_task/logs/
├── out.log
└── error.log
```

---

## 快速恢复流程

如果批量任务调度器出现异常，按以下步骤恢复：

```bash
# 1. 停止所有相关进程
cd /home/ctkj/edit-my-degree/backend/batch_task
pm2 stop batch-task-scheduler
pm2 delete batch-task-scheduler

# 2. 清理日志
rm -f logs/*.log

# 3. 验证配置
node test-batch-task.js

# 4. 重新启动
./start.sh

# 5. 验证状态
pm2 status
pm2 logs batch-task-scheduler --lines 20

# 6. 保存配置
pm2 save
```

---

## 联系支持

如果以上方法都无法解决问题，请：

1. 收集以下信息：
   - PM2版本：`pm2 --version`
   - Node版本：`node --version`
   - 完整错误日志：`pm2 logs batch-task-scheduler --lines 100`
   - 进程详情：`pm2 describe batch-task-scheduler`

2. 检查系统资源：
   ```bash
   top -p $(pgrep -f scheduler.js)
   df -h
   free -m
   ```

3. 联系开发团队并提供上述信息

---

**最后更新**: 2026-07-23  
**相关Issue**: PM2 6.x版本兼容性问题
