const jwt = require('jsonwebtoken');
const axios = require('axios');
const { recordNotificationHistory } = require('./notification-history');
const barkNotifier = require('./bark-notifier');

function initialize(db, jwtSecret) {
  // 设置数据库连接供 barkNotifier 使用
  barkNotifier.setDatabase(db);
  
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: '未提供访问令牌' });
      }
      const token = authHeader.substring(7);

      let decoded;
      try {
        decoded = jwt.verify(token, jwtSecret || process.env.JWT_SECRET || 'default_jwt_secret');
      } catch (err) {
        return res.status(401).json({ success: false, error: '无效的访问令牌' });
      }

      const [admins] = await db.execute(
        'SELECT username FROM admins WHERE id = ?', [decoded.id]
      );
      if (admins.length === 0) {
        return res.status(403).json({ success: false, error: '权限不足' });
      }

      const { action } = req.body;

      if (action === 'getConfig') {
        return await handleGetConfig(db, req, res);
      } else if (action === 'sendTest') {
        return await handleSendTest(db, req, res);
      } else if (action === 'sendCustom') {
        return await handleSendCustom(db, req, res);
      } else if (action === 'getBarkHistory') {
        return await handleGetBarkHistory(db, req, res);
      } else if (action === 'updateConfig') {
        return await handleUpdateConfig(db, req, res);
      } else {
        return res.status(400).json({ success: false, error: '无效的操作类型' });
      }

    } catch (err) {
      console.error('[Bark管理] 错误:', err);
      return res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  };
}

async function handleGetConfig(db, req, res) {
  // 从数据库读取动态配置
  const dynamicConfig = await barkNotifier.getDynamicConfig();
  
  // 动态配置优先，回退到环境变量
  const enabled = dynamicConfig.bark_enabled !== undefined 
    ? dynamicConfig.bark_enabled === 'true'
    : process.env.ENABLE_BARK_NOTIFICATION === 'true';
  
  const sound = dynamicConfig.bark_sound || process.env.BARK_SOUND || 'paymentsuccess';
  
  const dailyReportEnabled = dynamicConfig.bark_daily_report_enabled !== undefined
    ? dynamicConfig.bark_daily_report_enabled === 'true'
    : true;
  
  const pushUrl = process.env.BARK_PUSH_URL || 'https://api.day.app/push';
  const deviceKeysRaw = process.env.BARK_DEVICE_KEYS || process.env.BARK_DEVICE_KEY || '';
  const deviceKeys = deviceKeysRaw.split(',').map(k => k.trim()).filter(k => k.length > 0);

  const maskedKeys = deviceKeys.map(k =>
    k.length > 8 ? k.substring(0, 4) + '****' + k.substring(k.length - 4) : '****'
  );

  res.json({
    success: true,
    config: {
      enabled,
      pushUrl,
      deviceKeys: maskedKeys,
      deviceKeysCount: deviceKeys.length,
      level: process.env.BARK_LEVEL || 'active',
      sound,
      group: process.env.BARK_GROUP || '学位管理系统充值通知',
      icon: process.env.BARK_ICON || '',
      url: process.env.BARK_URL || '',
      dailyReportEnabled,
    }
  });
}

async function handleSendTest(db, req, res) {
  const { title, body, targetDeviceKey, level, sound, group } = req.body;

  if (!title || !body) {
    return res.status(400).json({ success: false, error: '标题和内容不能为空' });
  }

  const pushUrl = process.env.BARK_PUSH_URL || 'https://api.day.app/push';
  const deviceKeys = targetDeviceKey
    ? [targetDeviceKey]
    : (process.env.BARK_DEVICE_KEYS || process.env.BARK_DEVICE_KEY || '').split(',').map(k => k.trim()).filter(k => k.length > 0);

  if (deviceKeys.length === 0) {
    return res.status(400).json({ success: false, error: '没有可用的设备密钥' });
  }

  try {
    const response = await axios.post(pushUrl, {
      title,
      body,
      level: level || process.env.BARK_LEVEL || 'active',
      sound: sound || process.env.BARK_SOUND || 'paymentsuccess',
      device_keys: deviceKeys,
      group: group || '测试推送',
    }, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      timeout: 5000,
    });

    await recordNotificationHistory({
      channel: 'bark',
      title,
      body,
      recipient: deviceKeys.join(', '),
      group: group || '测试推送',
      level: level || process.env.BARK_LEVEL || 'active',
      sound: sound || process.env.BARK_SOUND || 'paymentsuccess',
      status: 'success',
      metadata: { type: 'test' },
    });

    res.json({ success: true, data: response.data });
  } catch (err) {
    await recordNotificationHistory({
      channel: 'bark',
      title,
      body,
      recipient: deviceKeys.join(', '),
      group: group || '测试推送',
      level: level || process.env.BARK_LEVEL || 'active',
      sound: sound || process.env.BARK_SOUND || 'paymentsuccess',
      status: 'failed',
      errorMessage: err.message,
      metadata: { type: 'test' },
    });

    res.json({ success: false, error: err.message });
  }
}

