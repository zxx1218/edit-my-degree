const jwt = require('jsonwebtoken');

let dbInstance = null;

// 添加初始化方法
const initialize = (db, jwtSecret) => {
  dbInstance = db;
  
  // 返回一个包装函数，包含jwtSecret
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
      
      // 检查用户是否为管理员（兼容两种命名方式）
      if (!decoded.is_admin && !decoded.isAdmin) {
        return res.status(403).json({
          success: false,
          error: '权限不足'
        });
      }
      
      // 调用原有的处理逻辑
      await getUserCardHistoryHandler(req, res, dbInstance);
    } catch (err) {
      console.error('获取用户卡密历史出错:', err);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  };
};

/**
 * 获取用户卡密使用记录的处理逻辑
 */
const getUserCardHistoryHandler = async (req, res, database) => {
  // 检查数据库连接是否有效
  if (!database || typeof database.execute !== 'function') {
    return res.status(500).json({
      success: false,
      error: '数据库连接不可用'
    });
  }

  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: '缺少必要的参数：username'
      });
    }

    // 查询用户使用的卡密记录
    const [cards] = await database.execute(
      `SELECT c.id, c.type, c.values, c.used_at 
       FROM cards c 
       JOIN users u ON c.used_by = u.id 
       WHERE u.username = ? AND c.used = TRUE 
       ORDER BY c.used_at DESC`,
      [username]
    );

    // 格式化返回数据
    const formattedCards = cards.map(card => ({
      id: card.id,
      type: card.type,
      values: card.values,
      used_at: card.used_at,
      card_type_label: card.type === 'login' ? '登录卡' : 'PDF积分卡'
    }));

    return res.json({
      success: true,
      cards: formattedCards
    });
  } catch (err) {
    console.error('获取用户卡密历史出错:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
};

module.exports = getUserCardHistoryHandler;
module.exports.initialize = initialize;