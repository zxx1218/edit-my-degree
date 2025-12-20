let dbInstance = null;

// 添加初始化方法
const initialize = (db) => {
  dbInstance = db;
};

const { v4: uuidv4 } = require('uuid');

// 导出充值卡管理函数，需要传入db参数
const manageCards = (db) => async (req, res) => {
  // 如果传入了db参数，则使用它；否则使用全局dbInstance
  const database = db || dbInstance;
  
  // 检查数据库连接是否有效
  if (!database || typeof database.execute !== 'function') {
    return res.status(500).json({
      success: false,
      error: '数据库连接不可用'
    });
  }

  try {
    const { action, type, values, count, cardId, username } = req.body;

    switch (action) {
      case 'create':
        // 创建充值卡
        if (!type || !values || !count) {
          return res.status(400).json({
            success: false,
            error: '缺少必要的参数：type, values, count'
          });
        }

        if (count > 100) {
          return res.status(400).json({
            success: false,
            error: '单次创建数量不能超过100张'
          });
        }

        const newCards = [];
        for (let i = 0; i < count; i++) {
          const cardId = uuidv4();
          await database.execute(
            'INSERT INTO cards (id, type, `values`) VALUES (?, ?, ?)',
            [cardId, type, values]
          );
          newCards.push({
            id: cardId,
            type,
            values
          });
        }

        return res.json({
          success: true,
          cards: newCards
        });

      case 'list':
        // 获取充值卡列表
        const [cards] = await database.execute(
          'SELECT id, type, `values`, used, used_by, used_at, created_at FROM cards ORDER BY created_at DESC'
        );
        
        return res.json({
          success: true,
          cards: cards.map(card => ({
            id: card.id,
            type: card.type,
            values: card.values,
            used: card.used === 1,
            used_by: card.used_by,
            used_at: card.used_at,
            created_at: card.created_at
          }))
        });

      case 'use':
        // 使用充值卡
        if (!cardId || !username) {
          return res.status(400).json({
            success: false,
            error: '缺少必要的参数：cardId, username'
          });
        }

        // 检查充值卡是否存在且未被使用
        const [cardsResult] = await database.execute(
          'SELECT * FROM cards WHERE id = ? AND used = FALSE',
          [cardId]
        );

        if (cardsResult.length === 0) {
          return res.status(400).json({
            success: false,
            error: '充值卡不存在或已被使用'
          });
        }

        const card = cardsResult[0];

        // 查找用户
        const [usersResult] = await database.execute(
          'SELECT id FROM users WHERE username = ?',
          [username]
        );

        if (usersResult.length === 0) {
          return res.status(404).json({
            success: false,
            error: '用户不存在'
          });
        }

        const user = usersResult[0];
        
        // 开始事务处理
        await database.query('START TRANSACTION');
        
        try {
          // 标记充值卡为已使用
          await database.execute(
            'UPDATE cards SET used = TRUE, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id, cardId]
          );

          // 根据充值卡类型更新用户相应资源
          if (card.type === 'login') {
            await database.execute(
              'UPDATE users SET remaining_logins = remaining_logins + ? WHERE id = ?',
              [card.values, user.id]
            );
          } else if (card.type === 'pdf') {
            await database.execute(
              'UPDATE users SET pdf_limit = pdf_limit + ? WHERE id = ?',
              [card.values, user.id]
            );
          }

          await database.query('COMMIT');

          // 获取更新后的用户信息
          const [updatedUserResult] = await database.execute(
            'SELECT remaining_logins, pdf_limit FROM users WHERE id = ?',
            [user.id]
          );

          return res.json({
            success: true,
            message: '充值卡使用成功',
            card: {
              id: card.id,
              type: card.type,
              values: card.values
            },
            user: updatedUserResult[0]
          });
        } catch (error) {
          await database.execute('ROLLBACK');
          throw error;
        }

      default:
        return res.status(400).json({
          success: false,
          error: '无效的操作类型'
        });
    }
  } catch (err) {
    console.error('充值卡管理接口出错:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
};

// 导出initialize方法
module.exports = manageCards;
module.exports.initialize = initialize;