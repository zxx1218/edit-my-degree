const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 引入PDF生成器模块
const generateDegreePdf = require('../pdf-generators/degree-pdf-generator');
const generateEducationPdf = require('../pdf-generators/education-pdf-generator');
const generateStudentStatusPdf = require('../pdf-generators/student-status-pdf-generator');

// 引入充值卡管理模块
const manageCards = require('../manage-cards');

// 引入认证模块
const authModule = require('../auth');

// 引入注册模块
const registerModule = require('../register');

// 引入新创建的接口模块
const getUserDataModule = require('../get-user-data');
const updateDataModule = require('../update-data');
const updateUserLoginsModule = require('../update-user-logins');
const changePasswordModule = require('../change-password');
const resetUserLoginsModule = require('../reset-user-logins');
const decreaseUserLoginsModule = require('../decrease-user-logins');
const getAllUsersModule = require('../get-all-users');
const queryUserModule = require('../query-user');
const decreasePdfLimitModule = require('../decrease-pdf-limit');
const getTodayLoginCountModule = require('../get-today-login-count');
const increasePdfLimitModule = require('../increase-pdf-limit');
const resetPdfLimitModule = require('../reset-pdf-limit');
const getHourlyLoginStatsModule = require('../get-hourly-login-stats');
const getLoginStatsRangeModule = require('../get-login-stats-range');
const queryUserLoginsPdfModule = require('../query-user-logins-pdf');
const getUserActivityHeatmapModule = require('../get-user-activity-heatmap');
const getTopActiveUsersModule = require('../get-top-active-users');
const getAnomalyLoginDetectionModule = require('../get-anomaly-login-detection');
const getMessagesModule = require('../get-messages');
const addMessageModule = require('../add-message');

// 引入 IP归属地查询工具
const { queryIPLocation, isChinaIP } = require('../ip-location');

// 从环境变量读取 IP 黑名单配置
const IP_BLACKLIST = process.env.IP_BLACKLIST 
  ? process.env.IP_BLACKLIST.split(',').map(ip => ip.trim()).filter(ip => ip)
  : [];

