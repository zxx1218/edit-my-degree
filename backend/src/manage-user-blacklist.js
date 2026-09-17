const dbManager = require('./db-utils');
const { logOperation } = require('./operation-logger');
const jwt = require('jsonwebtoken');

/**
 * 检查用户是否在黑名单中（未过期）
 * @param {string} username - 用户名
 * @returns {Promise<Object|null>} 黑名单记录或null
 */
async function isUserBlacklisted(username) {
  try {
    const [rows] = await dbManager.execute(
      'SELECT id, username, reason, blocked_until, created_at FROM user_blacklist WHERE username = ? AND blocked_until > NOW() LIMIT 1',
      [username]
    );
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('[用户黑名单] 检查失败:', error.message);
    return null;
  }
}

/**
 * 初始化用户黑名单管理接口
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
          `SELECT ub.id, ub.username, ub.reason, ub.blocked_until, ub.created_at, 
           ub.created_by,
           TIMESTAMPDIFF(HOUR, NOW(), ub.blocked_until) as hours_remaining 
           FROM user_blacklist ub
           WHERE ub.blocked_until > NOW() 
           ORDER BY ub.created_at DESC`
        );

        return res.json({
          success: true,
          blacklist: rows.map(row => ({
            id: row.id,
            username: row.username,
            reason: row.reason,
            blockedUntil: row.blocked_until,
            createdAt: row.created_at,
            createdBy: row.created_by,
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
          'SELECT username FROM user_blacklist WHERE id = ?',
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
          `UPDATE user_blacklist SET ${updates.join(', ')} WHERE id = ?`,
          values
        );

        logOperation(null, decoded.username, 'updated', `更新用户黑名单记录: ${JSON.stringify({ id, blockedUntil, reason })}`, {
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
          'SELECT username FROM user_blacklist WHERE id = ?',
          [id]
        );

        if (existing.length === 0) {
          return res.status(404).json({ success: false, error: '记录不存在' });
        }

        const username = existing[0].username;

        await dbManager.execute(
          'DELETE FROM user_blacklist WHERE id = ?',
          [id]
        );

        logOperation(null, decoded.username, 'removed', `删除用户黑名单记录，用户名: ${username}, 操作者: ${decoded.username}`, {
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
        const { username, reason, blockedUntil } = req.body;

        // 验证必填参数
        if (!username || !reason || !blockedUntil) {
          return res.status(400).json({ success: false, error: '缺少必要参数' });
        }

        // 检查用户名是否存在
        const [userExists] = await dbManager.execute(
          'SELECT id FROM users WHERE username = ?',
          [username]
        );

        if (userExists.length === 0) {
          return res.status(404).json({ 
            success: false, 
            error: '用户名不存在' 
          });
        }

        // 检查该用户是否已在黑名单中（未过期）
        const [existing] = await dbManager.execute(
          'SELECT id FROM user_blacklist WHERE username = ? AND blocked_until > NOW()',
          [username]
        );

        if (existing.length > 0) {
          return res.status(409).json({ 
            success: false, 
            error: '该用户已在黑名单中且未过期' 
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
          'INSERT INTO user_blacklist (id, username, reason, blocked_until, created_by) VALUES (UUID(), ?, ?, ?, ?)',
          [username, reason, blockedUntilDate, decoded.username]
        );

        logOperation(null, decoded.username, 'added', `新增用户黑名单记录: ${username}, 原因: ${reason}`, {
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
      console.error('[用户黑名单管理] 错误:', error.message, { stack: error.stack });
      return res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  };
}

module.exports = { initialize, isUserBlacklisted };
