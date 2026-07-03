const crypto = require('crypto');
const logger = require('./logger');

// 生成短码的字符集（去除易混淆字符）
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SHORT_CODE_LENGTH = 10; // 短码长度

/**
 * 生成唯一短码
 * @returns {string} 生成的短码
 */
function generateShortCode() {
  const bytes = crypto.randomBytes(SHORT_CODE_LENGTH);
  let shortCode = '';
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    shortCode += CHARSET[bytes[i] % CHARSET.length];
  }
  return shortCode;
}

/**
 * 初始化二维码管理器
 * @param {object} db - 数据库连接对象
 * @returns {object} 包含相关方法的对象
 */
function initialize(db) {
  
  /**
   * 保存URL并生成短码
   * @param {string} fullUrl - 完整的URL
   * @param {string} pdfType - PDF类型: 'degree', 'education', 'student_status'
   * @param {number} expiresInDays - 过期天数（可选，默认7天）
   * @returns {Promise<string>} 返回生成的短码
   */
  async function saveUrlWithShortCode(fullUrl, pdfType, expiresInDays = 7) {
    try {
      logger.info(`🔄 开始为 ${pdfType} PDF 生成二维码短码`);
      
      // 生成唯一短码
      let shortCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!isUnique && attempts < maxAttempts) {
        shortCode = generateShortCode();
        
        // 检查短码是否已存在
        const [existing] = await db.execute(
          'SELECT id FROM qr_code_urls WHERE short_code = ?',
          [shortCode]
        );
        
        if (existing.length === 0) {
          isUnique = true;
        }
        
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('无法生成唯一短码，请重试');
      }
      
      // 计算过期时间
      const now = new Date();
      const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
      
      // 格式化日期为 MySQL 兼容的格式: YYYY-MM-DD HH:MM:SS
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };
      
      const createdAtStr = formatDate(now);
      const expiresAtStr = formatDate(expiresAt);
      
      logger.info(`📅 创建时间: ${createdAtStr}, 过期时间: ${expiresAtStr}, 有效期: ${expiresInDays}天`);
      
      // 保存到数据库
      await db.execute(
        'INSERT INTO qr_code_urls (short_code, full_url, pdf_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
        [shortCode, fullUrl, pdfType, createdAtStr, expiresAtStr]
      );
      
      logger.info(`✅ 二维码短码生成成功: ${shortCode}`);
      return shortCode;
    } catch (error) {
      logger.error(`❌ 生成二维码短码失败: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 根据短码获取完整URL
   * @param {string} shortCode - 短码
   * @returns {Promise<object|null>} 返回包含fullUrl的对象，如果不存在或已过期则返回null
   */
  async function getUrlByShortCode(shortCode) {
    try {
      logger.info(`🔍 查询短码对应的URL: ${shortCode}`);
      
      // 查询短码记录
      const [rows] = await db.execute(
        'SELECT full_url, pdf_type, expires_at, scan_count FROM qr_code_urls WHERE short_code = ?',
        [shortCode]
      );
      
      if (rows.length === 0) {
        logger.warn(`⚠️ 短码不存在: ${shortCode}`);
        return null;
      }
      
      const record = rows[0];
      
      // 检查是否过期
      if (record.expires_at) {
        const now = new Date();
        const expiresAt = new Date(record.expires_at);
        
        logger.info(`📅 日期比较详情:`, {
          shortCode,
          currentTime: now.toISOString(),
          currentTimeTimestamp: now.getTime(),
          expiresAt: expiresAt.toISOString(),
          expiresAtTimestamp: expiresAt.getTime(),
          isExpired: now > expiresAt,
          timeDiff: now.getTime() - expiresAt.getTime(),
          timeDiffHours: (now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60)
        });
        
        if (now > expiresAt) {
          logger.warn(`⚠️ 短码已过期: ${shortCode}, 过期时间: ${expiresAt.toLocaleString('zh-CN')}`);
          return null;
        }
      }
      
      // 更新扫描统计
      await db.execute(
        'UPDATE qr_code_urls SET scan_count = scan_count + 1, last_scanned_at = NOW() WHERE short_code = ?',
        [shortCode]
      );
      
      logger.info(`✅ 找到短码对应的URL，类型: ${record.pdf_type}, 扫描次数: ${record.scan_count + 1}`);
      
      return {
        fullUrl: record.full_url,
        pdfType: record.pdf_type
      };
    } catch (error) {
      logger.error(`❌ 查询短码失败: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 清理过期的短码记录
   * @param {number} daysToKeep - 保留天数（默认30天）
   * @returns {Promise<number>} 返回删除的记录数
   */
  async function cleanExpiredCodes(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const [result] = await db.execute(
        'DELETE FROM qr_code_urls WHERE expires_at < ? OR (expires_at IS NULL AND created_at < ?)',
        [cutoffDate.toISOString().slice(0, 19).replace('T', ' '), cutoffDate.toISOString().slice(0, 19).replace('T', ' ')]
      );
      
      logger.info(`🗑️ 清理了 ${result.affectedRows} 条过期的二维码记录`);
      return result.affectedRows;
    } catch (error) {
      logger.error(`❌ 清理过期短码失败: ${error.message}`);
      throw error;
    }
  }
  
  return {
    saveUrlWithShortCode,
    getUrlByShortCode,
    cleanExpiredCodes
  };
}

module.exports = {
  initialize,
  generateShortCode
};
