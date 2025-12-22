const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const util = require('util');

// 创建日志目录
const logDir = path.join(__dirname, '..', 'logs');

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// 创建传输器
const transports = [
  // 按日期轮转的文件传输器，保留3天日志
  new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m', // 10MB
    maxFiles: '3d', // 保留3天
    format: logFormat
  })
];

// 创建logger实例
const logger = winston.createLogger({
  level: 'info',
  transports
});

// 格式化参数，处理对象和数组等复杂类型
function formatArgs(args) {
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      return util.inspect(arg, { depth: null, colors: false });
    }
    return arg;
  }).join(' ');
}

// 重写console方法，使其同时输出到日志文件
const originalLog = console.log;
const originalInfo = console.info;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
  logger.info(formatArgs(args));
  originalLog.apply(console, args);
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

module.exports = logger;