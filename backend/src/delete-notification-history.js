const jwt = require('jsonwebtoken');

/**
 * 删除单条通知历史记录
 */
function initialize(db, jwtSecret) {
  return async (req, res) => {
    try {
      // 从请求头获取token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: '未提供访问令牌'
        });
      }
      const token = authHeader.substring(7);
      
      // 验证JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, jwtSecret || process.env.JWT_SECRET || 'default_jwt_secret');
      } catch (err) {
        return res.status(401).json({
          success: false,
          error: '无效的访问令牌'
        });
      }
      
      // 检查用户是否为管理员
      const [admins] = await db.execute(
        'SELECT id FROM admins WHERE id = ?', [decoded.id]
      );
      
      if (admins.length === 0) {
        return res.status(403).json({
          success: false,
          error: '需要管理员权限'
        });
      }
      
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ success: false, error: '请提供通知ID' });
      }
      
      // 检查记录是否存在
      const [existing] = await db.execute('SELECT id FROM notification_history WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: '通知记录不存在' });
      }
      
      // 删除记录
      await db.execute('DELETE FROM notification_history WHERE id = ?', [id]);
      
      res.json({ success: true, message: '删除成功' });
      
    } catch (error) {
      console.error('删除通知历史失败:', error);
      res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  };
}

module.exports = initialize;
