const dbManager = require('./db-utils');
const { logIpBlacklist } = require('./operation-logger');
const barkNotifier = require('./bark-notifier');
const notificationCooldown = require('./notification-cooldown');
const { getIpRateLimitBlockNotification, getIpAutoBlockNotification } = require('./notifications/templates');

// IP请求记录缓存（内存中）
// 格式: Map<ip, [timestamp1, timestamp2, ...]>
const ipRequestCache = new Map();

// 自动封禁配置
const AUTO_BLOCK_CONFIG = {
  DURATION: parseInt(process.env.IP_AUTO_BLOCK_DURATION) || 60 * 60 * 1000 // 默认1小时（毫秒）
};

// 从环境变量读取配置参数，提供默认值
const CONFIG = {
  TIME_WINDOW: parseInt(process.env.IP_RATE_LIMIT_WINDOW) || 5 * 60 * 1000, // 5分钟（毫秒）
  MAX_REQUESTS: parseInt(process.env.IP_RATE_LIMIT_MAX_REQUESTS) || 10, // 最大请求次数
  BLOCK_DURATION: parseInt(process.env.IP_RATE_LIMIT_BLOCK_DURATION) || 15 * 60 * 1000, // 15分钟（毫秒）
  CLEANUP_INTERVAL: parseInt(process.env.IP_RATE_LIMIT_CLEANUP_INTERVAL) || 60 * 60 * 1000 // 清理间隔：1小时
};


/**
 * 检查IP是否在黑名单中
 * @param {string} ipAddress - IP地址
 * @returns {Promise<boolean>} 是否在黑名单中
 */
async function isIpBlacklisted(ipAddress) {
  try {
    const now = new Date();
    const [rows] = await dbManager.execute(
      'SELECT id, blocked_until FROM ip_blacklist WHERE ip_address = ? AND blocked_until > ?',
      [ipAddress, now]
    );
    
    return rows.length > 0;
  } catch (err) {
    console.safe('[安全防护] 检查IP黑名单失败:', err.message, { ipAddress });
    return false;
  }
}

/**
 * 将IP加入黑名单（自动封禁）
 * @param {string} ipAddress - IP地址
 * @param {string} reason - 封禁原因
 */
async function addToBlacklist(ipAddress, reason) {
  try {
    let blockedUntil = new Date(Date.now() + CONFIG.BLOCK_DURATION);
    
    // MySQL TIMESTAMP 最大值: '2038-01-19T03:14:07.000Z'
    const maxTimestamp = new Date('2038-01-19T03:14:07.000Z');
    
    // 确保不超过 TIMESTAMP 类型的最大有效时间
    if (blockedUntil > maxTimestamp) {
      blockedUntil = maxTimestamp;
      console.safe(`[安全防护] 封禁时间超过TIMESTAMP最大值，已调整为: ${maxTimestamp.toISOString()}`);
    }
    
    // 先删除该IP的旧记录（如果存在）
    await dbManager.execute(
      'DELETE FROM ip_blacklist WHERE ip_address = ?',
      [ipAddress]
    );
    
    // 插入新记录
    await dbManager.execute(
      'INSERT INTO ip_blacklist (id, ip_address, reason, blocked_until) VALUES (UUID(), ?, ?, ?)',
      [ipAddress, reason, blockedUntil]
    );
    
    logIpBlacklist(ipAddress, 'blocked', reason, { 
      blockedUntil: blockedUntil.toISOString(),
      blockDurationMinutes: CONFIG.BLOCK_DURATION / 1000 / 60
    });
    
    // 使用通知冷却机制发送IP频率限制封禁Bark通知
    const timestamp = new Date().toLocaleString('zh-CN');
    const notification = getIpRateLimitBlockNotification({
      ip: ipAddress,
      requestCount: CONFIG.MAX_REQUESTS,
      timeWindow: Math.floor(CONFIG.TIME_WINDOW / 1000),
      maxRequests: CONFIG.MAX_REQUESTS,
      blockDuration: Math.floor(CONFIG.BLOCK_DURATION / 1000 / 60),
      timestamp
    });
    
    setImmediate(async () => {
      const result = await notificationCooldown.sendWithCooldown({
        type: 'ip_rate_limit_block',
        identifier: ipAddress,
        sendFn: (n) => barkNotifier.sendNotification(n),
        notification,
      });
      
      if (result.sent) {
        console.safe('[安全防护] IP封禁告警通知发送成功');
      } else if (result.reason === 'cooldown') {
        console.safe(`[安全防护] IP封禁告警通知跳过（冷却中）: ${ipAddress}`);
      }
    });
  } catch (err) {
    console.safe('[安全防护] 添加IP到黑名单失败:', err.message, { ipAddress, reason });
  }
}

/**
 * 因触发错误/警告而自动将IP加入黑名单（封禁1小时）
 * @param {string} ipAddress - IP地址
 * @param {string} reason - 触发原因（错误/警告描述）
 * @param {string} source - 触发来源模块
 */
