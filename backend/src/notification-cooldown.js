/**
 * 通知冷却管理器
 * 用于防止同一类型的通知在短时间内重复发送
 */

// 通知冷却缓存
// 格式: Map<notificationKey, lastSendTimestamp>
const cooldownCache = new Map();

// 默认冷却配置（毫秒）
const DEFAULT_COOLDOWN = {
  'ip_blacklist_login': 15 * 60 * 1000,      // 黑名单IP登录告警：15分钟
  'user_blacklist_login': 15 * 60 * 1000,    // 黑名单用户登录告警：15分钟
  'ip_rate_limit_block': 30 * 60 * 1000,     // IP频率限制封禁：30分钟
  'ip_auto_block': 30 * 60 * 1000,           // IP自动封禁：30分钟
  'card_recharge': 0,                        // 卡密充值通知：不限制
  'daily_report': 23 * 60 * 60 * 1000,       // 每日报告：23小时
  'default': 5 * 60 * 1000,                  // 默认：5分钟
};

// 从环境变量读取冷却配置（支持自定义）
function getCooldownMs(type) {
  const envKey = `NOTIFICATION_COOLDOWN_${type.toUpperCase()}`;
  const envValue = process.env[envKey];
  
  if (envValue) {
    const parsed = parseInt(envValue);
    if (!isNaN(parsed)) {
      return parsed * 60 * 1000; // 环境变量单位：分钟
    }
  }
  
  return DEFAULT_COOLDOWN[type] ?? DEFAULT_COOLDOWN['default'];
}

/**
 * 生成通知的唯一键
 * @param {string} type - 通知类型
 * @param {string} identifier - 标识符（如IP、用户名）
 * @returns {string} 通知键
 */
function makeNotificationKey(type, identifier) {
  return `${type}:${identifier || 'global'}`;
}

/**
 * 检查通知是否应该发送
 * @param {string} type - 通知类型
 * @param {string} identifier - 标识符（如IP、用户名）
 * @returns {{shouldSend: boolean, remainingSeconds: number}}
 */
function shouldSend(type, identifier) {
  const key = makeNotificationKey(type, identifier);
  const cooldownMs = getCooldownMs(type);
  
  // 冷却时间为0表示不限制
  if (cooldownMs === 0) {
    return { shouldSend: true, remainingSeconds: 0 };
  }
  
  const lastSendTime = cooldownCache.get(key);
  const now = Date.now();
  
  if (!lastSendTime) {
    return { shouldSend: true, remainingSeconds: 0 };
  }
  
  const elapsed = now - lastSendTime;
  
  if (elapsed >= cooldownMs) {
    return { shouldSend: true, remainingSeconds: 0 };
  }
  
  const remainingMs = cooldownMs - elapsed;
  return {
    shouldSend: false,
    remainingSeconds: Math.ceil(remainingMs / 1000),
  };
}

/**
 * 记录通知已发送
 * @param {string} type - 通知类型
 * @param {string} identifier - 标识符
 */
function recordSent(type, identifier) {
  const key = makeNotificationKey(type, identifier);
  cooldownCache.set(key, Date.now());
}

/**
 * 发送带冷却检查的通知
 * @param {Object} options - 选项
 * @param {string} options.type - 通知类型
 * @param {string} options.identifier - 标识符
 * @param {Function} options.sendFn - 实际发送函数
 * @param {Object} options.notification - 通知内容
 * @returns {Promise<{sent: boolean, reason: string, remainingSeconds?: number}>}
 */
async function sendWithCooldown({ type, identifier, sendFn, notification }) {
  const { shouldSend, remainingSeconds } = shouldSend(type, identifier);
  
  if (!shouldSend) {
    const minutes = Math.ceil(remainingSeconds / 60);
    console.safe(`[通知冷却] 跳过发送 ${type} (${identifier})，冷却中，剩余 ${minutes} 分钟`);
    return {
      sent: false,
      reason: 'cooldown',
      remainingSeconds,
    };
  }
  
  try {
    const result = await sendFn(notification);
    recordSent(type, identifier);
    return {
      sent: true,
      reason: 'sent',
      result,
    };
  } catch (error) {
    return {
      sent: false,
      reason: 'error',
      error: error.message,
    };
  }
}

/**
 * 清理过期的冷却记录
 */
function cleanup() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, lastSendTime] of cooldownCache.entries()) {
    // 提取类型（key格式：type:identifier）
    const type = key.split(':')[0];
    const cooldownMs = getCooldownMs(type);
    
    // 如果冷却时间已过，删除记录
    if (now - lastSendTime > cooldownMs) {
      cooldownCache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.safe(`[通知冷却] 清理了 ${cleaned} 条过期记录`);
  }
}

/**
 * 启动定期清理任务
 */
function startCleanupTask() {
  // 每10分钟清理一次
  setInterval(cleanup, 10 * 60 * 1000);
  console.safe('[通知冷却] 清理任务已启动，每10分钟清理一次');
}

/**
 * 获取冷却状态统计
 */
function getStats() {
  return {
    totalEntries: cooldownCache.size,
    entries: Array.from(cooldownCache.entries()).map(([key, time]) => ({
      key,
      lastSendTime: new Date(time).toISOString(),
      age: Date.now() - time,
    })),
  };
}

/**
 * 手动清除某个通知的冷却
 */
function clearCooldown(type, identifier) {
  const key = makeNotificationKey(type, identifier);
  cooldownCache.delete(key);
}

/**
 * 清除所有冷却记录
 */
function clearAll() {
  cooldownCache.clear();
}

module.exports = {
  shouldSend,
  recordSent,
  sendWithCooldown,
  cleanup,
  startCleanupTask,
  getStats,
  clearCooldown,
  clearAll,
  makeNotificationKey,
  getCooldownMs,
};
