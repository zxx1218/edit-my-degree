/**
 * 测试省份提取逻辑
 */

const PROVINCE_NAME_MAP = {
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
  '北京': '北京市',
  '上海': '上海市',
  '天津': '天津市',
  '重庆': '重庆市',
  '香港': '香港特别行政区',
  '澳门': '澳门特别行政区',
  '台湾': '台湾省'
};

function extractProvince(location) {
  let province = '未知';
  
  if (location && location !== '未知') {
    // 策略1: 匹配标准省份格式（如"浙江省"、"广东省"）- 保留"省"字
    const provinceMatch = location.match(/中国(.*?省)/);
    if (provinceMatch) {
      province = provinceMatch[1];
    }
    // 策略2: 匹配自治区
    else if (location.includes('自治区')) {
      const autoRegionMatch = location.match(/中国(.*?自治区)/);
      if (autoRegionMatch) {
        province = autoRegionMatch[1];
      }
    }
    // 策略3: 匹配直辖市
    else if (location.includes('北京')) {
      province = '北京市';
    } else if (location.includes('上海')) {
      province = '上海市';
    } else if (location.includes('天津')) {
      province = '天津市';
    } else if (location.includes('重庆')) {
      province = '重庆市';
    }
    // 策略4: 匹配特别行政区
    else if (location.includes('香港')) {
      province = '香港特别行政区';
    } else if (location.includes('澳门')) {
      province = '澳门特别行政区';
    } else if (location.includes('台湾')) {
      province = '台湾省';
    }
    // 策略5: 使用省份名称映射表
    else {
      const provinceKeys = Object.keys(PROVINCE_NAME_MAP);
      for (const key of provinceKeys) {
        if (location.includes('中国' + key)) {
          province = PROVINCE_NAME_MAP[key];
          break;
        }
      }
    }
  }
  
  return province;
}

// 测试用例
const testCases = [
  '中国浙江Hezhuang',
  '中国浙江杭州电信',
  '中国浙江湖州移动',
  '中国新疆塔城移动',
  '中国湖南坪塘',
  '中国山西太原电信',
  '中国辽宁XX联通',
  '中国北京北京广电',
  '中国上海市浦东新区',
  '中国广西壮族自治区南宁'
];

console.log('=== 省份提取逻辑测试 ===\n');
testCases.forEach(test => {
  const result = extractProvince(test);
  const status = result !== '未知' ? '✅' : '❌';
  console.log(`${status} "${test}" → "${result}"`);
});

console.log('\n=== 测试完成 ===');
