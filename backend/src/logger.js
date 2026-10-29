const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const util = require('util');
const fs = require('fs');
const barkNotifier = require('./bark-notifier');
const { getSystemErrorAlert } = require('./notifications/templates/bark/security');

// 创建日志目录
const logDir = path.join(__dirname, '..', 'logs');

// 获取当前节点标识
const nodeId = process.env.NODE_APP_INSTANCE !== undefined ? `W${process.env.NODE_APP_INSTANCE}` : 'S';

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
    return `${timestamp} [${nodeId}] [${level.toUpperCase()}]: ${fullMessage}`;
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
    return `${timestamp} [${nodeId}] [${level.toUpperCase()}]: ${fullMessage}`;
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
    filename: path.join(logDir, 'editMyDegree-%DATE%.log'),
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
    filename: path.join(logDir, 'editMyDegree-%DATE%.warn'),
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
    filename: path.join(logDir, 'editMyDegree-%DATE%.error'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m', // 10MB
    maxFiles: '3d', // 保留3天
    format: winston.format.combine(
      winston.format((info) => {
        // 只记录 error 级别
        if (info.level === 'error') {
          // 异步发送Bark通知，不阻塞日志记录
          setImmediate(() => {
            try {
              sendErrorBarkNotification(info.message, info);
            } catch (err) {
              // Bark通知失败不应影响日志记录
              const exceptionLogger = winston.createLogger({
                level: 'error',
                transports: [
                  new winston.transports.File({
                    filename: path.join(logDir, 'bark-exception.log'),
                    maxsize: 5242880,
                    maxFiles: 2
                  })
                ]
              });
              exceptionLogger.error(`[Bark通知] 处理错误日志时发生异常: ${err.message}`);
            }
          });
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
    filename: path.join(logDir, 'editMyDegree-%DATE%.safe'),
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

// 防止Bark通知递归调用的全局标志
let isSendingBarkNotification = false;

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
  try {
    originalWarn.apply(console, args);
  } catch (err) {
    // 忽略 EIO 错误（通常发生在进程关闭时 stdout/stderr 流已关闭）
    if (err.code !== 'EIO') {
      throw err;
    }
  }
};

console.error = (...args) => {
  logger.error(formatArgs(args));
  try {
    originalError.apply(console, args);
  } catch (err) {
    // 忽略 EIO 错误（通常发生在进程关闭时 stdout/stderr 流已关闭）
    // 这种情况下日志已经记录到文件，不需要再输出到控制台
    if (err.code !== 'EIO') {
      throw err;
    }
  }
};

console.safe = (...args) => {
  logger.safe(formatArgs(args));
};

/**
 * Bark通知频率控制
 */
const barkRateLimit = {
  lastSentTime: 0,
  minInterval: 60000, // 最小间隔时间（毫秒），默认1分钟
  maxNotificationsPerHour: 30, // 每小时最大通知数
  sentCount: 0,
  resetTime: Date.now() + 3600000, // 1小时后重置计数
  consecutiveFailures: 0, // 连续失败次数
  circuitBreakerActive: false, // 熔断器状态
  circuitBreakerUntil: 0, // 熔断器解除时间
  circuitBreakerLogged: false
};

/**
 * 安全记录通知历史（不抛出异常）
 */
function safeRecordNotification(params) {
  try {
    const { recordNotificationHistory } = require('./notification-history');
    recordNotificationHistory(params);
  } catch (_) {}
}

/**
 * 发送Bark错误通知
 * @param {string} errorMessage - 错误消息内容
 * @param {object} metadata - 额外的元数据
 */
async function sendErrorBarkNotification(errorMessage, metadata = {}) {
  // 防止递归调用：如果正在发送通知，直接返回
  if (isSendingBarkNotification) {
    const bypassLogger = winston.createLogger({
      level: 'warn',
      transports: [
        new winston.transports.File({
          filename: path.join(logDir, 'bark-notification-blocked.log'),
          maxsize: 5242880,
          maxFiles: 1
        })
      ]
    });
    bypassLogger.warn(`[Bark通知] 检测到递归调用尝试，已阻止。原错误: ${errorMessage.substring(0, 200)}`);
    return;
  }

  // 检查Bark是否启用
  if (!barkNotifier.isEnabled()) {
    safeRecordNotification({
      channel: 'bark',
      title: '系统错误告警',
      body: errorMessage.substring(0, 500),
      group: '系统错误',
      level: 'critical',
      status: 'failed',
      errorMessage: 'Bark通知功能未启用'
    });
    return;
  }

  // 检查熔断器状态
  const now = Date.now();
  if (barkRateLimit.circuitBreakerActive && now < barkRateLimit.circuitBreakerUntil) {
    if (!barkRateLimit.circuitBreakerLogged) {
      const bypassLogger = winston.createLogger({
        level: 'info',
        transports: [
          new winston.transports.File({
            filename: path.join(logDir, 'editMyDegree-' + new Date().toISOString().split('T')[0] + '.safe'),
            maxsize: 10485760,
            maxFiles: 3
          })
        ]
      });
      bypassLogger.info(`[Bark通知] 熔断器已激活，暂停通知发送直到 ${new Date(barkRateLimit.circuitBreakerUntil).toLocaleTimeString('zh-CN')}`);
      barkRateLimit.circuitBreakerLogged = true;
    }
    safeRecordNotification({
      channel: 'bark',
      title: '系统错误告警',
      body: errorMessage.substring(0, 500),
      group: '系统错误',
      level: 'critical',
      status: 'failed',
      errorMessage: '熔断器已激活，通知发送暂停'
    });
    return;
  } else if (barkRateLimit.circuitBreakerActive && now >= barkRateLimit.circuitBreakerUntil) {
    // 熔断器解除
    barkRateLimit.circuitBreakerActive = false;
    barkRateLimit.consecutiveFailures = 0;
    barkRateLimit.circuitBreakerLogged = false;
    
    const bypassLogger = winston.createLogger({
      level: 'info',
      transports: [
        new winston.transports.File({
          filename: path.join(logDir, 'editMyDegree-' + new Date().toISOString().split('T')[0] + '.safe'),
          maxsize: 10485760,
          maxFiles: 3
        })
      ]
    });
    bypassLogger.info('[Bark通知] 熔断器已解除，恢复通知发送');
  }

  // 每小时重置计数
  if (now > barkRateLimit.resetTime) {
    barkRateLimit.sentCount = 0;
    barkRateLimit.resetTime = now + 3600000;
  }
  
  // 检查是否超过每小时最大通知数
  if (barkRateLimit.sentCount >= barkRateLimit.maxNotificationsPerHour) {
    const bypassLogger = winston.createLogger({
      level: 'warn',
      transports: [
        new winston.transports.File({
          filename: path.join(logDir, 'editMyDegree-' + new Date().toISOString().split('T')[0] + '.warn'),
          maxsize: 10485760,
          maxFiles: 3
        })
      ]
    });
    bypassLogger.warn('[Bark通知] 已达到每小时最大通知数限制，跳过发送');
    safeRecordNotification({
      channel: 'bark',
      title: '系统错误告警',
      body: errorMessage.substring(0, 500),
      group: '系统错误',
      level: 'critical',
      status: 'failed',
      errorMessage: '已达到每小时最大通知数限制'
    });
    return;
  }
  
  // 检查最小间隔时间
  if (now - barkRateLimit.lastSentTime < barkRateLimit.minInterval) {
    const bypassLogger = winston.createLogger({
      level: 'info',
      transports: [
        new winston.transports.File({
          filename: path.join(logDir, 'editMyDegree-' + new Date().toISOString().split('T')[0] + '.safe'),
          maxsize: 10485760,
          maxFiles: 3
        })
      ]
    });
    bypassLogger.info('[Bark通知] 距离上次发送通知时间过短，跳过发送');
    safeRecordNotification({
      channel: 'bark',
      title: '系统错误告警',
      body: errorMessage.substring(0, 500),
      group: '系统错误',
      level: 'critical',
      status: 'failed',
      errorMessage: '发送间隔过短，已跳过'
    });
    return;
  }

  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  
  // 使用Bark模板生成通知内容
  const notification = getSystemErrorAlert({ errorMessage, timestamp });
  
  // 设置发送标志
  isSendingBarkNotification = true;

  try {
    // 发送Bark通知
    const result = await barkNotifier.sendNotification(notification);
    
    if (result.success) {
      // 发送成功，重置失败计数
      barkRateLimit.consecutiveFailures = 0;
      barkRateLimit.lastSentTime = Date.now();
      barkRateLimit.sentCount++;
      
      const successLogger = winston.createLogger({
        level: 'info',
        transports: [
          new winston.transports.File({
            filename: path.join(logDir, 'editMyDegree-' + new Date().toISOString().split('T')[0] + '.safe'),
            maxsize: 10485760,
            maxFiles: 3
          })
        ]
      });
      successLogger.info(`[Bark通知] 已发送错误告警通知，本小时已发送: ${barkRateLimit.sentCount}/${barkRateLimit.maxNotificationsPerHour}`);
      
      safeRecordNotification({
        channel: 'bark',
        title: notification.title,
        body: notification.body,
        group: '系统错误',
        level: 'critical',
        status: 'success',
        metadata: result.data
      });
    } else {
      // 发送失败，增加连续失败计数
      barkRateLimit.consecutiveFailures++;
      
      if (barkRateLimit.consecutiveFailures >= 5) {
        barkRateLimit.circuitBreakerActive = true;
        barkRateLimit.circuitBreakerUntil = Date.now() + 3600000;
        barkRateLimit.circuitBreakerLogged = false;
        
        const failureLogger = winston.createLogger({
          level: 'warn',
          transports: [
            new winston.transports.File({
              filename: path.join(logDir, 'bark-failure.log'),
              maxsize: 5242880,
              maxFiles: 2
            })
          ]
        });
        failureLogger.warn(`[Bark通知] 连续${barkRateLimit.consecutiveFailures}次发送失败，熔断器已激活，暂停1小时。错误: ${result.error}`);
      } else {
        const warnLogger = winston.createLogger({
          level: 'warn',
          transports: [
            new winston.transports.File({
              filename: path.join(logDir, 'bark-send-warnings.log'),
              maxsize: 5242880,
              maxFiles: 2
            })
          ]
        });
        warnLogger.warn(`[Bark通知] 发送失败 (${barkRateLimit.consecutiveFailures}/5): ${result.error}`);
      }
      
      safeRecordNotification({
        channel: 'bark',
        title: notification.title,
        body: notification.body,
        group: '系统错误',
        level: 'critical',
        status: 'failed',
        errorMessage: result.error
      });
    }
  } catch (error) {
    // 异常处理
    barkRateLimit.consecutiveFailures++;
    
    if (barkRateLimit.consecutiveFailures >= 5) {
      barkRateLimit.circuitBreakerActive = true;
      barkRateLimit.circuitBreakerUntil = Date.now() + 3600000;
      barkRateLimit.circuitBreakerLogged = false;
      
      const failureLogger = winston.createLogger({
        level: 'warn',
        transports: [
          new winston.transports.File({
            filename: path.join(logDir, 'bark-failure.log'),
            maxsize: 5242880,
            maxFiles: 2
          })
        ]
      });
      failureLogger.warn(`[Bark通知] 连续${barkRateLimit.consecutiveFailures}次发送异常，熔断器已激活，暂停1小时。错误: ${error.message}`);
    }
    
    safeRecordNotification({
      channel: 'bark',
      title: notification.title,
      body: notification.body,
      group: '系统错误',
      level: 'critical',
      status: 'failed',
      errorMessage: error.message
    });
  } finally {
    // 重置发送标志
    isSendingBarkNotification = false;
  }
}

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
      // 匹配日志文件名格式: editMyDegree-YYYY-MM-DD.log/warn/error/safe
      const match = file.match(/^editMyDegree-(\d{4}-\d{2}-\d{2})\.(log|warn|error|safe)$/);
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
