const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const util = require('util');
const fs = require('fs');

// 创建日志目录
const logDir = path.join(__dirname, '..', 'logs');

// 定义日志格式 - 增强版，支持彩色输出和更详细的信息
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    // 如果有额外的元数据，将其格式化为 JSON 字符串
    let fullMessage = message;
    if (Object.keys(metadata).length > 0) {
      try {
        const metadataStr = JSON.stringify(metadata, null, 2);
        fullMessage = `${message}\n${metadataStr}`;
      } catch (e) {
        fullMessage = `${message} ${util.inspect(metadata, { depth: null, colors: false })}`;
      }
    }
    return `${timestamp} [${level.toUpperCase()}]: ${fullMessage}`;
  })
);

// 控制台输出格式（带颜色）
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let fullMessage = message;
    if (Object.keys(metadata).length > 0 && process.env.NODE_ENV !== 'production') {
      try {
        const metadataStr = JSON.stringify(metadata, null, 2);
        fullMessage = `${message}\n${metadataStr}`;
      } catch (e) {
        fullMessage = `${message} ${util.inspect(metadata, { depth: null, colors: true })}`;
      }
    }
    return `${timestamp} [${level.toUpperCase()}]: ${fullMessage}`;
  })
);

// 创建传输器
const transports = [
  // 控制台输出
  new winston.transports.Console({
    level: 'info',
    format: consoleFormat,
    silent: false
  }),
  // info级别及以上的普通日志 - .log 文件（仅记录 info 和 http）
  new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m', // 10MB
    maxFiles: '3d', // 保留3天
    format: winston.format.combine(
      winston.format((info) => {
        // 只记录 info 和 http 级别
        if (info.level === 'info' || info.level === 'http') {
          return info;
        }
        return false; // 返回 false 会丢弃该日志
      })(),
      logFormat
    ),
    silent: false
  }),
  // warn级别的警告日志 - .warn 文件（仅记录 warn）
  new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.warn'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m', // 10MB
    maxFiles: '3d', // 保留3天
    format: winston.format.combine(
      winston.format((info) => {
        // 只记录 warn 级别
        if (info.level === 'warn') {
          return info;
        }
        return false;
      })(),
      logFormat
    ),
    silent: false
  }),
  // error级别的错误日志 - .error 文件（仅记录 error）
  new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.error'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m', // 10MB
    maxFiles: '3d', // 保留3天
    format: winston.format.combine(
      winston.format((info) => {
        // 只记录 error 级别
        if (info.level === 'error') {
          return info;
        }
        return false;
      })(),
      logFormat
    ),
    silent: false
  }),
  // 安全防护相关日志 - .safe 文件（仅接收safe级别）
  new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.safe'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m', // 10MB
    maxFiles: '3d', // 保留3天
    format: winston.format.combine(
      winston.format((info) => {
        // 只接收safe级别的日志
        if (info.level === 'safe') {
          return info;
        }
        return false;
      })(),
      logFormat
    ),
    silent: false
  })
];

// 创建logger实例
const logger = winston.createLogger({
  level: 'silly', // 设置为最低级别，让所有日志都能被处理，由传输器的filter来控制
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    safe: 4,
    debug: 5,
    verbose: 6,
    silly: 7
  },
  transports
});

// 为safe级别添加便捷方法
logger.safe = function(message, ...meta) {
  this.log('safe', message, ...meta);
};

// 格式化参数，处理对象和数组等复杂类型
function formatArgs(args) {
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      return util.inspect(arg, { depth: null, colors: false });
    }
    return arg;
  }).join(' ');
}

// 重写console方法，使其同时输出到日志文件和控制台
const originalLog = console.log;
const originalInfo = console.info;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
  logger.info(formatArgs(args));
  // originalLog.apply(console, args);
};

console.info = (...args) => {
  logger.info(formatArgs(args));
  // originalInfo.apply(console, args);
};

console.warn = (...args) => {
  logger.warn(formatArgs(args));
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  logger.error(formatArgs(args));
  originalError.apply(console, args);
};

console.safe = (...args) => {
  logger.safe(formatArgs(args));
};

/**
 * 手动清理过期的日志文件
 * 由于winston-daily-rotate-file的maxFiles在某些情况下不会立即清理，
 * 特别是当某些天没有产生新日志时，需要手动清理
 */
function cleanupOldLogFiles() {
  try {
    // 从环境变量读取日志保留天数，默认3天
    const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS) || 3;
    const now = new Date();
    
    // 获取今天的日期（去掉时间部分）
    const todayStr = now.toISOString().split('T')[0];
    const todayDate = new Date(todayStr + 'T00:00:00.000Z');
    
    // 计算截止日期：今天 - (保留天数 - 1)天
    const cutoffDate = new Date(todayDate.getTime() - (retentionDays - 1) * 24 * 60 * 60 * 1000);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    console.safe(`[日志清理] 开始清理，当前日期: ${todayStr}, 保留${retentionDays}天，截止日期: ${cutoffDateStr}`);
    
    if (!fs.existsSync(logDir)) {
      return;
    }
    
    const files = fs.readdirSync(logDir);
    let deletedCount = 0;
    
    for (const file of files) {
      // 匹配日志文件名格式: application-YYYY-MM-DD.log/warn/error/safe
      const match = file.match(/^application-(\d{4}-\d{2}-\d{2})\.(log|warn|error|safe)$/);
      if (!match) continue;
      
      const dateStr = match[1];
      
      // 如果文件日期早于截止日期，删除该文件
      if (dateStr < cutoffDateStr) {
        const filePath = path.join(logDir, file);
        fs.unlinkSync(filePath);
        deletedCount++;
        console.safe(`[日志清理] 已删除过期日志文件: ${file} (日期: ${dateStr})`);
      }
    }
    
    if (deletedCount > 0) {
      console.safe(`[日志清理] 清理完成，共删除 ${deletedCount} 个过期日志文件`);
    } else {
      console.safe(`[日志清理] 没有需要清理的过期文件`);
    }
  } catch (err) {
    console.error('[日志清理] 清理过期日志文件失败:', err.message);
  }
}

/**
 * 启动定期日志清理任务
 * 每天凌晨2点执行一次清理
 * 在PM2集群模式下，仅在主进程（NODE_APP_INSTANCE === '0'）中执行
 */
function startLogCleanupTask() {
  // 在PM2集群模式下，只在主进程中执行清理任务
  const instanceId = process.env.NODE_APP_INSTANCE;
  if (instanceId && instanceId !== '0') {
    // 工作进程不执行清理任务
    return;
  }
  
  // 立即执行一次清理
  cleanupOldLogFiles();
  
  // 设置定时任务：每天凌晨2点执行
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(2, 0, 0, 0);
  
  // 如果今天的2点已经过了，设置为明天2点
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  const timeUntilNextRun = nextRun.getTime() - now.getTime();
  
  setTimeout(() => {
    cleanupOldLogFiles();
    // 之后每24小时执行一次
    setInterval(cleanupOldLogFiles, 24 * 60 * 60 * 1000);
  }, timeUntilNextRun);
  
  console.safe(`[日志清理] 定期清理任务已启动，下次执行时间: ${nextRun.toLocaleString('zh-CN')}`);
}

// 启动日志清理任务
startLogCleanupTask();

module.exports = logger;