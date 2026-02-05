// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // 修改这里，指向项目根目录的.env文件

// 引入内部模块
const { initializeDatabaseConnection, createTables } = require('./src/database/init');
const { setupRoutes } = require('./src/routes');
const dbManager = require('./src/db-utils');

// 引入日志模块
require('./src/logger');

const app = express();
app.set('trust proxy', 1); // 添加这一行以信任代理
const PORT = process.env.PORT || 3001;

app.use(cors());

// 增加请求体大小限制以支持图片上传
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET;

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('未处理的错误:', err);
  
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
    // 初始化数据库连接池
    const pool = await initializeDatabaseConnection();
    
    // 创建表（如果不存在）
    await createTables(pool);
    
    // 设置路由
    setupRoutes(app, dbManager, JWT_SECRET);
    
    return true;
  } catch (err) {
    console.error('应用初始化失败:', err);
    return false;
  }
}

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信号，正在优雅关闭');
  await dbManager.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到 SIGINT 信号，正在优雅关闭');
  await dbManager.close();
  process.exit(0);
});

// 启动服务器
initializeApp().then((success) => {
  if (success) {
    const server = app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      
      // 从环境变量读取状态报告间隔，默认5小时
      const statusReportInterval = parseInt(process.env.DB_STATUS_REPORT_INTERVAL) || 18000000;
      
      // 定期输出连接池状态
      setInterval(() => {
        const stats = dbManager.getPoolStats();
        if (stats) {
          console.log('=== 数据库连接池状态报告 ===');
          console.log(`连接状态: ${stats.isConnected ? '正常' : '异常'}`);
          console.log(`配置信息:`, stats.config);
          console.log('========================');
        }
      }, statusReportInterval);
    });

    // 处理未捕获的异常
    process.on('uncaughtException', async (err) => {
      console.error('未捕获的异常:', err);
      await dbManager.close();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      console.error('未处理的Promise拒绝:', promise, '原因:', reason);
      await dbManager.close();
      process.exit(1);
    });

  } else {
    process.exit(1);
  }
});