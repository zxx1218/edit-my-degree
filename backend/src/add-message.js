const { v4: uuidv4 } = require('uuid');
const { isIpBlacklisted } = require('./ip-blacklist');

// 内存缓存：记录最近5分钟内每个IP+用户的留言内容哈希（防止完全相同的重复提交）
const recentMessagesCache = new Map();
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分钟清理一次

// 定期清理过期缓存
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of recentMessagesCache.entries()) {
    if (now - value.timestamp > CACHE_CLEANUP_INTERVAL) {
      recentMessagesCache.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

// 异常行为检测计数器：记录IP+用户的留言尝试次数
const alertCounts = new Map();
const ALERT_THRESHOLD = 10; // 10次触发告警

/**
 * 检测并告警异常高频留言行为
 * @param {string} ipAddress - 客户端IP地址
 * @param {string} username - 用户名
 */
function checkAndAlert(ipAddress, username) {
  const key = `${ipAddress}_${username}`;
  const count = (alertCounts.get(key) || 0) + 1;
  alertCounts.set(key, count);
  
  // 重置计数器（1小时后）
  setTimeout(() => {
    alertCounts.delete(key);
  }, 60 * 60 * 1000);
  
  // 达到阈值时告警
  if (count === ALERT_THRESHOLD) {
    console.error(`🚨 [安全告警] 检测到异常留言行为 - IP: ${ipAddress}, 用户: ${username}, 1小时内尝试${count}次`);
    
    // 可选：未来可集成邮件告警系统
    // sendSecurityAlert({
    //   type: 'spam_message',
    //   ip: ipAddress,
    //   username: username,
    //   count: count
    // });
  }
}

function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    
    try {
      // 【新增】检查IP是否在黑名单中
      const blacklisted = await isIpBlacklisted(ipAddress);
      if (blacklisted) {
        console.warn(`[安全防护] 黑名单IP尝试留言 - IP: ${ipAddress}, 用户: ${req.body?.username || '未知'}`);
        
        return res.status(403).json({
          success: false,
          error: '您的IP地址已被加入黑名单，暂时无法提交留言',
          isBlacklisted: true
        });
      }
      
      const { content, username } = req.body;
      
      // 验证留言内容
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '留言内容不能为空'
        });
      }
      
      // 限制留言长度（最多500字符）
      if (content.length > 500) {
        console.warn(`[留言板] 添加留言失败 - 内容过长: ${content.length}字符, IP: ${ipAddress}`);
        return res.status(400).json({
          success: false,
          error: '留言内容不能超过500个字符'
        });
      }
      
      // 验证用户名
      if (!username || typeof username !== 'string' || username.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '用户名不能为空'
        });
      }
      
      // 【新增】检查是否为短时间内重复提交相同内容（防刷核心逻辑）
      const cacheKey = `${ipAddress}_${username}_${content.trim()}`;
      const now = Date.now();
      if (recentMessagesCache.has(cacheKey)) {
        const lastSubmit = recentMessagesCache.get(cacheKey);
        const timeDiff = now - lastSubmit.timestamp;
        
        // 如果5分钟内提交了相同内容，拒绝
        if (timeDiff < CACHE_CLEANUP_INTERVAL) {
          console.warn(`[留言板] 检测到重复留言 - IP: ${ipAddress}, 用户: ${username}, 时间间隔: ${Math.round(timeDiff/1000)}秒`);
          return res.status(429).json({
            success: false,
            error: '请勿重复提交相同内容，请稍后再试'
          });
        }
      }
      
      // 【新增】检查该用户最近1分钟内的留言次数（数据库层面频率控制）
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const [recentCount] = await db.execute(
        'SELECT COUNT(*) as count FROM messages WHERE username = ? AND created_at > ?',
        [username.trim(), oneMinuteAgo]
      );
      
      if (recentCount[0].count >= 3) {
        console.warn(`[留言板] 用户留言频率过高 - 用户: ${username}, IP: ${ipAddress}, 1分钟内已发送${recentCount[0].count}条`);
        return res.status(429).json({
          success: false,
          error: '您的留言频率过高（每分钟最多3条），请稍后再试'
        });
      }
      
      // 【新增】记录到缓存，用于后续去重检测
      recentMessagesCache.set(cacheKey, { timestamp: now });
      
      // 【新增】检测异常行为并告警
      checkAndAlert(ipAddress, username);
      
      const id = uuidv4();
      
      // 插入留言（包含username和ip_address字段，用于安全审计）
      await db.execute(
        'INSERT INTO messages (id, username, content, ip_address) VALUES (?, ?, ?, ?)',
        [id, username.trim(), content.trim(), ipAddress]
      );
      
      console.info(`[留言板] 留言添加成功 - ID: ${id}, 用户: ${username}, 内容长度: ${content.length}字符, IP: ${ipAddress}`);
      
      res.json({
        success: true,
        message: '留言成功',
        messageId: id
      });
    } catch (error) {
      console.error('[留言板] 添加留言异常:', error.message, { 
        ip: ipAddress,
        stack: error.stack 
      });
      res.status(500).json({
        success: false,
        error: '添加留言失败'
      });
    }
  };
}

module.exports = { initialize };
