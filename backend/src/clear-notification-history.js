const jwt = require('jsonwebtoken');

/**
 * 清空所有通知历史记录
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
      
      // 获取删除前的记录数
      const [countRows] = await db.execute('SELECT COUNT(*) as total FROM notification_history');
      const totalDeleted = countRows[0].total;
      
      // 清空表
      await db.execute('TRUNCATE TABLE notification_history');
      
      res.json({ 
        success: true, 
        message: `已清空所有通知历史，共删除 ${totalDeleted} 条记录` 
      });
      
    } catch (error) {
      console.error('清空通知历史失败:', error);
      res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  };
}

module.exports = initialize;
