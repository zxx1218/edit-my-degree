const jwt = require('jsonwebtoken');

/**
 * 获取通知历史记录
 * @param {Object} db - 数据库连接实例
 * @param {string} jwtSecret - JWT密钥
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
      
      const { action, page = 1, pageSize = 20, channel = 'all', status = 'all', searchQuery = '' } = req.body;
      
      if (action !== 'list') {
        return res.status(400).json({ success: false, error: '无效的操作类型' });
      }
      
      // 构建查询条件
      let whereConditions = [];
      let queryParams = [];
      
      if (channel !== 'all') {
        whereConditions.push('channel = ?');
        queryParams.push(channel);
      }
      
      if (status !== 'all') {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }
      
      if (searchQuery.trim()) {
        whereConditions.push('(title LIKE ? OR body LIKE ? OR recipient LIKE ?)');
        const likeQuery = `%${searchQuery.trim()}%`;
        queryParams.push(likeQuery, likeQuery, likeQuery);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM notification_history ${whereClause}`;
      const [countRows] = await db.execute(countQuery, queryParams);
      const total = countRows[0].total;
      
      // 计算分页
      const offset = (page - 1) * pageSize;
      const totalPages = Math.ceil(total / pageSize);
      
      // 获取数据 - MySQL不支持LIMIT/OFFSET使用占位符，需要直接拼接
      let dataQuery = 'SELECT * FROM notification_history';
      if (whereClause) {
        dataQuery += ' ' + whereClause;
      }
      dataQuery += ` ORDER BY created_at DESC LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`;
      
      console.log('DEBUG - SQL查询:', dataQuery);
      console.log('DEBUG - 参数:', queryParams);
      
      const [rows] = await db.execute(dataQuery, queryParams);
      
      // 格式化数据
      const notifications = rows.map(row => ({
        id: row.id,
        channel: row.channel,
        title: row.title,
        body: row.body,
        recipient: row.recipient,
        group: row.group,
        level: row.level,
        sound: row.sound,
        status: row.status,
        errorMessage: row.error_message,
        metadata: row.metadata || null,
        createdAt: row.created_at
      }));
      
      res.json({
        success: true,
        notifications,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages
      });
      
    } catch (error) {
      console.error('获取通知历史失败:', error);
      res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  };
}

module.exports = initialize;
