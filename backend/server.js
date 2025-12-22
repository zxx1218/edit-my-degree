// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // 修改这里，指向项目根目录的.env文件

// 引入内部模块
const { initializeDatabaseConnection, createTables } = require('./src/database/init');
const { setupRoutes } = require('./src/routes');

// 引入日志模块
require('./src/logger');

const app = express();
app.set('trust proxy', 1); // 添加这一行以信任代理
const PORT = process.env.PORT || 3001;

// 数据库连接实例
let db;

app.use(cors());

// 增加请求体大小限制以支持图片上传
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET;

async function initializeApp() {
  try {
    // 初始化数据库连接
    db = await initializeDatabaseConnection();
    
    // 创建表（如果不存在）
    await createTables(db);
    
    // 设置路由
    setupRoutes(app, db, JWT_SECRET);
    
    return true;
  } catch (err) {
    console.error('Application initialization failed:', err);
    return false;
  }
}

// 启动服务器
initializeApp().then((success) => {
  if (success) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } else {
    process.exit(1);
  }
});