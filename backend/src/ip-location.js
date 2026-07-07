const axios = require('axios');

// IP归属地查询缓存 - 存储格式: { location: string, timestamp: number }
const ipLocationCache = new Map();

// 判断是否为中国IP的缓存 - 存储格式: { isChina: boolean, timestamp: number }
const ipChinaCache = new Map();

// 缓存配置
const CACHE_CONFIG = {
  MAX_SIZE: 10000,           // 最大缓存条目数
  TTL: 24 * 60 * 60 * 1000   // 缓存有效期：24小时（毫秒）
};

/**
 * 清理过期缓存条目
 */
function cleanupExpiredCache() {
  const now = Date.now();
  
  // 清理位置缓存
  for (const [ip, data] of ipLocationCache.entries()) {
    if (now - data.timestamp > CACHE_CONFIG.TTL) {
      ipLocationCache.delete(ip);
    }
  }
  
  // 清理中国IP判断缓存
  for (const [ip, data] of ipChinaCache.entries()) {
    if (now - data.timestamp > CACHE_CONFIG.TTL) {
      ipChinaCache.delete(ip);
    }
  }
}

/**
 * 检查并清理缓存大小
 * 如果超过最大限制，删除最旧的50%条目
 */
function enforceCacheSizeLimit(cache) {
  if (cache.size > CACHE_CONFIG.MAX_SIZE) {
    const entries = Array.from(cache.entries());
    // 按时间戳排序，删除较旧的一半
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, Math.floor(cache.size / 2));
    toDelete.forEach(([ip]) => cache.delete(ip));
    console.log(`缓存清理：已删除 ${toDelete.length} 个过期条目`);
  }
}

/**
 * 设置缓存（带大小限制和自动清理）
 */
function setCache(cache, key, value) {
  // 定期清理过期缓存（每100次写入执行一次）
  if (Math.random() < 0.01) {
    cleanupExpiredCache();
  }
  
  cache.set(key, {
    ...value,
    timestamp: Date.now()
  });
  
  // 检查缓存大小
  enforceCacheSizeLimit(cache);
}

/**
 * 获取缓存（检查是否过期）
 */
function getCache(cache, key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  // 检查是否过期
  if (Date.now() - cached.timestamp > CACHE_CONFIG.TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached;
}

/**
 * 清洗和标准化地理位置数据
 * @param {string} rawLocation - 原始地理位置字符串
 * @returns {string} - 标准化后的地理位置
 */
function normalizeLocation(rawLocation) {
  if (!rawLocation || rawLocation === '未知') {
    return '未知';
  }
  
  // 移除无效字符和关键词
  let cleaned = rawLocation
    .replace(/[Xx×]/g, '')           // 移除X字符
    .replace(/undefined/gi, '')      // 移除undefined
    .replace(/null/gi, '')           // 移除null
    .replace(/NaN/gi, '')            // 移除NaN
    .trim();
  
  // 如果清洗后为空或太短，返回未知
  if (!cleaned || cleaned.length < 2) {
    return '未知';
  }
  
  // 省份名称标准化映射表
  const provinceMap = {
    '北京': '北京市',
    '天津': '天津市',
    '上海': '上海市',
    '重庆': '重庆市',
    '广西': '广西壮族自治区',
    '内蒙古': '内蒙古自治区',
    '西藏': '西藏自治区',
    '宁夏': '宁夏回族自治区',
    '新疆': '新疆维吾尔自治区'
  };
  
  // 应用省份映射
  for (const [short, full] of Object.entries(provinceMap)) {
    if (cleaned.startsWith(short) && !cleaned.startsWith(full)) {
      cleaned = cleaned.replace(short, full);
      break;
    }
  }
  
  // 移除重复的"省"、"市"等后缀
  cleaned = cleaned
    .replace(/省省/g, '省')
    .replace(/市市/g, '市')
    .replace(/自治区区/g, '自治区')
    .trim();
  
  return cleaned;
}

/**
 * 查询 IP归属地
 * @param {string} ip - 客户端 IP 地址
 * @returns {Promise<string>} - 返回归属地信息
 */
async function queryIPLocation(ip) {
  // 检查缓存
  const cached = getCache(ipLocationCache, ip);
  if (cached) {
    return cached.location;
  }

  let location = null;

  // 1. 优先使用淘宝 API
  try {
    const response = await axios.get(`https://ip.taobao.com/outGetIpInfo?ip=${ip}&accessKey=alibaba-inc`, {
     timeout: 3000,
     validateStatus: () => true
    });

    if (response.data && response.data.code === 0 && response.data.data) {
      const data = response.data.data;
      location = `${data.country}${data.region || ''}${data.city || ''}${data.isp || ''}`.trim();
      if (location) {
        location = normalizeLocation(location);
        if (location !== '未知') {
          setCache(ipLocationCache, ip, { location });
          console.log(`✅ 淘宝API查询成功 [${ip}]: ${location}`);
          return location;
        }
      }
    }
  } catch (error) {
    console.warn(`淘宝 API 查询 IP归属地失败 [${ip}]:`, error.message);
  }

  // 3. 最后备选：ip-api.com
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,country,regionName,city`, {
     timeout: 3000,
     validateStatus: () => true
    });

    if (response.data && response.data.status === 'success') {
      location = `${response.data.country}${response.data.regionName}${response.data.city}`;
      if (location) {
        location = normalizeLocation(location);
        if (location !== '未知') {
          setCache(ipLocationCache, ip, { location });
          console.log(`✅ ip-api.com查询成功 [${ip}]: ${location}`);
          return location;
        }
      }
    }
  } catch (error) {
    console.warn(`ip-api.com 查询 IP归属地失败 [${ip}]:`, error.message);
  }

  // 如果所有查询都失败或返回空结果，缓存"未知"
  location = '未知';
  setCache(ipLocationCache, ip, { location });
  console.warn(`⚠️  所有API均查询失败 [${ip}]，返回"未知"`);
  return location;
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

  // 检查缓存
  const cached = getCache(ipChinaCache, ip);
  if (cached) {
    return cached.isChina;
  }

  let isChina = null;

  // 优先使用淘宝 API
  try {
    const response = await axios.get(`https://ip.taobao.com/outGetIpInfo?ip=${ip}&accessKey=alibaba-inc`, {
     timeout: 3000,
     validateStatus: () => true
    });

    if (response.data && response.data.code === 0 && response.data.data) {
      const country = response.data.data.country;
      // 判断是否为中国
      isChina = country === '中国' || country === 'China';
      setCache(ipChinaCache, ip, { isChina });
      return isChina;
    }
  } catch (error) {
    console.warn(`淘宝 API 判断中国 IP 失败 [${ip}]:`, error.message);
  }

  // 最后备选：ip-api.com
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,country`, {
     timeout: 3000,
     validateStatus: () => true
    });

    if (response.data && response.data.status === 'success') {
      const country = response.data.country;
      isChina = country === '中国' || country === 'China';
      setCache(ipChinaCache, ip, { isChina });
      return isChina;
    }
  } catch (error) {
    console.warn(`ip-api.com 判断中国 IP 失败 [${ip}]:`, error.message);
  }

  // 如果所有查询都失败，默认成功并缓存结果
  isChina = true;
  setCache(ipChinaCache, ip, { isChina });
  return isChina;
}

module.exports = { queryIPLocation, isChinaIP };
