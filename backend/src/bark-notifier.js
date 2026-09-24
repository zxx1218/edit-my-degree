const axios = require('axios');
const { recordNotificationHistory } = require('./notification-history');

/**
 * Bark 通知推送模块
 * 用于在用户充值成功后向管理员发送通知
 */

// 配置变量
let barkConfig = {
  enabled: false,
  pushUrl: '',
  deviceKeys: [],  // 改为数组，支持多个设备密钥
  level: 'active',
  sound: 'minuet',
  group: '学位管理系统充值通知',
  icon: '',
  url: ''
};

/**
 * 解析设备密钥配置
 * 支持单个密钥或多个密钥（逗号分隔）
 * @param {string} configValue - 配置值
 * @returns {Array<string>} 设备密钥数组
 */
function parseDeviceKeys(configValue) {
  if (!configValue || typeof configValue !== 'string') {
    return [];
  }
  
  // 去除空格并按逗号分割
  const keys = configValue.split(',')
    .map(key => key.trim())
    .filter(key => key.length > 0);
  
  return keys;
}

/**
 * 初始化 Bark 配置
 * 从环境变量加载配置
 */
function initialize() {
  try {
    // 检查是否启用
    const enabled = process.env.ENABLE_BARK_NOTIFICATION;
    barkConfig.enabled = enabled === 'true';
    
    if (!barkConfig.enabled) {
      console.info('[Bark通知] Bark通知功能已禁用');
      return;
    }
    
    // 加载配置
    barkConfig.pushUrl = process.env.BARK_PUSH_URL || 'https://api.day.app/push';
    
    // 解析设备密钥（支持单个或多个，逗号分隔）
    // 优先读取 BARK_DEVICE_KEYS（复数形式），兼容旧的 BARK_DEVICE_KEY
    const deviceKeyConfig = process.env.BARK_DEVICE_KEYS || process.env.BARK_DEVICE_KEY || '';
    barkConfig.deviceKeys = parseDeviceKeys(deviceKeyConfig);
    
    barkConfig.level = process.env.BARK_LEVEL || 'active';
    barkConfig.sound = process.env.BARK_SOUND || 'minuet';
    barkConfig.group = process.env.BARK_GROUP || '学位管理系统充值通知';
    barkConfig.icon = process.env.BARK_ICON || '';
    barkConfig.url = process.env.BARK_URL || '';
    
    // 验证必要配置
    if (barkConfig.deviceKeys.length === 0) {
      console.warn('[Bark通知] ⚠️ BARK_DEVICE_KEYS 未配置或为空，Bark通知将无法正常工作');
      console.warn('[Bark通知] 💡 提示：如需配置多个设备，请用逗号分隔，例如：key1,key2,key3');
      barkConfig.enabled = false;
      return;
    }
    
    console.info('[Bark通知] Bark通知功能已启用');
    console.info(`[Bark通知] 推送URL: ${barkConfig.pushUrl}`);
    console.info(`[Bark通知] 设备数量: ${barkConfig.deviceKeys.length}`);
    barkConfig.deviceKeys.forEach((key, index) => {
      console.info(`[Bark通知]   设备${index + 1}: ${key.substring(0, 8)}...`);
    });
    console.info(`[Bark通知] 推送级别: ${barkConfig.level}`);
    console.info(`[Bark通知] 铃声: ${barkConfig.sound}`);
    console.info(`[Bark通知] 消息分组: ${barkConfig.group}`);
    
  } catch (error) {
    console.error('[Bark通知] 初始化失败:', error.message);
    barkConfig.enabled = false;
  }
}

/**
 * 发送 Bark 通知
 * @param {Object} options - 通知选项
 * @param {string} options.title - 推送标题
 * @param {string} options.body - 推送内容
 * @param {string} [options.subtitle] - 副标题（可选）
 * @param {string} [options.level] - 推送级别（覆盖默认配置）
 * @param {string} [options.sound] - 铃声（覆盖默认配置）
 * @param {string} [options.group] - 分组（覆盖默认配置）
 * @param {string} [options.icon] - 图标URL（覆盖默认配置）
 * @param {string} [options.url] - 跳转URL（覆盖默认配置）
 * @returns {Promise<Object>} 推送结果
 */
