/**
 * 从请求对象中提取客户端真实IP地址
 * @param {Object} req - Express请求对象
 * @returns {string} 客户端IP地址
 */
function getClientIp(req) {
  return req.ip
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null)
    || req.headers['x-real-ip']
    || 'unknown';
}

module.exports = { getClientIp };
