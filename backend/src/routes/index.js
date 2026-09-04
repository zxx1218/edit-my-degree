const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../../.env' }); // 加载根目录的.env文件

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
const getMessagesModule = require('../get-messages');
const addMessageModule = require('../add-message');
const deleteUserModule = require('../delete-user');
const getTodayLoginDetailsModule = require('../get-today-login-details');
const getProvinceLoginStatsModule = require('../get-province-login-stats');
const getUserCardHistoryModule = require('../get-user-card-history');
const adminImpersonateLoginModule = require('../admin-impersonate-login');
const resetPasswordModule = require('../reset-password');

// 引入IP黑名单管理模块
const manageIpBlacklistModule = require('../manage-ip-blacklist');

// 引入PDF生成管理模块
const managePdfGenerationModule = require('../manage-pdf-generation');

// 引入二维码重定向模块
const qrRedirectModule = require('../qr-redirect');

// 引入 IP归属地查询工具
const { queryIPLocation, isChinaIP } = require('../ip-location');

// 引入邮件通知模块
const { sendSecurityAlert } = require('../email-notifier');

// IP封禁中间件 - 这个中间件使用了await方法，会让线程等待结果返回，会造成响应有延迟，后续需要考虑优化
const ipBlacklistMiddleware = async (req, res, next) => {
  // 获取客户端 IP 地址
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                  (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                  req.headers['x-real-ip'] || 'unknown';
  
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

// 为一般API设置全局限流规则 - 每个IP每5分钟最多100次请求
const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 100,
  message: {
    success: false,
    error: '请求过多，IP已经封禁！'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 充值卡创建操作的严格限流 - 每个IP每小时最多3次（管理员操作）
const cardCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 非常严格：每小时最多3次创建操作
  message: {
    success: false,
    error: '充值卡创建操作过于频繁（每小时最多3次），请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // 基于IP和管理员ID进行限流，使用 ipKeyGenerator 正确处理 IPv6 地址
    const adminId = req.adminUser ? req.adminUser.id : 'unknown';
    const ip = ipKeyGenerator(req);
    return `${ip}_${adminId}`;
  }
});

// 充值卡使用操作的限流 - 每个IP每分钟最多10次
const cardUseLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10,
  message: {
    success: false,
    error: '充值卡使用操作过于频繁（每分钟最多10次），请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // 使用 ipKeyGenerator 正确处理 IPv6 地址
    return ipKeyGenerator(req);
  }
});

// PDF生成操作的严格限流 - 每用户每分钟最多2次，每小时最多10次
const pdfGenerationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 2, // 每分钟最多2次
  message: {
    success: false,
    error: 'PDF生成操作过于频繁（每分钟最多2次），请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // 基于用户ID限流，如果没有用户ID则基于IP
    const userId = req.user ? req.user.id : 'unknown';
    const ip = ipKeyGenerator(req);
    return `${ip}_${userId}`;
  }
});

// JWT认证中间件
const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: '未提供认证令牌' 
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      error: '无效的认证令牌' 
    });
  }
};

