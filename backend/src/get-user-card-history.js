let dbInstance = null;

// 添加初始化方法
const initialize = (db) => {
  dbInstance = db;
  return getUserCardHistory;
};

/**
 * 获取用户卡密使用记录
 */
const getUserCardHistory = async (req, res) => {
  // 如果传入了db参数，则使用它；否则使用全局dbInstance
  const database = dbInstance;
  
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

module.exports = getUserCardHistory;
module.exports.initialize = initialize;
