const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const util = require('util');
const fs = require('fs');
const nodemailer = require('nodemailer');

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
          // 异步发送邮件通知，不阻塞日志记录
          setImmediate(() => {
            try {
              sendErrorEmail(info.message, info);
            } catch (err) {
              // 邮件发送失败不应影响日志记录
              console.error('[邮件通知] 处理错误日志时发生异常:', err.message);
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
 * 邮件发送器配置
 * 从环境变量读取SMTP配置
 */
let emailTransporter = null;

// 邮件发送频率控制
const emailRateLimit = {
  lastSentTime: 0,
  minInterval: 60000, // 最小间隔时间（毫秒），默认1分钟
  maxEmailsPerHour: 30, // 每小时最大邮件数
  sentCount: 0,
  resetTime: Date.now() + 3600000, // 1小时后重置计数
  consecutiveFailures: 0, // 连续失败次数
  circuitBreakerActive: false, // 熔断器状态
  circuitBreakerUntil: 0 // 熔断器解除时间
};

function getEmailTransporter() {
  if (emailTransporter) {
    return emailTransporter;
  }

  // 检查是否启用了邮件通知
  const enableEmailNotification = process.env.ENABLE_ERROR_EMAIL_NOTIFICATION === 'true';
  if (!enableEmailNotification) {
    console.safe('[邮件通知] 邮件通知未启用，设置 ENABLE_ERROR_EMAIL_NOTIFICATION=true 以启用');
    return null;
  }

  // 从环境变量读取SMTP配置
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.EMAIL_FROM || smtpUser;
  const toEmail = process.env.ERROR_NOTIFICATION_EMAIL || 'zxx12182022@163.com';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('[邮件通知] SMTP配置不完整，请设置 SMTP_HOST, SMTP_USER, SMTP_PASS 环境变量');
    return null;
  }

  try {
    emailTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    // 验证连接配置
    emailTransporter.verify(function(error, success) {
      if (error) {
        console.error('[邮件通知] SMTP连接验证失败:', error.message);
        emailTransporter = null;
      } else {
        console.safe(`[邮件通知] SMTP连接成功，错误日志将发送至: ${toEmail}`);
      }
    });

    return emailTransporter;
  } catch (err) {
    console.error('[邮件通知] 创建邮件发送器失败:', err.message);
    return null;
  }
}

/**
 * 发送邮件通知
 * @param {string} errorMessage - 错误消息内容
 * @param {object} metadata - 额外的元数据
 */
function sendErrorEmail(errorMessage, metadata = {}) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    return;
  }

  // 检查熔断器状态
  const now = Date.now();
  if (emailRateLimit.circuitBreakerActive && now < emailRateLimit.circuitBreakerUntil) {
    // 熔断器激活期间，只记录一次警告
    if (!emailRateLimit.circuitBreakerLogged) {
      console.safe(`[邮件通知] 熔断器已激活，暂停邮件发送直到 ${new Date(emailRateLimit.circuitBreakerUntil).toLocaleTimeString('zh-CN')}`);
      emailRateLimit.circuitBreakerLogged = true;
    }
    return;
  } else if (emailRateLimit.circuitBreakerActive && now >= emailRateLimit.circuitBreakerUntil) {
    // 熔断器解除
    emailRateLimit.circuitBreakerActive = false;
    emailRateLimit.consecutiveFailures = 0;
    emailRateLimit.circuitBreakerLogged = false;
    console.safe('[邮件通知] 熔断器已解除，恢复邮件发送');
  }

  // 检查频率限制
  // 每小时重置计数
  if (now > emailRateLimit.resetTime) {
    emailRateLimit.sentCount = 0;
    emailRateLimit.resetTime = now + 3600000;
  }
  
  // 检查是否超过每小时最大邮件数
  if (emailRateLimit.sentCount >= emailRateLimit.maxEmailsPerHour) {
    console.warn('[邮件通知] 已达到每小时最大邮件数限制，跳过发送');
    return;
  }
  
  // 检查最小间隔时间
  if (now - emailRateLimit.lastSentTime < emailRateLimit.minInterval) {
    console.safe('[邮件通知] 距离上次发送邮件时间过短，跳过发送');
    return;
  }

  const toEmail = process.env.ERROR_NOTIFICATION_EMAIL || 'zxx12182022@163.com';
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  
  // 构建邮件内容
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f44336; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">⚠️ 系统错误告警</h2>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p><strong>📅 发生时间:</strong> ${timestamp}</p>
        <p><strong>🖥️ 服务器:</strong> ${process.env.HOSTNAME || '未知'}</p>
        <p><strong>📝 错误信息:</strong></p>
        <div style="background-color: #fff; padding: 15px; border-left: 4px solid #f44336; margin: 10px 0;">
          <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 13px;">${errorMessage}</pre>
        </div>
  `;

  // 添加额外的元数据
  if (Object.keys(metadata).length > 0) {
    htmlContent += `<p><strong>📊 详细信息:</strong></p>`;
    htmlContent += `<div style="background-color: #fff; padding: 15px; border-left: 4px solid #ff9800; margin: 10px 0;">`;
    htmlContent += `<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 13px;">${JSON.stringify(metadata, null, 2)}</pre>`;
    htmlContent += `</div>`;
  }

  htmlContent += `
      </div>
      <div style="background-color: #e0e0e0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>此邮件由系统自动发送，请勿回复</p>
        <p>如有问题请联系系统管理员</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: `【错误告警】${process.env.APP_NAME || '学位管理系统'} - ${timestamp}`,
    html: htmlContent,
    // 同时提供纯文本版本
    text: `
系统错误告警

发生时间: ${timestamp}
服务器: ${process.env.HOSTNAME || '未知'}

错误信息:
${errorMessage}

${Object.keys(metadata).length > 0 ? '详细信息:\n' + JSON.stringify(metadata, null, 2) : ''}

---
此邮件由系统自动发送，请勿回复
    `
  };

  // 发送邮件（异步，不阻塞主流程）
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      // 增加连续失败计数
      emailRateLimit.consecutiveFailures++;
      
      // 如果连续失败超过5次，激活熔断器，暂停1小时
      if (emailRateLimit.consecutiveFailures >= 5) {
        emailRateLimit.circuitBreakerActive = true;
        emailRateLimit.circuitBreakerUntil = Date.now() + 3600000; // 1小时后解除
        emailRateLimit.circuitBreakerLogged = false;
        
        // 使用warn级别而不是error，避免再次触发邮件发送
        logger.warn(`[邮件通知] 连续${emailRateLimit.consecutiveFailures}次发送失败，熔断器已激活，暂停1小时。错误: ${error.message}`);
      } else {
        // 使用warn级别记录失败，避免递归触发
        logger.warn(`[邮件通知] 发送失败 (${emailRateLimit.consecutiveFailures}/5): ${error.message}`);
      }
    } else {
      // 发送成功，重置失败计数
      emailRateLimit.consecutiveFailures = 0;
      emailRateLimit.lastSentTime = Date.now();
      emailRateLimit.sentCount++;
      console.safe(`[邮件通知] 已发送错误告警邮件至 ${toEmail}, MessageID: ${info.messageId}, 本小时已发送: ${emailRateLimit.sentCount}/${emailRateLimit.maxEmailsPerHour}`);
    }
  });
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