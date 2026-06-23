// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // 修改这里，指向项目根目录的.env文件

// 引入内部模块
const { initializeDatabaseConnection, createTables } = require('./src/database/init');
const { setupRoutes } = require('./src/routes');
const dbManager = require('./src/db-utils');
const { startCleanupTask } = require('./src/ip-blacklist');

// 引入日志模块
require('./src/logger');

const app = express();
app.set('trust proxy', 1); // 添加这一行以信任代理
const PORT = process.env.PORT || 3001;

// 判断是否为日志进程（只在进程 0 中记录日志）
const isLogProcess = process.env.NODE_APP_INSTANCE === '0' || !process.env.NODE_APP_INSTANCE;

app.use(cors());

// 增加请求体大小限制以支持图片上传
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET;

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('[系统] 未处理的错误:', err.message, { 
    url: req?.url,
    method: req?.method,
    ip: req?.ip,
    stack: err.stack 
  });
  
  // 数据库连接错误处理
  if (err.message && err.message.includes('connection is in closed state')) {
    res.status(503).json({
      success: false,
      error: '数据库连接异常，请稍后重试'
    });
    return;
  }
  
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

async function initializeApp() {
  try {
    console.safe('[系统] 开始初始化应用...');
    
    // 初始化数据库连接池
    console.safe('[系统] 正在初始化数据库连接池...');
    const pool = await initializeDatabaseConnection();
    console.safe('[系统] ✅ 数据库连接池初始化成功');
    
    // 创建表（如果不存在）
    console.safe('[系统] 正在检查并创建数据表...');
    await createTables(pool);
    console.safe('[系统] ✅ 数据表检查/创建完成');
    
    // 启动IP黑名单缓存清理任务
    console.safe('[系统] 正在启动IP黑名单缓存清理任务...');
    startCleanupTask();
    console.safe('[系统] ✅ IP黑名单缓存清理任务已启动');
    
    // 设置路由
    console.safe('[系统] 正在配置路由...');
    setupRoutes(app, dbManager, JWT_SECRET);
    console.safe('[系统] ✅ 路由配置完成');
    
    console.safe('[系统] ✅ 应用初始化完成');
    return true;
  } catch (err) {
    console.error('[系统] ❌ 应用初始化失败:', err.message, { stack: err.stack });
    return false;
  }
}

// 优雅关闭处理
process.on('SIGTERM', async () => {
  if (isLogProcess) {
    console.safe('[系统] 收到 SIGTERM 信号，正在优雅关闭...');
  }
  await dbManager.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (isLogProcess) {
    console.safe('[系统] 收到 SIGINT 信号，正在优雅关闭...');
  }
  await dbManager.close();
  process.exit(0);
});

// 启动服务器
initializeApp().then((success) => {
  if (success) {
    const server = app.listen(PORT, () => {
      // 只在日志进程中打印启动信息
      if (isLogProcess) {
        console.safe(`\n========================================`);
        console.safe(`🚀 服务器启动成功`);
        console.safe(`📍 端口: ${PORT}`);
        console.safe(`🔧 环境: ${process.env.NODE_ENV}`);
        console.safe(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
        console.safe(`========================================\n`);
      
        // 从环境变量读取状态报告间隔，默认 5 小时
        const statusReportInterval = parseInt(process.env.DB_STATUS_REPORT_INTERVAL) || 18000000;
        
        // 定期输出连接池状态（只在日志进程中）
        setInterval(() => {
          const stats = dbManager.getPoolStats();
          if (stats) {
            console.safe('\n========== 数据库连接池状态报告 ==========');
            console.safe(`连接状态：${stats.isConnected ? '✅ 正常' : '❌ 异常'}`);
            console.safe(`活动连接数：${stats.activeConnections}`);
            console.safe(`空闲连接数：${stats.freeConnections}`);
            console.safe(`等待队列长度：${stats.queuedRequests}`);
            console.safe('=========================================\n');
          }
        }, statusReportInterval);
      }
    });

    // 处理未捕获的异常
    process.on('uncaughtException', async (err) => {
      console.error('[系统] ❌ 未捕获的异常:', err.message, { stack: err.stack });
      await dbManager.close();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      console.error('[系统] ❌ 未处理的Promise拒绝:', { reason, promise });
      await dbManager.close();
      process.exit(1);
    });

  } else {
    console.error('[系统] ❌ 应用初始化失败，退出进程');
    process.exit(1);
  }
});