async function autoBlockIp(ipAddress, reason, source = '未知模块') {
  if (!ipAddress || ipAddress === 'unknown') {
    return;
  }
  
  try {
    // 检查是否已在黑名单中
    const alreadyBlocked = await isIpBlacklisted(ipAddress);
    if (alreadyBlocked) {
      return;
    }
    
    const blockedUntil = new Date(Date.now() + AUTO_BLOCK_CONFIG.DURATION);
    const blockDurationMinutes = AUTO_BLOCK_CONFIG.DURATION / 1000 / 60;
    
    // 删除旧记录
    await dbManager.execute(
      'DELETE FROM ip_blacklist WHERE ip_address = ?',
      [ipAddress]
    );
    
    // 插入新记录
    await dbManager.execute(
      'INSERT INTO ip_blacklist (id, ip_address, reason, blocked_until) VALUES (UUID(), ?, ?, ?)',
      [ipAddress, `触发${source}模块的错误/警告: ${reason}`, blockedUntil]
    );
    
    logIpBlacklist(ipAddress, 'auto-blocked', reason, {
      source,
      blockedUntil: blockedUntil.toISOString(),
      blockDurationMinutes
    });
    
    console.safe(`[安全防护] IP自动封禁: ${ipAddress}, 原因: ${reason}, 来源: ${source}, 封禁${blockDurationMinutes}分钟`);
    
    // 使用通知冷却机制发送Bark通知
    const timestamp = new Date().toLocaleString('zh-CN');
    const notification = getIpAutoBlockNotification({
      ip: ipAddress,
      reason,
      source,
      blockDuration: blockDurationMinutes,
      blockedUntil: blockedUntil.toISOString(),
      timestamp
    });
    
    setImmediate(async () => {
      const result = await notificationCooldown.sendWithCooldown({
        type: 'ip_auto_block',
        identifier: ipAddress,
        sendFn: (n) => barkNotifier.sendNotification(n),
        notification,
      });
      
      if (result.sent) {
        console.safe('[安全防护] IP自动封禁通知发送成功');
      } else if (result.reason === 'cooldown') {
        console.safe(`[安全防护] IP自动封禁通知跳过（冷却中）: ${ipAddress}`);
      }
    });
  } catch (err) {
    console.safe('[安全防护] IP自动封禁失败:', err.message, { ipAddress, reason, source });
  }
}

/**
 * 记录IP请求并检查是否超过频率限制
 * @param {string} ipAddress - IP地址
 * @returns {Promise<{isBlocked: boolean, shouldBlock: boolean}>} 是否被封禁和是否应该封禁
 */
async function recordAndCheckIp(ipAddress) {
  const now = Date.now();
  
  // 获取该IP的请求记录
  if (!ipRequestCache.has(ipAddress)) {
    ipRequestCache.set(ipAddress, []);
  }
  
  const timestamps = ipRequestCache.get(ipAddress);
  
  // 添加当前请求时间戳
  timestamps.push(now);
  
  // 清理过期记录（只保留时间窗口内的记录）
  const windowStart = now - CONFIG.TIME_WINDOW;
  const recentRequests = timestamps.filter(ts => ts > windowStart);
  
  // 更新缓存
  ipRequestCache.set(ipAddress, recentRequests);
  
  // 检查是否超过阈值
  const requestCount = recentRequests.length;
  const shouldBlock = requestCount > CONFIG.MAX_REQUESTS;
  
  if (shouldBlock) {
    console.safe(`[安全防护] 检测到IP频繁请求: ${ipAddress}, 在${CONFIG.TIME_WINDOW / 1000}秒内请求${requestCount}次，超过阈值${CONFIG.MAX_REQUESTS}次`);
    await addToBlacklist(ipAddress, `在${CONFIG.TIME_WINDOW / 1000}秒内请求${requestCount}次，超过阈值${CONFIG.MAX_REQUESTS}次`);
    
    // 清空该IP的缓存
    ipRequestCache.delete(ipAddress);
  }
  
  return {
    isBlocked: false, // 这个函数不检查黑名单状态，由调用方检查
    shouldBlock
  };
}

/**
 * 清理过期的缓存数据
 */
function cleanupCache() {
  const now = Date.now();
  const windowStart = now - CONFIG.TIME_WINDOW;
  
  for (const [ip, timestamps] of ipRequestCache.entries()) {
    const recentRequests = timestamps.filter(ts => ts > windowStart);
    
    if (recentRequests.length === 0) {
      ipRequestCache.delete(ip);
    } else {
      ipRequestCache.set(ip, recentRequests);
    }
  }
  if(ipRequestCache.size > 0) {
    console.safe(`[安全防护] IP请求缓存清理完成，当前缓存大小: ${ipRequestCache.size}`);
  }
}

/**
 * 启动定期清理任务
 */
async function startCleanupTask() {
  // 启动定期清理任务
  setInterval(cleanupCache, CONFIG.CLEANUP_INTERVAL);
  console.safe(`[安全防护] IP请求缓存清理任务已启动，每${CONFIG.CLEANUP_INTERVAL / 1000 / 60}分钟清理一次`);
  console.safe(`[安全防护] IP频率检测配置: 时间窗口=${CONFIG.TIME_WINDOW/1000}秒, 最大请求=${CONFIG.MAX_REQUESTS}次, 封禁时长=${CONFIG.BLOCK_DURATION/1000/60}分钟`);
}

/**
 * 获取IP请求统计信息
 * @param {string} ipAddress - IP地址
 * @returns {Object} 统计信息
 */
function getIpStats(ipAddress) {
  if (!ipRequestCache.has(ipAddress)) {
    return { count: 0, timeWindow: CONFIG.TIME_WINDOW / 1000 };
  }
  
  const now = Date.now();
  const windowStart = now - CONFIG.TIME_WINDOW;
  const timestamps = ipRequestCache.get(ipAddress);
  const recentRequests = timestamps.filter(ts => ts > windowStart);
  
  return {
    count: recentRequests.length,
    timeWindow: CONFIG.TIME_WINDOW / 1000,
    maxRequests: CONFIG.MAX_REQUESTS
  };
}

module.exports = {
  isIpBlacklisted,
  addToBlacklist,
  autoBlockIp,
  recordAndCheckIp,
  startCleanupTask,
  getIpStats,
  logIpBlacklist
};
