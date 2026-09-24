const jwt = require('jsonwebtoken');
const { logOperation } = require('./operation-logger');

/**
 * 更新用户标签接口
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
        'SELECT username FROM admins WHERE id = ?', [decoded.id]
      );
      
      if (admins.length === 0) {
        return res.status(403).json({
          success: false,
          error: '权限不足'
        });
      }
      
      const { username, tags } = req.body;
      
      // 参数验证
      if (!username) {
        return res.status(400).json({
          success: false,
          error: '缺少用户名参数'
        });
      }
      
      if (!Array.isArray(tags)) {
        return res.status(400).json({
          success: false,
          error: '标签必须是数组格式'
        });
      }
      
      // 将tags数组序列化为JSON字符串
      const tagsJson = JSON.stringify(tags);
      
      // 更新用户标签
      const [result] = await db.execute(
        'UPDATE users SET tags = ? WHERE username = ?',
        [tagsJson, username]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }
      
      // 记录操作日志
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      logOperation(decoded.id, admins[0].username, 'update_tags', 'users', 
        { username, oldTags: null, newTags: tags }, ipAddress, userAgent, 'success');
      
      res.json({
        success: true,
        message: '标签更新成功',
        tags: tags
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  };
}

module.exports = {
  initialize
};
