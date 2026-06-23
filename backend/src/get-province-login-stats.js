/**
 * 获取省份登录统计接口
 * @param {Object} db - 数据库连接实例
 */
const { queryIPLocation } = require('./ip-location');

// 省份统计缓存（5分钟TTL）
let provinceStatsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

// 省份名称映射表（用于处理不带"省/市/自治区"的情况）
const PROVINCE_NAME_MAP = {
  // 普通省份
  '浙江': '浙江省',
  '江苏': '江苏省',
  '广东': '广东省',
  '山东': '山东省',
  '河南': '河南省',
  '河北': '河北省',
  '湖南': '湖南省',
  '湖北': '湖北省',
  '福建': '福建省',
  '安徽': '安徽省',
  '四川': '四川省',
  '辽宁': '辽宁省',
  '陕西': '陕西省',
  '江西': '江西省',
  '云南': '云南省',
  '广西': '广西壮族自治区',
  '山西': '山西省',
  '贵州': '贵州省',
  '甘肃': '甘肃省',
  '海南': '海南省',
  '青海': '青海省',
  '吉林': '吉林省',
  '黑龙江': '黑龙江省',
  '宁夏': '宁夏回族自治区',
  '新疆': '新疆维吾尔自治区',
  '西藏': '西藏自治区',
  '内蒙古': '内蒙古自治区',
  // 直辖市
  '北京': '北京市',
  '上海': '上海市',
  '天津': '天津市',
  '重庆': '重庆市',
  // 特别行政区
  '香港': '香港特别行政区',
  '澳门': '澳门特别行政区',
  '台湾': '台湾省'
};

function initialize(db) {
  return async (req, res) => {
    try {
      const now = Date.now();
      
      // 检查缓存是否有效
      if (provinceStatsCache && (now - cacheTimestamp) < CACHE_TTL) {
        console.log('[省份统计] 使用缓存数据');
        return res.json({
          success: true,
          ...provinceStatsCache,
          fromCache: true
        });
      }
      
      console.log('[省份统计] 查询数据库...');
      
      // 直接从login_logs表获取最近一年的登录记录，包含IP和地理位置
      const [loginRecords] = await db.execute(`
        SELECT 
          login_ip as ip,
          ip_location as location,
          COUNT(*) as login_count,
          COUNT(DISTINCT user_id) as user_count
        FROM login_logs
        WHERE login_time >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
          AND login_ip IS NOT NULL
          AND login_ip != ''
          AND login_ip != 'unknown'
        GROUP BY login_ip, ip_location
        ORDER BY login_count DESC
      `);

      console.log(`[省份统计] 查询到 ${loginRecords.length} 个IP`);

      // 对每个IP进行省份提取并聚合到省份级别
      const provinceMap = new Map();
      let processedCount = 0;
      
      for (const record of loginRecords) {
        if (!record.ip || !record.location) continue;
        
        processedCount++;
        
        // 每处理10个IP输出一次进度
        if (processedCount % 10 === 0) {
          console.log(`[省份统计] 已处理 ${processedCount}/${loginRecords.length} 个IP`);
        }
        
        // 提取省份信息（优化版本，保持与地图数据一致的名称格式）
        let province = '未知';
        const location = record.location;
        
        if (location && location !== '未知') {
          // 策略1: 匹配标准省份格式（如"浙江省"、"广东省"）- 保留"省"字
          const provinceMatch = location.match(/中国(.*?省)/);
          if (provinceMatch) {
            province = provinceMatch[1]; // 保留"省"字，如"浙江省"
          }
          // 策略2: 匹配自治区（如"广西壮族自治区"、"宁夏回族自治区"）- 保留完整名称
          else if (location.includes('自治区')) {
            const autoRegionMatch = location.match(/中国(.*?自治区)/);
            if (autoRegionMatch) {
              province = autoRegionMatch[1]; // 保留"自治区"，如"广西壮族自治区"
            }
          }
          // 策略3: 匹配直辖市（北京、上海、天津、重庆）- 添加"市"字
          else if (location.includes('北京')) {
            province = '北京市';
          } else if (location.includes('上海')) {
            province = '上海市';
          } else if (location.includes('天津')) {
            province = '天津市';
          } else if (location.includes('重庆')) {
            province = '重庆市';
          }
          // 策略4: 匹配特别行政区 - 保留完整名称
          else if (location.includes('香港')) {
            province = '香港特别行政区';
          } else if (location.includes('澳门')) {
            province = '澳门特别行政区';
          } else if (location.includes('台湾')) {
            province = '台湾省';
          }
          // 策略5: 如果以上都失败，尝试使用省份名称映射表
          else {
            // 从归属地中提取可能的省份关键词
            // 遍历所有已知的省份简称，检查是否在location中
            const provinceKeys = Object.keys(PROVINCE_NAME_MAP);
            for (const key of provinceKeys) {
              if (location.includes('中国' + key)) {
                province = PROVINCE_NAME_MAP[key];
                break;
              }
            }
          }
          
          // 调试日志：输出前5个IP的解析结果
          // if (processedCount <= 5) {
          //   console.log(`[省份统计] IP=${record.ip}, 归属地="${location}", 提取省份="${province}"`);
          // }
        }
        
        // 累加该省份的登录次数
        if (provinceMap.has(province)) {
          const existing = provinceMap.get(province);
          provinceMap.set(province, {
            province: province,
            loginCount: existing.loginCount + record.login_count,
            userCount: existing.userCount + record.user_count
          });
        } else {
          provinceMap.set(province, {
            province: province,
            loginCount: record.login_count,
            userCount: record.user_count
          });
        }
      }
      
      console.log(`[省份统计] 处理完成，共 ${provinceMap.size} 个省份`);
      
      // 转换为数组并排序
      const provinceStats = Array.from(provinceMap.values())
        .sort((a, b) => b.loginCount - a.loginCount);
      
      const result = {
        provinceStats,
        totalProvinces: provinceStats.length,
        totalLogins: provinceStats.reduce((sum, p) => sum + p.loginCount, 0)
      };
      
      // 更新缓存
      provinceStatsCache = result;
      cacheTimestamp = now;
      
      res.json({
        success: true,
        ...result,
        fromCache: false
      });
    } catch (err) {
      console.error('获取省份登录统计失败:', err);
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
