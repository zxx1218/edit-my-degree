const dbManager = require('./db-utils');
const { logIpBlacklist } = require('./operation-logger');

// IP请求记录缓存（内存中）
// 格式: Map<ip, [timestamp1, timestamp2, ...]>
const ipRequestCache = new Map();

// 从环境变量读取配置参数，提供默认值
const CONFIG = {
  TIME_WINDOW: parseInt(process.env.IP_RATE_LIMIT_WINDOW) || 5 * 60 * 1000, // 5分钟（毫秒）
  MAX_REQUESTS: parseInt(process.env.IP_RATE_LIMIT_MAX_REQUESTS) || 10, // 最大请求次数
  BLOCK_DURATION: parseInt(process.env.IP_RATE_LIMIT_BLOCK_DURATION) || 7 * 24 * 60 * 60 * 1000, // 7天（毫秒）
  CLEANUP_INTERVAL: parseInt(process.env.IP_RATE_LIMIT_CLEANUP_INTERVAL) || 60 * 60 * 1000 // 清理间隔：1小时
};

/**
 * 从.env文件加载手动配置的IP黑名单到数据库
 */
async function loadManualBlacklist() {
  try {
    const manualBlacklistStr = process.env.IP_BLACKLIST;
    if (!manualBlacklistStr || manualBlacklistStr.trim() === '') {
      console.safe('[安全防护] 未配置手动IP黑名单');
      return;
    }

    const manualIps = manualBlacklistStr.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
    
    if (manualIps.length === 0) {
      console.safe('[安全防护] 手动IP黑名单列表为空');
      return;
    }

    console.safe(`[安全防护] 开始加载 ${manualIps.length} 个手动配置的IP黑名单...`);

    for (const ipAddress of manualIps) {
      // 检查IP是否已存在
      const [existing] = await dbManager.execute(
        'SELECT id FROM ip_blacklist WHERE ip_address = ?',
        [ipAddress]
      );

      if (existing.length === 0) {
        // IP不存在，添加到黑名单（设置为长期封禁，到TIMESTAMP类型的最大有效时间）
        // MySQL TIMESTAMP 范围: '1970-01-01 00:00:01' UTC 到 '2038-01-19 03:14:07' UTC
        const maxTimestamp = new Date('2038-01-19T03:14:07.000Z');
        await dbManager.execute(
          'INSERT INTO ip_blacklist (id, ip_address, reason, blocked_until) VALUES (UUID(), ?, ?, ?)',
          [ipAddress, '手动配置的长期黑名单', maxTimestamp]
        );
        logIpBlacklist(ipAddress, 'blocked', '手动配置的长期黑名单');
      } else {
        console.safe(`[安全防护] 手动黑名单IP已存在，跳过: ${ipAddress}`);
      }
    }

    console.safe('[安全防护] 手动IP黑名单加载完成');
  } catch (err) {
    console.safe('[安全防护] 加载手动IP黑名单失败:', err.message, { stack: err.stack });
  }
}

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
      blockDurationDays: CONFIG.BLOCK_DURATION / 1000 / 60 / 60 / 24
    });
  } catch (err) {
    console.safe('[安全防护] 添加IP到黑名单失败:', err.message, { ipAddress, reason });
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
  
  console.safe(`[安全防护] IP请求缓存清理完成，当前缓存大小: ${ipRequestCache.size}`);
}

/**
 * 启动定期清理任务并加载手动黑名单
 */
async function startCleanupTask() {
  // 首先加载手动配置的黑名单
  await loadManualBlacklist();
  
  // 然后启动定期清理任务
  setInterval(cleanupCache, CONFIG.CLEANUP_INTERVAL);
  console.safe(`[安全防护] IP请求缓存清理任务已启动，每${CONFIG.CLEANUP_INTERVAL / 1000 / 60}分钟清理一次`);
  console.safe(`[安全防护] IP频率检测配置: 时间窗口=${CONFIG.TIME_WINDOW/1000}秒, 最大请求=${CONFIG.MAX_REQUESTS}次, 封禁时长=${CONFIG.BLOCK_DURATION/1000/60/60/24}天`);
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
  recordAndCheckIp,
  startCleanupTask,
  getIpStats,
  loadManualBlacklist, // 导出手动黑名单加载函数，供外部调用
  logIpBlacklist // 导出IP黑名单日志记录函数，供外部使用
};
