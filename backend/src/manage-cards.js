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
          'SELECT c.id, c.type, c.values, c.used, u.username as used_by, c.used_at, c.created_at FROM cards c LEFT JOIN users u ON c.used_by = u.id ORDER BY c.created_at DESC'
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

        // 首先检查充值卡是否存在
        const [cardExistsResult] = await database.execute(
          'SELECT id, type, `values`, used FROM cards WHERE id = ?',
          [cardId]
        );

        if (cardExistsResult.length === 0) {
          return res.status(400).json({
            success: false,
            error: '充值卡不存在'
          });
        }

        const cardInfo = cardExistsResult[0];
        
        // 检查充值卡是否已被使用
        if (cardInfo.used === 1) {
          return res.status(400).json({
            success: false,
            error: '该充值卡已使用过'
          });
        }

        // 查找用户
        const [usersResult] = await database.execute(
          'SELECT id, remaining_logins, is_trial_user FROM users WHERE username = ?',
          [username]
        );

        if (usersResult.length === 0) {
          return res.status(404).json({
            success: false,
            error: '待充值的用户不存在，请检查账号是否已注册！'
          });
        }

        const user = usersResult[0];
        
        // 获取数据库连接用于事务处理
        const connection = await database.getConnection();
        
        try {
          // 开始事务处理 - 使用数据库管理器的executeNonQuery方法
          await database.executeNonQuery('START TRANSACTION');
          
          // 标记充值卡为已使用
          await connection.execute(
            'UPDATE cards SET used = TRUE, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id, cardId]
          );

          // 根据充值卡类型更新用户相应资源
          if (cardInfo.type === 'login') {
            // 在更新登录次数之前，先获取当前剩余登录次数
            const currentRemainingLogins = user.remaining_logins;
            
            await connection.execute(
              'UPDATE users SET remaining_logins = remaining_logins + ? WHERE id = ?',
              [cardInfo.values, user.id]
            );
            
            // 根据充值规则更新is_trial_user字段
            let trialUserUpdate = null;
            
            if (cardInfo.values === 1 && currentRemainingLogins === 0) {
              // 使用1次登录卡且当前剩余登录次数为0，设置为体验用户
              trialUserUpdate = 1;
            } else if (cardInfo.values > 1) {
              // 使用大于1次的登录卡，无论当前状态如何都设为非体验用户
              trialUserUpdate = 0;
            }
            
            // 如果需要更新is_trial_user字段
            if (trialUserUpdate !== null) {
              await connection.execute(
                'UPDATE users SET is_trial_user = ? WHERE id = ?',
                [trialUserUpdate, user.id]
              );
              
              console.info(`[充值管理] 用户 ${username} 的is_trial_user更新为 ${trialUserUpdate === 1 ? 'true' : 'false'} (充值${cardInfo.values}次，充值前剩余${currentRemainingLogins}次)`);
            }
          } else if (cardInfo.type === 'pdf') {
            await connection.execute(
              'UPDATE users SET pdf_limit = pdf_limit + ? WHERE id = ?',
              [cardInfo.values, user.id]
            );
          }

          await database.executeNonQuery('COMMIT');

          // 获取更新后的用户信息用于消息提示
          const updatedUserResult = await connection.execute(
            'SELECT remaining_logins, pdf_limit, is_trial_user FROM users WHERE id = ?',
            [user.id]
          );

          connection.release();

          // 获取更新后的用户信息用于消息提示
          const updatedUser = updatedUserResult[0];
          const loginRemaining = updatedUser[0].remaining_logins || 0;
          const pdfRemaining = updatedUser[0].pdf_limit || 0;
          const isTrialUser = updatedUser[0].is_trial_user;
          console.log(`用户 ${username} 的登录次数剩余 ${loginRemaining}，PDF积分剩余 ${pdfRemaining}，体验用户标记: ${isTrialUser}`);
          
          // 根据充值卡类型生成相应的消息
          let message = '充值成功';
          let isPermanentCard = false;
          
          if (cardInfo.type === 'login') {
            message += `，用户 ${username} 当前登录次数剩余 ${loginRemaining} 次`;
            // 判断是否为永久卡（充值次数大于1000）
            if (cardInfo.values > 1000) {
              isPermanentCard = true;
            }
          } else if (cardInfo.type === 'pdf') {
            message += `，用户 ${username} 当前PDF积分剩余 ${pdfRemaining} 分`;
          }
          
          return res.json({
            success: true,
            message: message,
            card: {
              id: cardInfo.id,
              type: cardInfo.type,
              values: cardInfo.values
            },
            user: updatedUser,
            isPermanentCard: isPermanentCard
          });
        } catch (error) {
          await database.executeNonQuery('ROLLBACK');
          connection.release();
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