// 区块链节点验证中间件
const blockchainNodeValidationMiddleware = (req, res, next) => {
  const { blockchain_node } = req.body;
  
  // 检查是否提供了blockchain_node字段
  if (!blockchain_node) {
    return res.status(400).json({
      success: false,
      error: '区块链节点校验失败'
    });
  }
  
  // 从请求头中获取时间戳（签名验证中间件已经提取过）
  const timestamp = req.headers['x-timestamp'];
  
  if (!timestamp) {
    return res.status(400).json({
      success: false,
      error: '区块链节点校验失败'
    });
  }
  
  // 使用相同的算法重新计算blockchain_node
  const secretKey = process.env.API_SECRET_KEY || 'default_secret_key';
  const nodeString = `blockchain_verify_${timestamp}`;
  
  let nodeHash = 0;
  for (let i = 0; i < nodeString.length; i++) {
    const char = nodeString.charCodeAt(i);
    nodeHash = ((nodeHash << 5) - nodeHash) + char;
    nodeHash = nodeHash & nodeHash;
  }
  
  // 使用secretKey来影响哈希值
  for (let i = 0; i < secretKey.length; i++) {
    const char = secretKey.charCodeAt(i);
    nodeHash = ((nodeHash << 5) - nodeHash) + char;
    nodeHash = nodeHash & nodeHash;
  }
  
  const expectedBlockchainNode = Math.abs(nodeHash).toString(16);
  
  // 验证blockchain_node是否匹配
  if (blockchain_node !== expectedBlockchainNode) {
    console.warn('区块链节点验证失败', {
      received: blockchain_node,
      expected: expectedBlockchainNode,
      timestamp: timestamp,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      error: '区块链节点校验失败'
    });
  }
  
  // 验证时间戳是否在合理范围内（允许5分钟的时间差）
  const requestTime = parseInt(timestamp);
  const currentTime = Date.now();
  if (Math.abs(currentTime - requestTime) > 1 * 60 * 1000) {
    console.warn('区块链节点时间戳过期', {
      requestTime,
      currentTime,
      diff: Math.abs(currentTime - requestTime),
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      error: '区块链节点校验失败'
    });
  }
  
  // 验证通过，继续下一个中间件
  next();
};

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
      error: '检测到恶意请求，机器码已经封禁！'
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
      error: '检测到恶意请求，机器码已经封禁！'
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
      error: '检测到恶意请求，机器码已经封禁！'
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
      error: '检测到恶意请求，机器码已经封禁！'
    });
  }
  
  // 签名验证通过
  // 记录用户会话剩余时间日志（如果存在JWT token）
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET || process.env.JWT_SECRET || 'default_jwt_secret');
      
      // 获取前端会话时长配置
      const sessionDuration = parseInt(process.env.VITE_SESSION_DURATION || '180000', 10);
      const sessionDurationMinutes = Math.floor(sessionDuration / 60000);
      
      console.info(`[会话监控] 用户请求 - 用户名: ${decoded.username}, 用户ID: ${decoded.id}, 本次登录会话有效期: ${sessionDurationMinutes}分钟 (${sessionDuration}ms), 请求路径: ${req.path}`);
    } catch (err) {
      // Token无效或过期，不影响正常流程，由具体接口处理
    }
  }
  
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
  // 将数据库连接注入到app.locals，供PDF生成器使用
  app.locals.db = db;
  
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
  // 更新用户登录次数接口 - 用于增加或减少用户剩余登录次数（管理员）
  app.post('/api/update-user-logins', generalLimiter, signatureValidationMiddleware, updateUserLoginsModule.initialize(db, JWT_SECRET));
  // 修改密码接口 - 用于用户更改自己的账户密码（支持管理员改密）
  app.post('/api/change-password', generalLimiter, signatureValidationMiddleware, changePasswordModule.initialize(db, JWT_SECRET));
  // 重置用户登录次数接口 - 用于将用户剩余登录次数重置为0（管理员）
  app.post('/api/reset-user-logins', generalLimiter, signatureValidationMiddleware, resetUserLoginsModule.initialize(db, JWT_SECRET));
  // 减少用户登录次数接口 - 用于减少指定用户的登录次数（管理员）
  app.post('/api/decrease-user-logins', generalLimiter, signatureValidationMiddleware, decreaseUserLoginsModule.initialize(db, JWT_SECRET));
  // 获取所有用户接口 - 用于管理员获取系统中的所有用户信息
  app.post('/api/get-all-users', generalLimiter, signatureValidationMiddleware, getAllUsersModule.initialize(db, JWT_SECRET));
  // 查询用户接口 - 用于根据条件查询特定用户信息
  app.post('/api/query-user', generalLimiter, signatureValidationMiddleware, queryUserModule.initialize(db));
  // 减少PDF限制接口 - 用于减少用户PDF下载积分（管理员）
  app.post('/api/decrease-pdf-limit', generalLimiter, signatureValidationMiddleware, decreasePdfLimitModule.initialize(db, JWT_SECRET));
  // 获取今日登录统计接口 - 用于获取当天系统的登录统计数据（管理员）
  app.post('/api/get-today-login-count', generalLimiter, signatureValidationMiddleware, getTodayLoginCountModule.initialize(db, JWT_SECRET));
  // 增加PDF限制接口 - 用于增加用户PDF下载积分（管理员）
  app.post('/api/increase-pdf-limit', generalLimiter, signatureValidationMiddleware, increasePdfLimitModule.initialize(db, JWT_SECRET));
  // 重置PDF限制接口 - 用于重置用户PDF下载积分为默认值（管理员）
  app.post('/api/reset-pdf-limit', generalLimiter, signatureValidationMiddleware, resetPdfLimitModule.initialize(db, JWT_SECRET));
  // 获取每小时登录统计接口 - 用于获取指定日期每小时的登录统计数据（管理员）
  app.post('/api/get-hourly-login-stats', generalLimiter, signatureValidationMiddleware, getHourlyLoginStatsModule.initialize(db, JWT_SECRET));
  // 获取登录统计范围接口 - 用于获取一周或一月内的登录统计数据（管理员）
  app.post('/api/get-login-stats-range', generalLimiter, signatureValidationMiddleware, getLoginStatsRangeModule.initialize(db, JWT_SECRET));
  // 查询用户登录次数和 PDF 积分接口 - 用于用户查询自己的登录次数和 PDF 积分
  app.post('/api/query-user-logins-pdf', generalLimiter, queryUserLoginsPdfModule.initialize(db));

  // 获取用户活跃度热力图接口 - 用于展示7天×24小时的登录密度分布（管理员）
  app.post('/api/get-user-activity-heatmap', generalLimiter, signatureValidationMiddleware, getUserActivityHeatmapModule.initialize(db, JWT_SECRET));
  
  // 获取Top活跃用户排行榜接口 - 用于显示登录次数最多的用户（管理员）
  app.post('/api/get-top-active-users', generalLimiter, signatureValidationMiddleware, getTopActiveUsersModule.initialize(db, JWT_SECRET));

  // 获取今日登录详情接口 - 用于获取今天所有用户的登录记录（管理员）
  app.post('/api/get-today-login-details', generalLimiter, signatureValidationMiddleware, getTodayLoginDetailsModule.initialize(db, JWT_SECRET));

  // 获取省份登录统计接口 - 用于展示各省份用户登录次数分布（管理员）
  app.post('/api/get-province-login-stats', generalLimiter, signatureValidationMiddleware, getProvinceLoginStatsModule.initialize(db, JWT_SECRET));

  // 获取用户卡密使用记录接口 - 用于查看用户使用过的卡密详情（管理员）
  app.post('/api/get-user-card-history', generalLimiter, signatureValidationMiddleware, getUserCardHistoryModule.initialize(db, JWT_SECRET));

  // 管理员直接登录用户接口 - 用于管理员免积分登录到用户账号（不消耗登录次数）
  app.post('/api/admin-impersonate-login', generalLimiter, signatureValidationMiddleware, adminImpersonateLoginModule.initialize(db, JWT_SECRET));

  // 忘记密码重置接口 - 用于用户通过卡密验证重置密码（无需原密码）
  app.post('/api/reset-password', generalLimiter, signatureValidationMiddleware, resetPasswordModule.initialize(db));

  // IP黑名单管理接口 - 用于获取、更新和删除IP黑名单记录（管理员）
  app.post('/api/manage-ip-blacklist', generalLimiter, signatureValidationMiddleware, manageIpBlacklistModule.initialize(db, JWT_SECRET));

  // PDF生成管理接口 - 用于查看和管理PDF生成记录及二维码信息（管理员）
  app.post('/api/manage-pdf-generation', generalLimiter, signatureValidationMiddleware, managePdfGenerationModule.initialize(db, JWT_SECRET));

  // 获取留言列表接口 - 用于获取所有用户的留言（分页）
  app.post('/api/get-messages', generalLimiter, getMessagesModule.initialize(db));
  
  // 添加留言接口 - 用于用户提交新留言
  app.post('/api/add-message', generalLimiter, addMessageModule.initialize(db));

  // 删除用户接口 - 用于管理员彻底删除用户及其所有相关数据
  app.post('/api/delete-user', generalLimiter, signatureValidationMiddleware, deleteUserModule.initialize(db, JWT_SECRET));

  // 添加充值卡管理接口 - 根据操作类型应用不同的安全策略
  app.post('/api/manage-cards', generalLimiter, signatureValidationMiddleware, (req, res) => {
    const { action } = req.body;
    
    if (action === 'create') {
      // 创建充值卡：必须经过管理员认证 + 更严格的限流
      return cardCreateLimiter(req, res, () => {
        // 先进行管理员身份验证
        manageCards.adminAuthMiddleware(req, res, () => {
          const cardHandler = manageCards(db);
          cardHandler(req, res);
        });
      });
    } else if (action === 'list') {
      // 查询充值卡列表：需要管理员认证
      return manageCards.adminAuthMiddleware(req, res, () => {
        const cardHandler = manageCards(db);
        cardHandler(req, res);
      });
    } else if (action === 'use') {
      // 使用充值卡：应用更严格的速率限制（不需要管理员权限，普通用户也可以使用）
      return cardUseLimiter(req, res, () => {
        const cardHandler = manageCards(db);
        cardHandler(req, res);
      });
    } else {
      // 其他未知操作：拒绝访问
      return res.status(400).json({
        success: false,
        error: '无效的操作类型'
      });
    }
  });

  // 生成学位验证报告PDF接口 - 需要签名验证 + JWT认证 + 区块链节点验证 + 严格限流
  app.post('/api/generate-degree-pdf', 
    signatureValidationMiddleware,      // 先验证签名
    authenticateJWT,                    // 再验证身份(JWT)
    blockchainNodeValidationMiddleware, // 然后验证区块链节点
    pdfGenerationLimiter,               // 然后限流
    generateDegreePdf                   // 执行生成逻辑
  );

  // 生成学历PDF接口 - 需要签名验证 + JWT认证 + 区块链节点验证 + 严格限流
  app.post('/api/generate-education-pdf', 
    signatureValidationMiddleware,      // 先验证签名
    authenticateJWT,                    // 再验证身份(JWT)
    blockchainNodeValidationMiddleware, // 然后验证区块链节点
    pdfGenerationLimiter,               // 然后限流
    generateEducationPdf                // 执行生成逻辑
  );

  // 教育部学籍在线验证报告pdf生成接口 - 需要签名验证 + JWT认证 + 区块链节点验证 + 严格限流
  app.post('/api/generate-student-status-pdf', 
    signatureValidationMiddleware,      // 先验证签名
    authenticateJWT,                    // 再验证身份(JWT)
    blockchainNodeValidationMiddleware, // 然后验证区块链节点
    pdfGenerationLimiter,               // 然后限流
    generateStudentStatusPdf            // 执行生成逻辑
  );

  // 二维码重定向接口 - 用于处理扫码后的短码重定向（不需要签名验证，因为是公开访问）
  app.get('/qr/:shortCode', qrRedirectModule.initialize(db));
}
module.exports = {
  setupRoutes,
  generalLimiter,
  registrationLimiter,
  pdfGenerationLimiter,
  authenticateJWT,
  blockchainNodeValidationMiddleware
};
