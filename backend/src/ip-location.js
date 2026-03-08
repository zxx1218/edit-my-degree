const axios = require('axios');

// IP 归属地查询缓存
const ipLocationCache = new Map();

/**
 * 查询 IP 归属地
 * @param {string} ip - 客户端 IP地址
 * @returns {Promise<string>} - 返回归属地信息
 */
async function queryIPLocation(ip) {
  // 检查缓存
  if (ipLocationCache.has(ip)) {
    return ipLocationCache.get(ip);
  }

  try {
    // 使用淘宝 IP地址查询 API（国内访问更稳定）
    const response = await axios.get(`https://ip.taobao.com/outGetIpInfo?ip=${ip}&accessKey=alibaba-inc`, {
      timeout: 5000,
      validateStatus: () => true
    });

    if (response.data && response.data.code === 0 && response.data.data) {
      const data = response.data.data;
      const location = `${data.country}${data.region || ''}${data.city || ''}${data.isp || ''}`.trim();
      if (location) {
        ipLocationCache.set(ip, location);
        return location;
      }
    }
  } catch (error) {
    console.warn(`淘宝 API 查询 IP 归属地失败 [${ip}]:`, error.message);
  }

  try {
    // 备用方案：使用 ip-api.com
    const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,country,regionName,city`, {
      timeout: 5000,
      validateStatus: () => true
    });

    if (response.data && response.data.status === 'success') {
      const location = `${response.data.country}${response.data.regionName}${response.data.city}`;
      ipLocationCache.set(ip, location);
      return location;
    }
  } catch (error) {
    console.warn(`ip-api.com 查询 IP 归属地失败 [${ip}]:`, error.message);
  }

  // 如果所有查询都失败，返回未知
  ipLocationCache.set(ip, '未知');
  return '未知';
}

module.exports = { queryIPLocation };
