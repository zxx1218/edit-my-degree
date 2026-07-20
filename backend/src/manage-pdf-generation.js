const jwt = require('jsonwebtoken');
const logger = require('./logger');

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
      await managePdfGenerationHandler(req, res, dbInstance);
    } catch (err) {
      logger.error('管理PDF生成记录出错:', err);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  };
};

/**
 * 从URL中提取用户名和姓名
 */
function extractUserInfoFromUrl(fullUrl) {
  try {
    const urlObj = new URL(fullUrl);
    const username = urlObj.searchParams.get('username');
    const name = urlObj.searchParams.get('name');
    
    return { 
      username: username || null, 
      name: name || username || '未知用户' 
    };
  } catch (error) {
    // 如果URL解析失败，尝试正则匹配
    const usernameMatch = fullUrl.match(/username=([^&]+)/);
    const nameMatch = fullUrl.match(/[?&]name=([^&]+)/);
    
    const username = usernameMatch ? usernameMatch[1] : null;
    const name = nameMatch ? decodeURIComponent(nameMatch[1]) : (username || '未知用户');
    
    return { username, name };
  }
}

/**
 * PDF生成管理的处理逻辑
 */
const managePdfGenerationHandler = async (req, res, database) => {
  // 检查数据库连接是否有效
  if (!database || typeof database.execute !== 'function') {
    return res.status(500).json({
      success: false,
      error: '数据库连接不可用'
    });
  }

  try {
    const { action, id, expiresAt } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: '缺少必要的参数：action'
      });
    }

    // 列出所有PDF生成记录
    if (action === 'list') {
      const [records] = await database.execute(
        `SELECT 
          qr.id,
          qr.short_code,
          qr.full_url,
          qr.pdf_type,
          qr.created_at,
          qr.expires_at,
          qr.scan_count,
          qr.last_scanned_at
        FROM qr_code_urls qr
        ORDER BY qr.created_at DESC`
      );

      // 格式化返回数据并提取用户信息
      const formattedRecords = await Promise.all(
        records.map(async (record) => {
          const userInfo = extractUserInfoFromUrl(record.full_url);
          
          // 判断是否过期
          const now = new Date();
          const expiresAtDate = record.expires_at ? new Date(record.expires_at) : null;
          const isExpired = expiresAtDate && now > expiresAtDate;
          
          // 计算剩余天数
          let remainingDays = null;
          if (expiresAtDate && !isExpired) {
            const diffTime = expiresAtDate.getTime() - now.getTime();
            remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          return {
            id: record.id,
            short_code: record.short_code,
            pdf_type: record.pdf_type,
            created_at: record.created_at,
            expires_at: record.expires_at,
            scan_count: record.scan_count,
            last_scanned_at: record.last_scanned_at,
            username: userInfo.username,
            name: userInfo.name,
            pdf_type_label: getPdfTypeLabel(record.pdf_type),
            is_expired: isExpired,
            remaining_days: remainingDays
          };
        })
      );

      return res.json({
        success: true,
        records: formattedRecords
      });
    }

    // 更新二维码过期时间
    if (action === 'update') {
      if (!id || !expiresAt) {
        return res.status(400).json({
          success: false,
          error: '缺少必要的参数：id 和 expiresAt'
        });
      }

      // 验证日期格式
      const newExpiresAt = new Date(expiresAt);
      if (isNaN(newExpiresAt.getTime())) {
        return res.status(400).json({
          success: false,
          error: '无效的日期格式'
        });
      }

      // 格式化日期为 MySQL 兼容的格式
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const formattedExpiresAt = formatDate(newExpiresAt);

      // 更新数据库
      await database.execute(
        'UPDATE qr_code_urls SET expires_at = ? WHERE id = ?',
        [formattedExpiresAt, id]
      );

      logger.info(`✅ 已更新二维码过期时间`, {
        id,
        newExpiresAt: formattedExpiresAt
      });

      return res.json({
        success: true,
        message: '二维码过期时间已更新',
        newExpiresAt: formattedExpiresAt
      });
    }

    return res.status(400).json({
      success: false,
      error: '无效的操作类型'
    });
  } catch (err) {
    logger.error('管理PDF生成记录出错:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
};

/**
 * 获取PDF类型标签
 */
function getPdfTypeLabel(pdfType) {
  const labels = {
    degree: '学位验证',
    education: '学历验证',
    student_status: '学籍验证'
  };
  return labels[pdfType] || pdfType;
}

module.exports = managePdfGenerationHandler;
module.exports.initialize = initialize;
