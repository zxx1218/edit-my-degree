# 后端日志API接口文档

请在您的Express后端中添加以下日志读取API接口。

## 安装依赖

```bash
npm install chokidar  # 用于监听文件变化
```

## API端点实现

在您的Express后端中添加以下代码：

```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const router = express.Router();

// 日志目录路径
const LOGS_DIR = path.join(__dirname, '../logs');

/**
 * GET /api/logs/today
 * 获取当天日志的最新N行
 * Query参数: lines - 返回的行数，默认100
 */
router.get('/logs/today', async (req, res) => {
  try {
    const lines = parseInt(req.query.lines) || 100;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFileName = `application-${today}.log`;
    const logFilePath = path.join(LOGS_DIR, logFileName);

    // 检查文件是否存在
    if (!fs.existsSync(logFilePath)) {
      return res.json({
        success: true,
        logs: [],
        message: '今日暂无日志文件',
        fileName: logFileName,
        lastModified: null
      });
    }

    // 获取文件最后修改时间
    const stats = fs.statSync(logFilePath);
    const lastModified = stats.mtime.toISOString();

    // 读取文件最后N行
    const logLines = await readLastLines(logFilePath, lines);

    res.json({
      success: true,
      logs: logLines,
      fileName: logFileName,
      lastModified: lastModified,
      totalLines: logLines.length
    });
  } catch (error) {
    console.error('读取日志文件错误:', error);
    res.status(500).json({
      success: false,
      error: '读取日志文件失败',
      message: error.message
    });
  }
});

/**
 * GET /api/logs/check-update
 * 检查日志文件是否有更新
 * Query参数: lastModified - 上次获取的修改时间
 */
router.get('/logs/check-update', (req, res) => {
  try {
    const { lastModified } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const logFileName = `application-${today}.log`;
    const logFilePath = path.join(LOGS_DIR, logFileName);

    if (!fs.existsSync(logFilePath)) {
      return res.json({
        success: true,
        hasUpdate: false,
        currentModified: null
      });
    }

    const stats = fs.statSync(logFilePath);
    const currentModified = stats.mtime.toISOString();
    const hasUpdate = !lastModified || new Date(currentModified) > new Date(lastModified);

    res.json({
      success: true,
      hasUpdate: hasUpdate,
      currentModified: currentModified
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '检查日志更新失败',
      message: error.message
    });
  }
});

/**
 * 读取文件最后N行的辅助函数
 */
async function readLastLines(filePath, lineCount) {
  return new Promise((resolve, reject) => {
    const lines = [];
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      lines.push(line);
      // 保持数组长度不超过需要的行数的2倍，避免内存问题
      if (lines.length > lineCount * 2) {
        lines.splice(0, lineCount);
      }
    });

    rl.on('close', () => {
      // 返回最后N行
      resolve(lines.slice(-lineCount));
    });

    rl.on('error', reject);
  });
}

module.exports = router;
```

## 在主应用中使用

```javascript
const express = require('express');
const cors = require('cors');
const logsRouter = require('./routes/logs'); // 上面的代码保存为 routes/logs.js

const app = express();

// CORS配置 - 允许前端访问
app.use(cors({
  origin: ['http://localhost:8080', 'https://your-frontend-domain.com'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// 注册日志路由
app.use('/api', logsRouter);

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

## API响应格式

### GET /api/logs/today

请求：
```
GET /api/logs/today?lines=100
```

响应：
```json
{
  "success": true,
  "logs": [
    "2025-12-25 10:00:00 INFO - 用户登录成功",
    "2025-12-25 10:00:01 DEBUG - 处理请求...",
    ...
  ],
  "fileName": "application-2025-12-25.log",
  "lastModified": "2025-12-25T10:00:01.000Z",
  "totalLines": 100
}
```

### GET /api/logs/check-update

请求：
```
GET /api/logs/check-update?lastModified=2025-12-25T10:00:00.000Z
```

响应：
```json
{
  "success": true,
  "hasUpdate": true,
  "currentModified": "2025-12-25T10:00:30.000Z"
}
```

## 前端配置

在您的前端环境变量中配置后端API地址：

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

或在生产环境中使用您的后端域名。