async function handleSendCustom(db, req, res) {
  const { title, body, level, sound, group, icon, url } = req.body;

  if (!title || !body) {
    return res.status(400).json({ success: false, error: '标题和内容不能为空' });
  }

  const pushUrl = process.env.BARK_PUSH_URL || 'https://api.day.app/push';
  const deviceKeys = (process.env.BARK_DEVICE_KEYS || process.env.BARK_DEVICE_KEY || '')
    .split(',').map(k => k.trim()).filter(k => k.length > 0);

  if (deviceKeys.length === 0) {
    return res.status(400).json({ success: false, error: '没有可用的设备密钥' });
  }

  try {
    const response = await axios.post(pushUrl, {
      title,
      body,
      level: level || process.env.BARK_LEVEL || 'active',
      sound: sound || process.env.BARK_SOUND || 'paymentsuccess',
      device_keys: deviceKeys,
      group: group || process.env.BARK_GROUP || '自定义推送',
      icon: icon || process.env.BARK_ICON || '',
      url: url || process.env.BARK_URL || '',
    }, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      timeout: 5000,
    });

    await recordNotificationHistory({
      channel: 'bark',
      title,
      body,
      recipient: deviceKeys.join(', '),
      group: group || process.env.BARK_GROUP || '自定义推送',
      level: level || process.env.BARK_LEVEL || 'active',
      sound: sound || process.env.BARK_SOUND || 'paymentsuccess',
      status: 'success',
      metadata: { type: 'custom' },
    });

    res.json({ success: true, data: response.data });
  } catch (err) {
    await recordNotificationHistory({
      channel: 'bark',
      title,
      body,
      recipient: deviceKeys.join(', '),
      group: group || process.env.BARK_GROUP || '自定义推送',
      status: 'failed',
      errorMessage: err.message,
      metadata: { type: 'custom' },
    });

    res.json({ success: false, error: err.message });
  }
}

async function handleGetBarkHistory(db, req, res) {
  const { page = 1, pageSize = 20, status, keyword } = req.body;
  const safePage = Math.max(1, parseInt(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  let whereClause = "WHERE channel = 'bark'";
  const params = [];

  if (status && status !== 'all') {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (keyword) {
    whereClause += ' AND (title LIKE ? OR body LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM notification_history ${whereClause}`,
    params
  );
  const total = countRows[0]?.total || 0;

  const [rows] = await db.execute(
    `SELECT id, channel, title, body, recipient, \`group\`, level, sound, status, error_message, metadata, created_at
     FROM notification_history ${whereClause}
     ORDER BY created_at DESC
     LIMIT ${safePageSize} OFFSET ${offset}`,
    params
  );

  res.json({
    success: true,
    history: rows.map(r => ({
      ...r,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
    })),
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(total / safePageSize),
  });
}

async function handleUpdateConfig(db, req, res) {
  const { barkEnabled, barkSound, dailyReportEnabled } = req.body;
  
  const updates = [];
  const params = [];
  
  if (barkEnabled !== undefined) {
    updates.push(['bark_enabled', barkEnabled ? 'true' : 'false', 'Bark推送功能开关']);
  }
  
  if (barkSound !== undefined && barkSound.trim()) {
    updates.push(['bark_sound', barkSound.trim(), 'Bark推送铃声']);
  }
  
  if (dailyReportEnabled !== undefined) {
    updates.push(['bark_daily_report_enabled', dailyReportEnabled ? 'true' : 'false', '每日收入统计定时推送开关']);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ success: false, error: '没有提供需要更新的配置' });
  }
  
  try {
    for (const [key, value, desc] of updates) {
      await db.execute(
        `INSERT INTO system_config (config_key, config_value, description) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
        [key, value, desc]
      );
    }
    
    // 刷新 barkNotifier 的配置
    await barkNotifier.refreshConfig();
    
    res.json({ 
      success: true, 
      message: '配置更新成功' 
    });
  } catch (error) {
    console.error('[Bark管理] 更新配置失败:', error.message);
    res.status(500).json({ success: false, error: '更新配置失败: ' + error.message });
  }
}

module.exports = { initialize };
