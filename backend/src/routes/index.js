const rateLimit = require('express-rate-limit');

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

// 为注册接口设置限流规则 - 每个IP每60分钟最多10次注册尝试（方便测试）
const registrationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1小时
  max: 2, // 限制每个IP在窗口期内最多发送10个请求
  message: {
    success: false,
    error: '注册请求过于频繁'
  },
  standardHeaders: true, // 返回标准的RateLimit-*头部
  legacyHeaders: false, // 不返回X-RateLimit-*头部
});

// 为一般API设置全局限流规则 - 每个IP每10分钟最多100次请求
const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10分钟
  max: 100,
  message: {
    success: false,
    error: '请求过于频繁'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 签名验证中间件
const signatureValidationMiddleware = (req, res, next) => {
  // 免签接口白名单
  const whitelist = [
    '/api/auth',
    '/api/admin-auth',
    '/api/get-today-login-count',
    '/api/get-hourly-login-stats',
    '/api/get-login-stats-range',
    '/api/generate-degree-pdf',
    '/api/generate-education-pdf',
    '/api/generate-student-status-pdf',
    // 不会影响安全性，因为decrease-pdf-limit接口本身已经有逻辑验证用户身份
    // （通过username参数），并且只会在用户确实拥有足够积分时才进行扣除操作。
    // '/api/decrease-pdf-limit', 
    '/api/manage-cards',
    '/api/decrease-user-logins'
  ];
  
  // 检查是否在白名单中
  if (whitelist.includes(req.path)) {
    return next();
  }
  
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];
  const appKey = req.headers['x-app-key'];
  
  // 检查必要头部是否存在
  if (!timestamp || !signature || !appKey) {
    return res.status(401).json({
      success: false,
      error: '缺少必要的认证信息'
    });
  }
  
  // 检查时间戳是否过期（允许5分钟的时间差）
  const requestTime = parseInt(timestamp);
  const currentTime = Date.now();
  if (Math.abs(currentTime - requestTime) > 5 * 60 * 1000) {
    return res.status(401).json({
      success: false,
      error: '请求已过期'
    });
  }
  
  // 验证App Key（在实际应用中应从数据库或配置文件中获取）
  const validAppKeys = process.env.VALID_APP_KEYS ? process.env.VALID_APP_KEYS.split(',') : ['default_app_key'];
  if (!validAppKeys.includes(appKey)) {
    return res.status(401).json({
      success: false,
      error: '无效的App Key'
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
    return res.status(401).json({
      success: false,
      error: '傻逼，签名验证失败了，听见了没？'
    });
  }
  
  // 签名验证通过
  next();
};

function setupRoutes(app, db, JWT_SECRET) {
  // 初始化认证模块
  const { login, adminLogin } = authModule.initialize(db, JWT_SECRET);
  
  // 登录接口
  app.post('/api/auth', generalLimiter, login);

  // 管理员登录接口
  app.post('/api/admin-auth', generalLimiter, adminLogin);
  
  // 注册接口
  app.post('/api/register', registrationLimiter, async (req, res) => {
    try {
      const registerHandlers = registerModule.initialize(db);
      await registerHandlers.register(req, res);
    } catch (error) {
      console.error('Register handler error:', error);
      res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  });
  
  // 初始化各接口模块 (需要签名验证的接口)
  app.post('/api/get-user-data', generalLimiter, signatureValidationMiddleware, getUserDataModule.initialize(db));
  app.post('/api/update-data', generalLimiter, signatureValidationMiddleware, updateDataModule.initialize(db));
  app.post('/api/update-user-logins', generalLimiter, signatureValidationMiddleware, updateUserLoginsModule.initialize(db));
  app.post('/api/change-password', generalLimiter, signatureValidationMiddleware, changePasswordModule.initialize(db));
  app.post('/api/reset-user-logins', generalLimiter, signatureValidationMiddleware, resetUserLoginsModule.initialize(db));
  app.post('/api/decrease-user-logins', generalLimiter, signatureValidationMiddleware, decreaseUserLoginsModule.initialize(db));
  app.post('/api/get-all-users', generalLimiter, signatureValidationMiddleware, getAllUsersModule.initialize(db, JWT_SECRET));
  app.post('/api/query-user', generalLimiter, signatureValidationMiddleware, queryUserModule.initialize(db));
  app.post('/api/decrease-pdf-limit', generalLimiter, signatureValidationMiddleware, decreasePdfLimitModule.initialize(db));
  app.post('/api/get-today-login-count', generalLimiter, signatureValidationMiddleware, getTodayLoginCountModule.initialize(db));
  app.post('/api/increase-pdf-limit', generalLimiter, signatureValidationMiddleware, increasePdfLimitModule.initialize(db));
  app.post('/api/reset-pdf-limit', generalLimiter, signatureValidationMiddleware, resetPdfLimitModule.initialize(db));
  app.post('/api/get-hourly-login-stats', generalLimiter, signatureValidationMiddleware, getHourlyLoginStatsModule.initialize(db));
  app.post('/api/get-login-stats-range', generalLimiter, signatureValidationMiddleware, getLoginStatsRangeModule.initialize(db));
  
  // 添加充值卡管理接口
  app.post('/api/manage-cards', generalLimiter, signatureValidationMiddleware, manageCards(db));

  // 生成学位验证报告PDF接口 (不需要签名验证)
  app.post('/api/generate-degree-pdf', generalLimiter, generateDegreePdf);

  // 生成学历PDF接口 (不需要签名验证)
  app.post('/api/generate-education-pdf', generalLimiter, generateEducationPdf);

  // 教育部学籍在线验证报告pdf生成接口 (不需要签名验证)
  app.post('/api/generate-student-status-pdf', generalLimiter, generateStudentStatusPdf);
}

module.exports = {
  setupRoutes,
  generalLimiter,
  registrationLimiter
};