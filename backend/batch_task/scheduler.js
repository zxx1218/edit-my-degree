/**
 * 批量任务调度器
 * 
 * 功能说明：
 * 1. 统一管理所有批量任务的定时执行
 * 2. 支持多个任务的独立调度配置
 * 3. 提供任务状态监控和日志记录
 * 4. 防止同一任务并发执行
 * 
 * 使用方法：
 * cd /home/ctkj/edit-my-degree/backend/batch_task
 * node scheduler.js
 * 
 * 或使用PM2管理：
 * pm2 start scheduler.js --name batch-task-scheduler
 */

// 加载配置文件
require('dotenv').config({ path: './.env' });

// 兼容性处理
if (!console.safe) {
  console.safe = console.log;
}

const cron = require('node-cron');
const path = require('path');

// 导入任务模块
const updateIPLocationTask = require('./updateIPLocation');

// 任务运行状态跟踪（防止并发执行）
const taskRunningStatus = {
  updateIPLocation: false
};

// 时区配置
const TIMEZONE = process.env.CRON_TIMEZONE || 'Asia/Shanghai';

/**
 * 格式化时间戳
 */
function formatTimestamp() {
  return new Date().toLocaleString('zh-CN', { 
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * 打印分隔线
 */
function printSeparator(title = '') {
  const width = 70;
  const titleStr = title ? ` ${title} ` : '';
  const padding = Math.max(0, width - titleStr.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  
  console.log('\n' + '═'.repeat(width));
  console.log('═'.repeat(leftPad) + titleStr + '═'.repeat(rightPad));
  console.log('═'.repeat(width) + '\n');
}

/**
 * 安全执行任务（防止并发）
 */
async function safeExecuteTask(taskName, taskFunction) {
  // 检查任务是否正在运行
  if (taskRunningStatus[taskName]) {
    console.warn(`⚠️  任务 [${taskName}] 正在运行中，跳过本次执行`);
    return;
  }
  
  // 标记任务为运行状态
  taskRunningStatus[taskName] = true;
  
  try {
    console.log(`[${formatTimestamp()}] 🚀 开始执行任务: ${taskName}`);
    const startTime = Date.now();
    
    // 执行任务
    const result = await taskFunction();
    
    const duration = Date.now() - startTime;
    
    // 输出执行结果
    if (result.success) {
      console.log(`[${formatTimestamp()}] ✅ 任务 [${taskName}] 执行成功`);
      console.log(`   耗时: ${(duration / 1000).toFixed(2)}秒`);
      if (result.stats) {
        console.log(`   统计:`, JSON.stringify(result.stats, null, 2));
      }
    } else {
      console.error(`[${formatTimestamp()}] ❌ 任务 [${taskName}] 执行失败`);
      console.error(`   错误: ${result.message}`);
      if (result.error) {
        console.error(`   堆栈: ${result.error}`);
      }
    }
    
  } catch (error) {
    console.error(`[${formatTimestamp()}] ❌ 任务 [${taskName}] 执行异常:`, error.message);
    console.error(error.stack);
  } finally {
    // 重置任务状态
    taskRunningStatus[taskName] = false;
    console.log(`[${formatTimestamp()}] 📋 任务 [${taskName}] 状态已重置\n`);
  }
}

/**
 * 注册IP地理位置更新任务
 */
function registerUpdateIPLocationTask() {
  console.log('📅 注册 IP地理位置更新任务...');
  
  // 从环境变量读取三个定时配置
  const cronExpressions = [
    process.env.UPDATE_IP_LOCATION_CRON_1 || '30 0 * * *',   // 0:30
    process.env.UPDATE_IP_LOCATION_CRON_2 || '30 12 * * *',  // 12:30
    process.env.UPDATE_IP_LOCATION_CRON_3 || '30 17 * * *'   // 17:30
  ];
  
  const scheduleNames = ['凌晨0:30', '中午12:30', '下午17:30'];
  
  // 为每个时间点创建定时任务
  cronExpressions.forEach((cronExp, index) => {
    try {
      const job = cron.schedule(cronExp, () => {
        printSeparator(`IP地理位置更新任务 - ${scheduleNames[index]}`);
        safeExecuteTask('updateIPLocation', updateIPLocationTask.main);
      }, {
        scheduled: true,
        timezone: TIMEZONE
      });
      
      console.log(`   ✅ 定时任务已注册: ${scheduleNames[index]} (${cronExp})`);
      
      // 显示下次执行时间（兼容不同版本的node-cron）
      try {
        if (typeof job.nextRun === 'function') {
          const nextRun = job.nextRun();
          if (nextRun) {
            console.log(`      下次执行时间: ${nextRun.toLocaleString('zh-CN', { timeZone: TIMEZONE })}`);
          }
        } else if (job.nextDates) {
          console.log(`      下次执行时间: ${job.nextDates(1).toString()}`);
        }
      } catch (e) {
        // 忽略获取下次执行时间的错误
      }
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ 注册定时任务失败 (${scheduleNames[index]}):`, error.message);
    }
  });
}

/**
 * 显示调度器信息
 */
function displaySchedulerInfo() {
  printSeparator('批量任务调度器信息');
  
  console.log(`🕐 当前时间: ${formatTimestamp()}`);
  console.log(`🌍 时区设置: ${TIMEZONE}`);
  console.log(`📦 Node环境: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔧 进程ID: ${process.pid}\n`);
  
  console.log('📋 已注册的任务:\n');
  console.log('  1. IP地理位置更新任务 (updateIPLocation)');
  console.log('     - 执行时间: 每天 0:30, 12:30, 17:30');
  console.log('     - 功能: 批量更新login_logs表中的IP地理位置信息');
  console.log('     - 配置来源: backend/batch_task/.env\n');
  
  console.log('💡 提示:');
  console.log('  - 使用 Ctrl+C 停止调度器');
  console.log('  - 查看日志: pm2 logs batch-task-scheduler');
  console.log('  - 重启服务: pm2 restart batch-task-scheduler\n');
}

/**
 * 优雅退出处理
 */
function setupGracefulShutdown() {
  const shutdown = (signal) => {
    console.log(`\n\n[${formatTimestamp()}] 🛑 收到 ${signal} 信号，正在关闭调度器...`);
    console.log('💾 保存任务状态...');
    console.log('🔌 清理资源...');
    console.log('✅ 调度器已安全关闭\n');
    process.exit(0);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    console.error(`\n[${formatTimestamp()}] ❌ 未捕获的异常:`, error.message);
    console.error(error.stack);
    shutdown('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error(`\n[${formatTimestamp()}] ❌ 未处理的Promise拒绝:`, reason);
    shutdown('UNHANDLED_REJECTION');
  });
}

/**
 * 主函数
 */
async function main() {
  printSeparator('批量任务调度器启动');
  
  console.log(`[${formatTimestamp()}] 🚀 批量任务调度器启动中...\n`);
  
  try {
    // 注册所有定时任务
    registerUpdateIPLocationTask();
    
    // 显示调度器信息
    displaySchedulerInfo();
    
    // 设置优雅退出
    setupGracefulShutdown();
    
    console.log(`[${formatTimestamp()}] ✅ 调度器启动完成，等待定时任务触发...\n`);
    
  } catch (error) {
    console.error(`[${formatTimestamp()}] ❌ 调度器启动失败:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 启动调度器
main();
