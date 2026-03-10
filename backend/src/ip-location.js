const axios = require('axios');

// IP归属地查询缓存
const ipLocationCache = new Map();

/**
 * 查询 IP归属地
 * @param {string} ip - 客户端 IP 地址
 * @returns {Promise<string>} - 返回归属地信息
 */
async function queryIPLocation(ip) {
  // 检查缓存
  if (ipLocationCache.has(ip)) {
    return ipLocationCache.get(ip);
  }

  try {
    // 使用淘宝 IP 地址查询 API（国内访问更稳定）
    const response = await axios.get(`https://ip.taobao.com/outGetIpInfo?ip=${ip}&accessKey=alibaba-inc`, {
     timeout: 3000,
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
    console.warn(`淘宝 API 查询 IP归属地失败 [${ip}]:`, error.message);
  }

  try {
    // 备用方案：使用 ip-api.com
    const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,country,regionName,city`, {
     timeout: 3000,
     validateStatus: () => true
    });

    if (response.data && response.data.status === 'success') {
      const location = `${response.data.country}${response.data.regionName}${response.data.city}`;
      ipLocationCache.set(ip, location);
      return location;
    }
  } catch (error) {
    console.warn(`ip-api.com 查询 IP归属地失败 [${ip}]:`, error.message);
  }

  // 如果所有查询都失败，返回未知
  ipLocationCache.set(ip, '未知');
  return '未知';
}

/**
 * 判断是否为中国大陆地区 IP
 * @param {string} ip - 客户端 IP 地址
 * @returns {Promise<boolean>} - 返回是否为中国 IP
 */
async function isChinaIP(ip) {
  // 本地测试 IP 段允许访问
  const localTestIPs = ['127.0.0.1', '::1', 'localhost'];
  if (localTestIPs.includes(ip)) {
    return true;
  }

  try {
    // 使用淘宝 IP 地址查询 API
    const response = await axios.get(`https://ip.taobao.com/outGetIpInfo?ip=${ip}&accessKey=alibaba-inc`, {
     timeout: 3000,
     validateStatus: () => true
    });

    if (response.data && response.data.code === 0 && response.data.data) {
      const country = response.data.data.country;
      // 判断是否为中国
      return country === '中国' || country === 'China';
    }
  } catch (error) {
    console.warn(`淘宝 API 判断中国 IP 失败 [${ip}]:`, error.message);
  }

  // 备用方案：使用 ip-api.com
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,country`, {
     timeout: 3000,
     validateStatus: () => true
    });

    if (response.data && response.data.status === 'success') {
      const country = response.data.country;
      return country === '中国' || country === 'China';
    }
  } catch (error) {
    console.warn(`ip-api.com 判断中国 IP 失败 [${ip}]:`, error.message);
  }

  // 如果所有查询都失败，默认成功
  return true;
}

module.exports = { queryIPLocation, isChinaIP };
