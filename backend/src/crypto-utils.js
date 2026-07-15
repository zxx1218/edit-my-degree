/**
 * 加密解密工具模块
 * 用于充值卡ID的加密传输和验证
 */

/**
 * 加密字符串（使用Base64编码）
 * @param {string} text - 待加密的文本
 * @returns {string} Base64编码后的字符串
 */
function encrypt(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('加密输入必须是非空字符串');
  }
  return Buffer.from(text, 'utf-8').toString('base64');
}

/**
 * 解密字符串（使用Base64解码）
 * @param {string} encryptedText - Base64编码的字符串
 * @returns {string} 解密后的原始文本
 */
function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') {
    throw new Error('解密输入必须是非空字符串');
  }
  
  try {
    return Buffer.from(encryptedText, 'base64').toString('utf-8');
  } catch (error) {
    throw new Error(`解密失败: ${error.message}`);
  }
}

/**
 * 验证管理员Token
 * @param {string} token - JWT Token
 * @param {string} jwtSecret - JWT密钥
 * @returns {Object} 解码后的token信息
 */
function verifyAdminToken(token, jwtSecret) {
  const jwt = require('jsonwebtoken');
  
  if (!token || typeof token !== 'string') {
    throw new Error('管理员Token不能为空');
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret || process.env.JWT_SECRET || 'default_jwt_secret');
    
    // 验证是否为管理员（兼容两种命名方式）
    if (!decoded.is_admin && !decoded.isAdmin) {
      throw new Error('该Token不属于管理员账户');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('管理员Token已过期');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('管理员Token无效');
    }
    throw error;
  }
}

module.exports = {
  encrypt,
  decrypt,
  verifyAdminToken
};
