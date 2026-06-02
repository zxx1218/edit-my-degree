const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const util = require('util');

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
    return `${timestamp} [${level.toUpperCase().padEnd(7)}]: ${fullMessage}`;
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
    return `${timestamp} [${level}]: ${fullMessage}`;
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
  // info级别及以上的普通日志 - .log 文件（排除safe级别）
  new DailyRotateFile({
    level: 'info',
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m', // 10MB
    maxFiles: '3d', // 保留3天
    format: logFormat,
    silent: false,
    filter: (info) => {
      // 排除safe级别的日志，避免重复记录
      return info.level !== 'safe';
    }
  }),
  // warn级别及以上的警告日志 - .warn 文件（排除safe级别）
  new DailyRotateFile({
    level: 'warn',
    filename: path.join(logDir, 'application-%DATE%.warn'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m', // 10MB
    maxFiles: '3d', // 保留3天
    format: logFormat,
    silent: false,
    filter: (info) => {
      // 排除safe级别的日志，避免重复记录
      return info.level !== 'safe';
    }
  }),
  // error级别及以上的错误日志 - .error 文件（排除safe级别）
  new DailyRotateFile({
    level: 'error',
    filename: path.join(logDir, 'application-%DATE%.error'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m', // 10MB
    maxFiles: '3d', // 保留3天
    format: logFormat,
    silent: false,
    filter: (info) => {
      // 排除safe级别的日志，避免重复记录
      return info.level !== 'safe';
    }
  }),
  // 安全防护相关日志 - .safe 文件（仅接收safe级别）
  new DailyRotateFile({
    level: 'safe',
    filename: path.join(logDir, 'application-%DATE%.safe'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m', // 10MB
    maxFiles: '3d', // 保留3天
    format: logFormat,
    silent: false,
    filter: (info) => {
      // 只接收safe级别的日志
      return info.level === 'safe';
    }
  })
];

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
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

module.exports = logger;