const logger = require('./logger');
const qrCodeManager = require('./qr-code-manager');

/**
 * 初始化二维码重定向处理器
 * @param {object} db - 数据库连接对象
 * @returns {Function} Express中间件函数
 */
function initialize(db) {
  const qrManager = qrCodeManager.initialize(db);
  
  return async (req, res) => {
    try {
      const { shortCode } = req.params;
      
      if (!shortCode) {
        logger.warn('⚠️ 二维码重定向请求缺少短码参数');
        return res.status(400).json({
          success: false,
          error: '缺少短码参数'
        });
      }
      
      logger.info(`🔍 处理二维码重定向请求，短码: ${shortCode}`);
      
      // 查询短码对应的完整URL
      const result = await qrManager.getUrlByShortCode(shortCode);
      
      if (!result) {
        logger.warn(`⚠️ 短码无效或已过期: ${shortCode}`);
        return res.status(404).json({
          success: false,
          error: '二维码已过期或无效'
        });
      }
      
      logger.info(`✅ 找到短码对应的URL，类型: ${result.pdfType}`);
      
      // 直接重定向到完整URL（包含所有查询参数）
      const redirectUrl = result.fullUrl;
      
      logger.info(`🔄 重定向到: ${redirectUrl}`);
      
      // 执行重定向
      res.redirect(302, redirectUrl);
      
    } catch (error) {
      logger.error(`❌ 二维码重定向处理失败: ${error.message}`, {
        stack: error.stack
      });
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