async function sendNotification(options) {
  if (!barkConfig.enabled) {
    return { success: false, error: 'Bark通知功能未启用' };
  }
  
  try {
    const {
      title,
      body,
      subtitle,
      level = barkConfig.level,
      sound = barkConfig.sound,
      group = barkConfig.group,
      icon = barkConfig.icon,
      url = barkConfig.url
    } = options;
    
    // 构建请求体
    const requestBody = {
      title: title,
      body: body,
      level: level,
      sound: sound,
      device_keys: barkConfig.deviceKeys,  // 使用数组
      group: group
    };
    
    // 添加可选参数
    if (subtitle) {
      requestBody.subtitle = subtitle;
    }
    if (icon) {
      requestBody.icon = icon;
    }
    if (url) {
      requestBody.url = url;
    }
    
    console.info(`[Bark通知] 准备发送通知: ${title}`);
    
    // 发送 POST 请求
    const response = await axios.post(barkConfig.pushUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      timeout: 5000 // 5秒超时
    });
    
    console.info('[Bark通知] 通知发送成功:', response.data);
    
    // 记录通知历史
    await recordNotificationHistory({
      channel: 'bark',
      title,
      body,
      recipient: barkConfig.deviceKeys.join(', '),
      group,
      level,
      sound,
      status: 'success',
      metadata: { subtitle, icon, url }
    });
    
    return {
      success: true,
      data: response.data
    };
    
  } catch (error) {
    console.error('[Bark通知] 发送失败:', error.message);
    
    if (error.response) {
      console.error('[Bark通知] 响应状态:', error.response.status);
      console.error('[Bark通知] 响应数据:', error.response.data);
    }
    
    // 记录失败的通知历史
    const {
      title,
      body,
      level = barkConfig.level,
      sound = barkConfig.sound,
      group = barkConfig.group
    } = options;
    
    await recordNotificationHistory({
      channel: 'bark',
      title: title || '未知通知',
      body: body || '',
      recipient: barkConfig.deviceKeys.join(', '),
      group,
      level,
      sound,
      status: 'failed',
      errorMessage: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 发送充值成功通知
 * @param {Object} userData - 用户数据
 * @param {string} userData.username - 用户名
 * @param {string} userData.cardType - 卡密类型 (login/pdf)
 * @param {number} userData.cardValues - 充值数量
 * @param {number} userData.remainingLogins - 剩余登录次数
 * @param {number} userData.remainingPdfLimit - 剩余PDF积分
 * @returns {Promise<Object>} 推送结果
 */
async function sendRechargeNotification(userData) {
  if (!barkConfig.enabled) {
    return { success: false, error: 'Bark通知功能未启用' };
  }
  
  try {
    const { username, cardType, cardValues, remainingLogins, remainingPdfLimit } = userData;
    
    // 根据充值类型构建不同的通知内容
    let title, body;
    
    if (cardType === 'login') {
      title = '💳 登录次数充值成功';
      body = `用户 ${username} 成功充值 ${cardValues} 次登录次数\n当前剩余: ${remainingLogins} 次`;
    } else if (cardType === 'pdf') {
      title = '📑 PDF积分充值成功';
      body = `用户 ${username} 成功充值 ${cardValues} PDF积分\n当前剩余: ${remainingPdfLimit} 分`;
    } else {
      title = '💰 充值成功';
      body = `用户 ${username} 成功充值 ${cardValues} ${cardType}`;
    }
    
    // 发送通知
    const result = await sendNotification({
      title,
      body,
      subtitle: `充值时间: ${new Date().toLocaleString('zh-CN')}`,
      level: 'active',
      sound: 'minuet'
    });
    
    return result;
    
  } catch (error) {
    console.error('[Bark通知] 充值通知发送失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 检查 Bark 通知是否启用
 * @returns {boolean}
 */
function isEnabled() {
  return barkConfig.enabled;
}

// 导出模块
module.exports = {
  initialize,
  sendNotification,
  sendRechargeNotification,
  isEnabled
};