// IP封禁中间件 - 这个中间件使用了await方法，会让线程等待结果返回，会造成响应有延迟，后续需要考虑优化
const ipBlacklistMiddleware = async (req, res, next) => {
  // 获取客户端 IP 地址
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                  (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                  req.headers['x-real-ip'] || 'unknown';
  
  // 检查 IP 是否在黑名单中
  if (IP_BLACKLIST.includes(clientIp)) {
    console.warn('被封禁的 IP 地址发来请求', {
      ip: clientIp,
      url: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(403).json({
      success: false,
      error: '阿里云已将本机机器码拉黑，访问被拒绝！'
    });
  }
  
  // 检查是否为中国大陆地区 IP（本地测试 IP 除外）
  // const localTestIPs = ['127.0.0.1', '::1', 'localhost'];
  // if (!localTestIPs.includes(clientIp)) {
  //   const isChina = await isChinaIP(clientIp);
  //   if (!isChina) {
  //     console.warn('非中国大陆地区 IP 访问被拒绝', {
  //       ip: clientIp,
  //       url: req.path,
  //       method: req.method,
  //       userAgent: req.get('User-Agent')
  //     });
      
  //     return res.status(403).json({
  //       success: false,
  //       error: '傻逼玩意！AI 风控检测到访问异常！机器码已拉黑！'
  //     });
  //   }
  // }
  
  next();
};

// 为注册接口设置限流规则 - 每个 IP 每天最多 5 次注册（考虑并发情况）
const registrationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 天
  max: 5, // 增加一些容错，但核心防护在数据库层面
  message: {
    success: false,
    error: '注册次数太多了，稍后再试！'
  },
  standardHeaders: true, // 返回标准的 RateLimit-*头部
  legacyHeaders: false, // 不返回 X-RateLimit-*头部
});

// 为一般API设置全局限流规则 - 每个IP每10分钟最多50次请求
const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10分钟
  max: 50,
  message: {
    success: false,
    error: '透你妈傻逼，请求这来多干啥？你IP被封了！'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 签名验证中间件
const signatureValidationMiddleware = async (req, res, next) => {
  // 免签接口白名单
  const whitelist = [
    '/api/auth', // 登录接口
    '/api/admin-auth' // 管理员登录接口
  ];
  
  // 检查是否在白名单中
  if (whitelist.includes(req.path)) {
    return next();
  }
  
  // 获取客户端IP地址
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                  (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                  req.headers['x-real-ip'] || 'unknown';
  
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];
  const appKey = req.headers['x-app-key'];
  
  // 检查必要头部是否存在
  if (!timestamp || !signature || !appKey) {
    console.warn('签名验证失败: 缺少必要的认证信息', {
      url: req.path,
      method: req.method,
      headers: {
        timestamp: !!timestamp,
        signature: !!signature,
        appKey: !!appKey
      },
      userAgent: req.get('User-Agent'),
      ip: clientIp
    });
    return res.status(401).json({
      success: false,
      error: '缺少必要的认证信息'
    });
  }
  
  // 检查时间戳是否过期（允许5分钟的时间差）
  const requestTime = parseInt(timestamp);
  const currentTime = Date.now();
  if (Math.abs(currentTime - requestTime) > 5 * 60 * 1000) {
    console.warn('签名验证失败: 请求已过期', {
      url: req.path,
      method: req.method,
      requestTime,
      currentTime,
      diff: Math.abs(currentTime - requestTime),
      userAgent: req.get('User-Agent'),
      ip: clientIp
    });
    return res.status(401).json({
      success: false,
      error: '透你妈傻逼，你这请求他妈过期了！'
    });
  }
  
  // 验证App Key（在实际应用中应从数据库或配置文件中获取）
  const validAppKeys = process.env.VALID_APP_KEYS ? process.env.VALID_APP_KEYS.split(',') : ['default_app_key'];
  if (!validAppKeys.includes(appKey)) {
    console.warn('签名验证失败: 无效的App Key', {
      url: req.path,
      method: req.method,
      appKey,
      validAppKeys,
      userAgent: req.get('User-Agent'),
      ip: clientIp
    });
    return res.status(401).json({
      success: false,
      error: '透你妈傻逼，你他妈这是无效的Key，你他妈了个逼的再检查检查！'
    });
  }
  
  // 重新生成签名以供验证
  const method = req.method;
  const url = req.path;
  
  // 获取请求体参数
  let params = {};
  if (req.body && typeof req.body === 'object') {
    params = { ...req.body };
  }
  
  // 获取密钥（在实际应用中应从安全的地方获取）
  const secretKey = process.env.API_SECRET_KEY || 'default_secret_key';
  
  // 将参数按字典序排序并拼接成字符串
  const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  
  // 构造待签名字符串
  const signString = `${method.toUpperCase()}${url}${sortedParams}${timestamp}`;
  
  // 生成签名（使用简单哈希算法，实际项目中应使用HMAC-SHA256等更安全的方式）
  let hash = 0;
  for (let i = 0; i < signString.length; i++) {
    const char = signString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  // 使用secretKey来影响哈希值
  for (let i = 0; i < secretKey.length; i++) {
    const char = secretKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  const expectedSignature = Math.abs(hash).toString(16);
  
  // 验证签名
  if (signature !== expectedSignature) {
    console.warn('签名验证失败: 签名不匹配', {
      url: req.path,
      method: req.method,
      receivedSignature: signature,
      expectedSignature,
      signString,
      userAgent: req.get('User-Agent'),
      ip: clientIp
    });
    return res.status(401).json({
      success: false,
      error: '透你妈傻逼，失败了，听见了没？'
    });
  }
  
  // 签名验证通过
  // 异步查询 IP归属地（不阻塞主流程）
  queryIPLocation(clientIp).then(ipLocation => {
   console.info('签名验证通过', {
      url: req.path,
     userAgent: req.get('User-Agent'),
      ip: clientIp,
      ipLocation: ipLocation
    });
  }).catch(error => {
   console.warn('IP归属地查询失败:', error.message);
  });
  
  next();
};

function setupRoutes(app, db, JWT_SECRET) {
  // 应用IP黑名单中间件
  app.use(ipBlacklistMiddleware);
  
  // 初始化认证模块
  const { login, adminLogin } = authModule.initialize(db, JWT_SECRET);
  
  // 登录接口
  app.post('/api/auth', generalLimiter, login);

  // 管理员登录接口
  app.post('/api/admin-auth', generalLimiter, adminLogin);
  
  // 注册接口 - 应用三层防护：限流 + IP 验证 + 数据库频率检查
  app.post('/api/register', registrationLimiter, signatureValidationMiddleware, async (req, res) => {
   try {
     const registerHandlers = registerModule.initialize(db);
      await registerHandlers.register(req, res);
    } catch (error) {
     console.error('Register handler error:', error);
      res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  });
  
  // 初始化各接口模块
  // 获取用户数据接口 - 用于获取指定用户的所有相关数据
  app.post('/api/get-user-data', generalLimiter, signatureValidationMiddleware, getUserDataModule.initialize(db));
  // 更新数据接口 - 用于对指定表执行插入、更新或删除操作
  app.post('/api/update-data', generalLimiter, signatureValidationMiddleware, updateDataModule.initialize(db));
  // 更新用户登录次数接口 - 用于增加或减少用户剩余登录次数
  app.post('/api/update-user-logins', generalLimiter, signatureValidationMiddleware, updateUserLoginsModule.initialize(db));
  // 修改密码接口 - 用于用户更改自己的账户密码
  app.post('/api/change-password', generalLimiter, signatureValidationMiddleware, changePasswordModule.initialize(db));
  // 重置用户登录次数接口 - 用于将用户剩余登录次数重置为0
  app.post('/api/reset-user-logins', generalLimiter, signatureValidationMiddleware, resetUserLoginsModule.initialize(db));
  // 减少用户登录次数接口 - 用于减少指定用户的登录次数
  app.post('/api/decrease-user-logins', generalLimiter, signatureValidationMiddleware, decreaseUserLoginsModule.initialize(db));
  // 获取所有用户接口 - 用于管理员获取系统中的所有用户信息
  app.post('/api/get-all-users', generalLimiter, signatureValidationMiddleware, getAllUsersModule.initialize(db, JWT_SECRET));
  // 查询用户接口 - 用于根据条件查询特定用户信息
  app.post('/api/query-user', generalLimiter, signatureValidationMiddleware, queryUserModule.initialize(db));
  // 减少PDF限制接口 - 用于减少用户PDF下载积分
  app.post('/api/decrease-pdf-limit', generalLimiter, signatureValidationMiddleware, decreasePdfLimitModule.initialize(db));
  // 获取今日登录统计接口 - 用于获取当天系统的登录统计数据
  app.post('/api/get-today-login-count', generalLimiter, signatureValidationMiddleware, getTodayLoginCountModule.initialize(db));
  // 增加PDF限制接口 - 用于增加用户PDF下载积分
  app.post('/api/increase-pdf-limit', generalLimiter, signatureValidationMiddleware, increasePdfLimitModule.initialize(db));
  // 重置PDF限制接口 - 用于重置用户PDF下载积分为默认值
  app.post('/api/reset-pdf-limit', generalLimiter, signatureValidationMiddleware, resetPdfLimitModule.initialize(db));
  // 获取每小时登录统计接口 - 用于获取指定日期每小时的登录统计数据
  app.post('/api/get-hourly-login-stats', generalLimiter, signatureValidationMiddleware, getHourlyLoginStatsModule.initialize(db));
  // 获取登录统计范围接口 - 用于获取一周或一月内的登录统计数据
  app.post('/api/get-login-stats-range', generalLimiter, signatureValidationMiddleware, getLoginStatsRangeModule.initialize(db));
  // 查询用户登录次数和 PDF 积分接口 - 用于用户查询自己的登录次数和 PDF 积分
  app.post('/api/query-user-logins-pdf', generalLimiter, queryUserLoginsPdfModule.initialize(db));

  // 获取用户活跃度热力图接口 - 用于展示7天×24小时的登录密度分布
  app.post('/api/get-user-activity-heatmap', generalLimiter, signatureValidationMiddleware, getUserActivityHeatmapModule.initialize(db));
  
  // 获取Top活跃用户排行榜接口 - 用于显示登录次数最多的用户
  app.post('/api/get-top-active-users', generalLimiter, signatureValidationMiddleware, getTopActiveUsersModule.initialize(db));
  
  // 获取异常登录检测接口 - 用于检测频繁登录和异常时间段登录
  app.post('/api/get-anomaly-login-detection', generalLimiter, signatureValidationMiddleware, getAnomalyLoginDetectionModule.initialize(db));

  // 获取留言列表接口 - 用于获取所有用户的留言（分页）
  app.post('/api/get-messages', generalLimiter, getMessagesModule.initialize(db));
  
  // 添加留言接口 - 用于用户提交新留言
  app.post('/api/add-message', generalLimiter, addMessageModule.initialize(db));

  // 添加充值卡管理接口
  app.post('/api/manage-cards', generalLimiter, signatureValidationMiddleware, manageCards(db));

  // 生成学位验证报告PDF接口
  app.post('/api/generate-degree-pdf', generalLimiter, signatureValidationMiddleware, generateDegreePdf);

  // 生成学历PDF接口
  app.post('/api/generate-education-pdf', generalLimiter, signatureValidationMiddleware, generateEducationPdf);

  // 教育部学籍在线验证报告pdf生成接口
  app.post('/api/generate-student-status-pdf', generalLimiter, signatureValidationMiddleware, generateStudentStatusPdf);
}

module.exports = {
  setupRoutes,
  generalLimiter,
  registrationLimiter
};