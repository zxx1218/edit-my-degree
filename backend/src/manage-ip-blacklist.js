const dbManager = require('./db-utils');
const { logIpBlacklist } = require('./operation-logger');
const jwt = require('jsonwebtoken');

/**
 * 初始化IP黑名单管理接口
 * @param {Object} db - 数据库连接
 * @param {string} JWT_SECRET - JWT密钥
 */
function initialize(db, JWT_SECRET) {
  return async (req, res) => {
    try {
      // 验证管理员权限
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: '未授权访问' });
      }

      const token = authHeader.substring(7);
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ success: false, error: '无效的token' });
      }

      // 检查是否为管理员
      const isAdmin = decoded.isAdmin || decoded.is_admin;
      if (!isAdmin) {
        return res.status(403).json({ success: false, error: '需要管理员权限' });
      }

      const { action } = req.body;

      // 获取所有未过期的黑名单记录
      if (action === 'list') {
        const [rows] = await dbManager.execute(
          `SELECT id, ip_address, reason, blocked_until, created_at, 
           TIMESTAMPDIFF(HOUR, NOW(), blocked_until) as hours_remaining 
           FROM ip_blacklist 
           WHERE blocked_until > NOW() 
           ORDER BY blocked_until DESC`
        );

        return res.json({
          success: true,
          blacklist: rows.map(row => ({
            id: row.id,
            ipAddress: row.ip_address,
            reason: row.reason,
            blockedUntil: row.blocked_until,
            createdAt: row.created_at,
            hoursRemaining: row.hours_remaining
          }))
        });
      }

      // 更新黑名单记录
      if (action === 'update') {
        const { id, blockedUntil, reason } = req.body;

        if (!id) {
          return res.status(400).json({ success: false, error: '缺少必要参数' });
        }

        // 验证记录是否存在
        const [existing] = await dbManager.execute(
          'SELECT id FROM ip_blacklist WHERE id = ?',
          [id]
        );

        if (existing.length === 0) {
          return res.status(404).json({ success: false, error: '记录不存在' });
        }

        // 构建更新语句
        const updates = [];
        const values = [];

        if (blockedUntil !== undefined) {
          updates.push('blocked_until = ?');
          values.push(new Date(blockedUntil));
        }

        if (reason !== undefined) {
          updates.push('reason = ?');
          values.push(reason);
        }

        if (updates.length === 0) {
          return res.status(400).json({ success: false, error: '没有要更新的字段' });
        }

        values.push(id);

        await dbManager.execute(
          `UPDATE ip_blacklist SET ${updates.join(', ')} WHERE id = ?`,
          values
        );

        logIpBlacklist(null, 'updated', `更新黑名单记录: ${JSON.stringify({ id, blockedUntil, reason })}`, {
          adminUsername: decoded.username,
          ip: req.ip
        });

        return res.json({
          success: true,
          message: '更新成功'
        });
      }

      // 删除黑名单记录
      if (action === 'delete') {
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ success: false, error: '缺少必要参数' });
        }

        // 验证记录是否存在
        const [existing] = await dbManager.execute(
          'SELECT ip_address FROM ip_blacklist WHERE id = ?',
          [id]
        );

        if (existing.length === 0) {
          return res.status(404).json({ success: false, error: '记录不存在' });
        }

        const ipAddress = existing[0].ip_address;

        await dbManager.execute(
          'DELETE FROM ip_blacklist WHERE id = ?',
          [id]
        );

        logIpBlacklist(ipAddress, 'removed', `删除黑名单记录，操作者: ${decoded.username}`, {
          adminUsername: decoded.username,
          ip: req.ip
        });

        return res.json({
          success: true,
          message: '删除成功'
        });
      }

      // 新增黑名单记录
      if (action === 'add') {
        const { ipAddress, reason, blockedUntil } = req.body;

        // 验证必填参数
        if (!ipAddress || !reason || !blockedUntil) {
          return res.status(400).json({ success: false, error: '缺少必要参数' });
        }

        // 验证IP地址格式（简单的IPv4和IPv6格式检查）
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        
        if (!ipv4Regex.test(ipAddress) && !ipv6Regex.test(ipAddress)) {
          return res.status(400).json({ success: false, error: 'IP地址格式不正确' });
        }

        // 如果是IPv4，验证每个段是否在0-255范围内
        if (ipv4Regex.test(ipAddress)) {
          const parts = ipAddress.split('.');
          const isValid = parts.every(part => {
            const num = parseInt(part);
            return num >= 0 && num <= 255;
          });
          
          if (!isValid) {
            return res.status(400).json({ success: false, error: 'IP地址格式不正确' });
          }
        }

        // 检查该IP是否已在黑名单中（未过期）
        const [existing] = await dbManager.execute(
          'SELECT id FROM ip_blacklist WHERE ip_address = ? AND blocked_until > NOW()',
          [ipAddress]
        );

        if (existing.length > 0) {
          return res.status(409).json({ 
            success: false, 
            error: '该IP地址已在黑名单中且未过期' 
          });
        }

        // MySQL TIMESTAMP 最大值: '2038-01-19T03:14:07.000Z'
        const maxTimestamp = new Date('2038-01-19T03:14:07.000Z');
        let blockedUntilDate = new Date(blockedUntil);
        
        // 确保不超过 TIMESTAMP 类型的最大有效时间
        if (blockedUntilDate > maxTimestamp) {
          blockedUntilDate = maxTimestamp;
        }

        // 插入新记录
        await dbManager.execute(
          'INSERT INTO ip_blacklist (id, ip_address, reason, blocked_until) VALUES (UUID(), ?, ?, ?)',
          [ipAddress, reason, blockedUntilDate]
        );

        logIpBlacklist(ipAddress, 'added', `新增黑名单记录: ${reason}`, {
          adminUsername: decoded.username,
          ip: req.ip,
          blockedUntil: blockedUntilDate.toISOString()
        });

        return res.json({
          success: true,
          message: '添加成功'
        });
      }

      return res.status(400).json({ success: false, error: '无效的操作类型' });

    } catch (error) {
      console.error('[IP黑名单管理] 错误:', error.message, { stack: error.stack });
      return res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  };
}

module.exports = { initialize };
