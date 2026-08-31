let dbInstance = null;

// 添加初始化方法
const initialize = (db) => {
  dbInstance = db;
};

const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const cryptoUtils = require('./crypto-utils');
const { sendIllegalApiCallAlert } = require('./email-notifier');

/**
 * 管理员身份验证中间件
 * 验证JWT token并确认用户具有管理员权限
 */
const adminAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[安全防护] 充值卡管理接口缺少认证Token - IP: ${req.ip}`);
      
      // 发送非法调用告警邮件
      sendIllegalApiCallAlert({
        req,
        reason: '充值卡管理缺少认证Token',
        details: {
          action: req.body.action,
          missingField: 'Authorization Token'
        }
      }).catch(err => {
        console.error('[邮件通知] 发送告警失败:', err.message);
      });
      
      return res.status(401).json({
        success: false,
        error: '未提供认证令牌'
      });
    }
    
    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 兼容 isAdmin 和 is_admin 两种命名
    if (!decoded.isAdmin && !decoded.is_admin) {
      console.warn(`[安全防护] 非管理员尝试访问充值卡管理接口 - 用户: ${decoded.username}, IP: ${req.ip}`);
      
      // 发送非法调用告警邮件
      sendIllegalApiCallAlert({
        req,
        reason: '非管理员尝试访问充值卡管理接口',
        details: {
          username: decoded.username,
          userId: decoded.id,
          action: req.body.action
        }
      }).catch(err => {
        console.error('[邮件通知] 发送告警失败:', err.message);
      });
      
      return res.status(403).json({
        success: false,
        error: '权限不足，需要管理员权限'
      });
    }
    
    // 将解码后的用户信息附加到请求对象
    req.adminUser = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn(`[安全防护] 认证Token已过期 - IP: ${req.ip}`);
      return res.status(401).json({
        success: false,
        error: '认证令牌已过期'
      });
    }
    
    console.error(`[安全防护] Token验证失败 - IP: ${req.ip}, 错误: ${error.message}`);
    return res.status(401).json({
      success: false,
      error: '无效的认证令牌'
    });
  }
};

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
    const { action, type, values, count, cardId, username, SBverify } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    // 获取管理员信息（如果已通过中间件验证）
    const adminUser = req.adminUser;
    const adminUsername = adminUser ? adminUser.username : 'unknown';

    switch (action) {
      case 'create':
        // 【安全检查】记录管理员操作日志
        console.safe(`[充值管理] 管理员创建充值卡 - 管理员: ${adminUsername}, 类型: ${type}, 面值: ${values}, 数量: ${count}, IP: ${ipAddress}`);
        
        // 创建充值卡
        if (!type || !values || !count) {
          return res.status(400).json({
            success: false,
            error: '缺少必要的参数：type, values, count'
          });
        }

        // 验证充值卡类型
        if (type !== 'login' && type !== 'pdf') {
          return res.status(400).json({
            success: false,
            error: '无效的充值卡类型，只能是 login 或 pdf'
          });
        }

        // 验证充值卡面值范围
        const MAX_CARD_VALUE = 10000;
        if (values <= 0 || values > MAX_CARD_VALUE) {
          return res.status(400).json({
            success: false,
            error: `充值卡数值必须在1-${MAX_CARD_VALUE}之间`
          });
        }

        // 更严格的数量限制
        const MAX_CREATE_COUNT = 50;
        if (count > MAX_CREATE_COUNT) {
          console.warn(`[安全警告] 管理员尝试大批量创建充值卡 - 管理员: ${adminUsername}, 数量: ${count}, IP: ${ipAddress}`);
          return res.status(400).json({
            success: false,
            error: `单次创建数量不能超过${MAX_CREATE_COUNT}张，如需更多请分批操作`
          });
        }

        // 额外的安全检查：验证values和count是否为正整数
        if (!Number.isInteger(values) || !Number.isInteger(count)) {
          return res.status(400).json({
            success: false,
            error: '充值卡面值和数量必须为正整数'
          });
        }

        // 防止负数或零值
        if (values <= 0 || count <= 0) {
          return res.status(400).json({
            success: false,
            error: '充值卡面值和数量必须为正数'
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
        // 使用充值卡 - 必须提供SBverify字段
        if (!SBverify) {
          console.warn(`[安全警告] 充值卡使用缺少SBverify参数 - IP: ${ipAddress}, User-Agent: ${userAgent}`);
          
          // 发送非法调用告警邮件
          sendIllegalApiCallAlert({
            req,
            reason: '缺少SBverify参数',
            details: {
              action: 'use',
              missingField: 'SBverify',
              providedFields: Object.keys(req.body)
            }
          }).catch(err => {
            console.error('[邮件通知] 发送告警失败:', err.message);
          });
          
          return res.status(400).json({
            success: false,
            error: '缺少必要的验证参数：SBverify'
          });
        }

        if (!username) {
          console.warn(`[安全警告] 充值卡使用缺少username参数 - IP: ${ipAddress}, User-Agent: ${userAgent}`);
          
          // 发送非法调用告警邮件
          sendIllegalApiCallAlert({
            req,
            reason: '缺少username参数',
            details: {
              action: 'use',
              missingField: 'username',
              providedFields: Object.keys(req.body)
            }
          }).catch(err => {
            console.error('[邮件通知] 发送告警失败:', err.message);
          });
          
          return res.status(400).json({
            success: false,
            error: '缺少必要的参数：username'
          });
        }

        // 解密SBverify获取真实的充值卡ID
        let decryptedCardId;
        try {
          decryptedCardId = cryptoUtils.decrypt(SBverify);
        } catch (error) {
          console.warn(`[安全警告] 充值卡解密失败 - IP: ${ipAddress}, User-Agent: ${userAgent}, 错误: ${error.message}`);
          
          // 发送非法调用告警邮件
          sendIllegalApiCallAlert({
            req,
            reason: 'SBverify解密失败',
            details: {
              action: 'use',
              SBverifyLength: SBverify.length,
              errorMessage: error.message
            }
          }).catch(err => {
            console.error('[邮件通知] 发送告警失败:', err.message);
          });
          
          return res.status(400).json({
            success: false,
            error: '充值卡验证失败，请检查充值卡是否正确'
          });
        }

        // 首先检查充值卡是否存在
        const [cardExistsResult] = await database.execute(
          'SELECT id, type, `values`, used FROM cards WHERE id = ?',
          [decryptedCardId]
        );

        if (cardExistsResult.length === 0) {
          console.warn(`[安全警告] 使用不存在的充值卡 - 卡ID: ${decryptedCardId}, 用户: ${username}, IP: ${ipAddress}`);
          
          // 发送非法调用告警邮件
          // sendIllegalApiCallAlert({
          //   req,
          //   reason: '使用不存在的充值卡',
          //   details: {
          //     action: 'use',
          //     cardId: decryptedCardId,
          //     username: username
          //   }
          // }).catch(err => {
          //   console.error('[邮件通知] 发送告警失败:', err.message);
          // });
          
          return res.status(400).json({
            success: false,
            error: '充值卡不存在或已失效'
          });
        }

        const cardInfo = cardExistsResult[0];
        
        // 检查充值卡是否已被使用
        if (cardInfo.used === 1) {
          console.warn(`[安全警告] 尝试使用已使用的充值卡 - 卡ID: ${decryptedCardId}, 用户: ${username}, IP: ${ipAddress}`);
          
          // 发送非法调用告警邮件（可选，因为可能是用户误操作）
          // sendIllegalApiCallAlert({...});
          
          return res.status(400).json({
            success: false,
            error: '该充值卡已使用过'
          });
        }

        // 查找用户
        const [usersResult] = await database.execute(
          'SELECT id, remaining_logins, pdf_limit, is_trial_user FROM users WHERE username = ?',
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
          
          // 记录充值前的状态
          const beforeState = {
            remaining_logins: user.remaining_logins,
            pdf_limit: user.pdf_limit || 0
          };
          
          // 标记充值卡为已使用
          await connection.execute(
            'UPDATE cards SET used = TRUE, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id, decryptedCardId]
          );

          // 根据充值卡类型更新用户相应资源
          if (cardInfo.type === 'login') {
            // 在更新登录次数之前，先获取当前剩余登录次数
            const currentRemainingLogins = user.remaining_logins;
            
            await connection.execute(
              'UPDATE users SET remaining_logins = remaining_logins + ? WHERE id = ?',
              [cardInfo.values, user.id]
            );

            // 【特殊逻辑】如果充值的是 9999999 次登录卡密，自动赠送 30 PDF 积分
            if (cardInfo.values === 9999999) {
              await connection.execute(
                'UPDATE users SET pdf_limit = pdf_limit + 30 WHERE id = ?',
                [user.id]
              );
              console.info(`[充值管理] 触发永久卡赠送逻辑 - 用户 ${username} 自动获得 30 PDF 积分`);
            }
            
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
          
          // 记录充值后的状态
          const afterState = {
            remaining_logins: loginRemaining,
            pdf_limit: pdfRemaining
          };
          
          // 记录详细的审计日志（safe级别）
          console.safe(`[审计日志] 充值卡充值成功 - 
            操作类型: 自助充值,
            充值卡ID: ${decryptedCardId},
            充值卡类型: ${cardInfo.type},
            充值面值: ${cardInfo.values},
            目标用户: ${username}(ID:${user.id}),
            登录次数: ${beforeState.remaining_logins} → ${afterState.remaining_logins},
            PDF积分: ${beforeState.pdf_limit} → ${afterState.pdf_limit},
            IP地址: ${ipAddress},
            User-Agent: ${userAgent},
            时间戳: ${new Date().toISOString()}`);
          
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
    console.error('[充值管理] 操作异常:', err.message, { 
      action: req.body?.action,
      ip: req.ip,
      stack: err.stack 
    });
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
};

// 导出initialize方法
module.exports = manageCards;
module.exports.initialize = initialize;
module.exports.adminAuthMiddleware = adminAuthMiddleware;
