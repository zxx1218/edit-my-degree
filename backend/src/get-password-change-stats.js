const jwt = require('jsonwebtoken');
const dbManager = require('./db-utils');

/**
 * 获取密码修改统计接口
 * @param {Object} db - 数据库连接实例
 * @param {string} jwtSecret - JWT密钥
 */
function initialize(db, jwtSecret) {
  return async (req, res) => {
    try {
      // 验证管理员权限
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: '未授权访问'
        });
      }

      const token = authHeader.substring(7);
      let decoded;
      try {
        decoded = jwt.verify(token, jwtSecret || process.env.JWT_SECRET || 'default_jwt_secret');
      } catch (err) {
        return res.status(401).json({
          success: false,
          error: '无效的token'
        });
      }

      // 检查是否为管理员
      if (!decoded.is_admin && !decoded.isAdmin) {
        return res.status(403).json({
          success: false,
          error: '需要管理员权限'
        });
      }

      // 获取分页参数
      const { page = 1, pageSize = 20 } = req.body;
      const offset = (page - 1) * pageSize;
      
      // 确保参数为整数
      const limitNum = parseInt(pageSize);
      const offsetNum = parseInt(offset);
      
      // 验证参数有效性
      if (isNaN(limitNum) || isNaN(offsetNum) || limitNum < 1 || offsetNum < 0) {
        return res.status(400).json({
          success: false,
          error: '无效的分页参数'
        });
      }

      // 查询统计数据：按用户名分组，统计修改次数和最近修改时间
      // 注意：LIMIT和OFFSET需要直接拼接到SQL中，不能使用参数化查询
      const [statsRows] = await db.execute(
        `SELECT 
          username,
          COUNT(*) as total_changes,
          MAX(changed_at) as last_changed_at
         FROM password_change_history
         WHERE result = 'success'
         GROUP BY username
         ORDER BY last_changed_at DESC
         LIMIT ${limitNum} OFFSET ${offsetNum}`
      );

      // 获取总记录数
      const [countRows] = await db.execute(
        `SELECT COUNT(DISTINCT username) as total 
         FROM password_change_history 
         WHERE result = 'success'`
      );

      const total = countRows[0].total;
      const totalPages = Math.ceil(total / pageSize);

      res.json({
        success: true,
        stats: statsRows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages
      });
    } catch (err) {
      console.error('[密码修改统计] 获取失败:', err.message);
      console.error('[密码修改统计] 错误详情:', {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        stack: err.stack
      });
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  };
}

module.exports = initialize;

