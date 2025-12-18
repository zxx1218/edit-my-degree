// backend/server.js
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
// =============pdf模块引入=================
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid'); // 添加UUID生成库
const { log } = require('console');
const crypto = require('crypto');

// 引入PDF生成器模块
const generateDegreePdf = require('./pdf-generators/degree-pdf-generator');
const generateEducationPdf = require('./pdf-generators/education-pdf-generator');
const generateStudentStatusPdf = require('./pdf-generators/student-status-pdf-generator');

// ========================================

require('dotenv').config({ path: '../.env' }); // 修改这里，指向项目根目录的.env文件

const app = express();
app.set('trust proxy', 1); // 添加这一行以信任代理
const PORT = process.env.PORT || 3001;

app.use(cors());

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

// 增加请求体大小限制以支持图片上传
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 签名验证中间件
const signatureValidationMiddleware = (req, res, next) => {
  // 免签接口白名单
  const whitelist = [
    '/api/auth',
    '/api/get-today-login-count',
    '/api/get-hourly-login-stats',
    '/api/get-login-stats-range',
    '/api/manage-cards',
    '/api/get-all-users'
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
      error: '签名验证失败'
    });
  }
  
  // 签名验证通过
  next();
};

// 应用签名验证中间件到所有路由
app.use(signatureValidationMiddleware);

let db;

// 初始化数据库连接
async function initDB() {
  try {
    // 首先不指定数据库名称来连接MySQL
    const connectionConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      timezone: '+08:00' // 设置为中国时区
    };
    
    const tempDb = await mysql.createConnection(connectionConfig);
    console.log('Connected to MySQL server');
    
    // 创建数据库（如果不存在）
    const dbName = process.env.DB_NAME || 'degree_management';
    await tempDb.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' is ready`);
    
    // 关闭临时连接
    await tempDb.end();
    
    // 现在连接到具体的数据库
    db = await mysql.createConnection({
      ...connectionConfig,
      database: dbName
    });
    
    console.log(`Connected to MySQL database '${dbName}'`);
    
    // 设置时区为中国时区
    await db.execute("SET time_zone = '+08:00'");
    
    // 创建表（如果不存在）
    await createTables();
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
}

async function createTables() {
  // 首先设置时区为中国时区
  await db.execute("SET time_zone = '+08:00'");
  
  const tables = [
    `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      remaining_logins INT NOT NULL DEFAULT 0,
      pdf_limit INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS student_status (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name TEXT NOT NULL,
      gender TEXT,
      birth_date TEXT,
      school TEXT NOT NULL,
      major TEXT NOT NULL,
      study_type TEXT,
      degree_level TEXT,
      nationality TEXT,
      id_number TEXT,
      status TEXT,
      enrollment_date TEXT,
      graduation_date TEXT,
      duration TEXT,
      education_type TEXT,
      branch TEXT,
      department TEXT,
      class TEXT,
      student_id TEXT,
      personal_info TEXT,
      admission_photo LONGTEXT,
      degree_photo LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS education (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name TEXT NOT NULL,
      gender TEXT,
      birth_date TEXT,
      school TEXT NOT NULL,
      major TEXT NOT NULL,
      study_type TEXT,
      degree_level TEXT,
      enrollment_date TEXT,
      graduation_date TEXT,
      duration TEXT,
      education_type TEXT,
      graduation_status TEXT,
      principal_name TEXT,
      certificate_number TEXT,
      photo LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS degree (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name TEXT NOT NULL,
      gender TEXT,
      birth_date TEXT,
      school TEXT NOT NULL,
      major TEXT,
      degree_type TEXT NOT NULL,
      degree_level TEXT,
      degree_date TEXT,
      certificate_number TEXT,
      photo LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS exam (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name TEXT NOT NULL,
      school TEXT NOT NULL,
      year TEXT,
      exam_location TEXT,
      registration_number TEXT,
      exam_unit TEXT,
      department TEXT,
      major TEXT,
      research_direction TEXT,
      exam_type TEXT,
      special_program TEXT,
      politics_name TEXT,
      politics_score TEXT,
      foreign_language_name TEXT,
      foreign_language_score TEXT,
      business_course1_name TEXT,
      business_course1_score TEXT,
      business_course2_name TEXT,
      business_course2_score TEXT,
      total_score TEXT,
      admission_unit TEXT,
      admission_major TEXT,
      note TEXT,
      photo LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS login_logs (
      id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      username TEXT NOT NULL,
      login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS cards (
      id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
      \`values\` INT NOT NULL,
      type ENUM('login', 'pdf') NOT NULL DEFAULT 'login',
      used BOOLEAN NOT NULL DEFAULT FALSE,
      used_by VARCHAR(36),
      used_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
    )
    `
  ];

  // 创建表
  for (const query of tables) {
    await db.execute(query);
  }
  
  // 单独处理索引创建，使用 try-catch 避免重复创建索引的错误
  try {
    await db.execute('CREATE INDEX idx_login_logs_login_time ON login_logs(login_time)');
  } catch (err) {
    // 如果索引已存在，忽略错误
    if (err.code !== 'ER_DUP_KEYNAME') {
      throw err; // 如果是其他错误，则抛出
    }
  }
  
  try {
    await db.execute('CREATE INDEX idx_login_logs_user_id ON login_logs(user_id)');
  } catch (err) {
    // 如果索引已存在，忽略错误
    if (err.code !== 'ER_DUP_KEYNAME') {
      throw err; // 如果是其他错误，则抛出
    }
  }
  
  console.log('Database tables initialized');
}

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET;

// 登录接口
app.post('/api/auth', generalLimiter, async (req, res) => {
  try {
    // 设置时区为中国时区
    await db.execute("SET time_zone = '+08:00'");
    
    const { username, password } = req.body;
    
    // 查询用户
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    const user = rows[0];
    
    // 检查密码
    const isPasswordValid = password === user.password; // 简化处理，实际应该使用 bcrypt
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    // 检查登录次数
    if (user.remaining_logins <= 0) {
      return res.status(401).json({
        success: false,
        error: '登录次数已用完'
      });
    }
    
    // 减少登录次数
    await db.execute(
      'UPDATE users SET remaining_logins = remaining_logins - 1 WHERE id = ?',
      [user.id]
    );
    
    // 记录登录日志到login_logs表
    await db.execute(
      'INSERT INTO login_logs (user_id, username) VALUES (?, ?)',
      [user.id, username]
    );
    
    // 生成 JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        remaining_logins: user.remaining_logins - 1
      },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 注册接口
app.post('/api/register', registrationLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }

    // 检查用户名是否已存在
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: '用户名已存在，请选择其他用户名'
      });
    }

    // 生成UUID作为用户ID
    const userId = uuidv4();

    // 插入新用户，初始登录次数为0
    await db.execute(
      'INSERT INTO users (id, username, password, remaining_logins) VALUES (?, ?, ?, ?)',
      [userId, username, password, 0]
    );

    // 为新用户创建默认的学生状态记录
    const studentStatusId = uuidv4();
    await db.execute(
      `INSERT INTO student_status (id, user_id, name, school, major, study_type, degree_level) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [studentStatusId, userId, '新用户', '清华大学', '汉语言文学', '全日制', '本科']
    );

    // 获取新创建的用户信息
    const [newUsers] = await db.execute(
      'SELECT id, username, remaining_logins FROM users WHERE id = ?',
      [userId]
    );

    const newUser = newUsers[0];

    res.status(200).json({
      success: true,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: '注册失败，请重试'
    });
  }
});

// 获取用户数据接口
app.post('/api/get-user-data', generalLimiter, async (req, res) => {
  try {
    const { userId } = req.body;
    
    // 查询各表数据
    const tables = ['student_status', 'education', 'degree', 'exam'];
    const result = {};
    
    for (const table of tables) {
      const [rows] = await db.execute(
        `SELECT * FROM ${table} WHERE user_id = ?`,
        [userId]
      );
      result[table] = rows;
    }
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 更新数据接口
app.post('/api/update-data', generalLimiter, async (req, res) => {
  try {
    const { table, action, data, id, userId } = req.body;
    
    // 验证表名
    const allowedTables = ['student_status', 'education', 'degree', 'exam'];
    if (!allowedTables.includes(table)) {
      return res.status(400).json({
        success: false,
        error: '无效的表名'
      });
    }
    
    // 验证必要参数
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '缺少用户ID'
      });
    }
    
    if ((action === 'update' || action === 'delete') && !id) {
      return res.status(400).json({
        success: false,
        error: '缺少记录ID'
      });
    }
    
    let result;
    
    // 处理数据中的undefined值，将其转换为null
    const sanitizeData = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = obj[key] === undefined ? null : obj[key];
        }
      }
      return sanitized;
    };
    
    const sanitizedData = sanitizeData(data);
    
    switch (action) {
      case 'insert':
        // 生成UUID作为记录ID
        const recordId = uuidv4();
        
        // 构造插入语句
        const insertData = { id: recordId, ...sanitizedData, user_id: userId };
        
        const columns = Object.keys(insertData).join(', ');
        const placeholders = Object.keys(insertData).map(() => '?').join(', ');
        const values = Object.values(insertData);
        
        await db.execute(
          `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
          values
        );
        
        // 返回完整的数据对象
        const responseData = insertData;
        res.json({ success: true, data: [responseData] }); // 包装成数组以匹配supabase格式
        return;
        
      case 'update':
        // 构造更新语句
        const updates = Object.keys(sanitizedData).map(key => `${key} = ?`).join(', ');
        const updateValues = Object.values(sanitizedData);
        updateValues.push(id, userId); // 添加 id 和 userId 用于 WHERE 条件
        
        await db.execute(
          `UPDATE ${table} SET ${updates} WHERE id = ? AND user_id = ?`,
          updateValues
        );
        
        result = { id };
        break;
        
      case 'delete':
        await db.execute(
          `DELETE FROM ${table} WHERE id = ? AND user_id = ?`,
          [id, userId].map(value => value === undefined ? null : value)
        );
        
        result = { id };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: '无效的操作类型'
        });
    }
    
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 更新用户登录次数接口
app.post('/api/update-user-logins', generalLimiter, async (req, res) => {
  try {
    const { userId, username, addLogins } = req.body; // 支持通过userId或username
    
    if (!userId && !username) {
      return res.status(400).json({
        success: false,
        error: '缺少用户ID或用户名参数'
      });
    }
    
    if (addLogins === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少addLogins参数'
      });
    }
    
    // 查找用户
    let user;
    if (userId) {
      const [users] = await db.execute(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );
      user = users[0];
    } else if (username) {
      const [users] = await db.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      user = users[0];
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户未找到'
      });
    }
    
    // 更新用户登录次数
    const [result] = await db.execute(
      'UPDATE users SET remaining_logins = remaining_logins + ? WHERE id = ?',
      [addLogins, user.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '用户未找到'
      });
    }
    
    // 获取更新后的用户信息
    const [users] = await db.execute(
      'SELECT remaining_logins FROM users WHERE id = ?',
      [user.id]
    );
    
    res.json({
      success: true,
      newLogins: users[0].remaining_logins
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 修改密码接口
app.post('/api/change-password', generalLimiter, async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '请提供完整的信息'
      });
    }

    // 验证原密码是否正确
    const [users] = await db.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, oldPassword]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: '用户名或原密码错误'
      });
    }

    // 更新密码
    await db.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPassword, users[0].id]
    );

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 重置用户登录次数接口
app.post('/api/reset-user-logins', generalLimiter, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: '缺少用户名参数'
      });
    }
    
    // 更新用户登录次数为0
    const [result] = await db.execute(
      'UPDATE users SET remaining_logins = 0 WHERE username = ?',
      [username]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '用户未找到'
      });
    }
    
    res.json({
      success: true,
      message: '登录次数已重置'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 添加减少用户登录次数接口
app.post('/api/decrease-user-logins', generalLimiter, async (req, res) => {
  try {
    const { username, decreaseLogins } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: '用户名不能为空'
      });
    }

    if (typeof decreaseLogins !== 'number' || decreaseLogins <= 0) {
      return res.status(400).json({
        success: false,
        error: '减少次数必须为正整数'
      });
    }

    // console.log(`Decreasing logins for user: ${username} by ${decreaseLogins}`);

    // 先查询用户当前的登录次数
    const [users] = await db.execute(
      'SELECT id, remaining_logins FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    const user = users[0];

    // 计算新的登录次数，不能小于0
    const newLogins = Math.max(0, user.remaining_logins - decreaseLogins);

    // 更新用户的登录次数
    const [result] = await db.execute(
      'UPDATE users SET remaining_logins = ? WHERE id = ?',
      [newLogins, user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '用户未找到'
      });
    }

    // console.log(`Successfully decreased logins for user: ${username}, new remaining: ${newLogins}`);

    res.json({
      success: true,
      newLogins,
      decreased: user.remaining_logins - newLogins
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取所有用户接口
app.post('/api/get-all-users', generalLimiter, async (req, res) => {
  try {
    // 查询所有用户，包括密码字段
    const [users] = await db.execute(
      'SELECT id, username, password, remaining_logins, pdf_limit FROM users ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id.toString(),
        username: user.username,
        password: user.password,
        remaining_logins: user.remaining_logins,
        pdf_limit: user.pdf_limit
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 查询特定用户接口
app.post('/api/query-user', generalLimiter, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: '缺少用户名参数'
      });
    }
    
    // 查询特定用户
    const [users] = await db.execute(
      'SELECT id, username, password, remaining_logins, pdf_limit FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户未找到'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: users[0].id.toString(),
        username: users[0].username,
        password: users[0].password,
        remaining_logins: users[0].remaining_logins,
        pdf_limit: users[0].pdf_limit
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 添加减少用户PDF积分接口
app.post('/api/decrease-pdf-limit', generalLimiter, async (req, res) => {
  try {
    const { username, decreaseAmount } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: '用户名不能为空'
      });
    }

    if (typeof decreaseAmount !== 'number' || decreaseAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: '减少数量必须为正整数'
      });
    }

    // 先查询用户当前的PDF积分
    const [users] = await db.execute(
      'SELECT id, pdf_limit FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    const user = users[0];

    // 检查是否有足够的PDF积分
    if (user.pdf_limit < decreaseAmount) {
      return res.status(400).json({
        success: false,
        error: `PDF下载积分不足，当前积分：${user.pdf_limit}，需要：${decreaseAmount}`
      });
    }

    // 计算新的PDF积分
    const newPdfLimit = user.pdf_limit - decreaseAmount;

    // 更新用户的PDF积分
    const [result] = await db.execute(
      'UPDATE users SET pdf_limit = ? WHERE id = ?',
      [newPdfLimit, user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '用户未找到'
      });
    }

    res.json({
      success: true,
      newPdfLimit,
      decreased: decreaseAmount
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取今日登录统计接口
app.post('/api/get-today-login-count', generalLimiter, async (req, res) => {
  try {
    // 获取今天的开始和结束时间 (使用本地时间格式 YYYY-MM-DD)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 格式化为 YYYY-MM-DD 字符串
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const todayStr = formatDate(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);

    // console.log('查询日期范围:', {
    //   todayStr,
    //   tomorrowStr
    // });

    // 查询今日登录总次数
    const [totalLoginsResult] = await db.execute(
      `SELECT COUNT(*) as total_logins 
       FROM login_logs 
       WHERE DATE(login_time) = ?`,
      [todayStr]
    );

    // 查询今日不同用户数
    const [distinctUsersResult] = await db.execute(
      `SELECT COUNT(DISTINCT user_id) as distinct_users 
       FROM login_logs 
       WHERE DATE(login_time) = ?`,
      [todayStr]
    );

    // console.log('今日登录统计:', {
    //   total_logins: totalLoginsResult[0].total_logins,
    //   distinct_users: distinctUsersResult[0].distinct_users
    // });

    res.json({
      success: true,
      total_logins: totalLoginsResult[0].total_logins,
      distinct_users: distinctUsersResult[0].distinct_users
    });
  } catch (err) {
    console.error('获取今日登录统计失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 添加增加用户PDF积分接口
app.post('/api/increase-pdf-limit', generalLimiter, async (req, res) => {
  try {
    const { username, increaseAmount } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: '用户名不能为空'
      });
    }

    if (typeof increaseAmount !== 'number' || increaseAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: '增加数量必须为正整数'
      });
    }

    // 先查询用户
    const [users] = await db.execute(
      'SELECT id, pdf_limit FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    const user = users[0];

    // 计算新的PDF积分
    const newPdfLimit = user.pdf_limit + increaseAmount;

    // 更新用户的PDF积分
    const [result] = await db.execute(
      'UPDATE users SET pdf_limit = ? WHERE id = ?',
      [newPdfLimit, user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '用户未找到'
      });
    }

    res.json({
      success: true,
      newPdfLimit,
      increased: increaseAmount
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 添加重置用户PDF积分接口
app.post('/api/reset-pdf-limit', generalLimiter, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: '缺少用户名参数'
      });
    }
    
    // 更新用户PDF积分为0
    const [result] = await db.execute(
      'UPDATE users SET pdf_limit = 0 WHERE username = ?',
      [username]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '用户未找到'
      });
    }
    
    res.json({
      success: true,
      message: 'PDF积分已重置'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 添加充值卡管理接口
app.post('/api/manage-cards', generalLimiter, async (req, res) => {
  try {
    const { action, type, values, count, cardId, username } = req.body;

    switch (action) {
      case 'create':
        // 创建充值卡
        if (!type || !values || !count) {
          return res.status(400).json({
            success: false,
            error: '缺少必要的参数：type, values, count'
          });
        }

        if (count > 100) {
          return res.status(400).json({
            success: false,
            error: '单次创建数量不能超过100张'
          });
        }

        const newCards = [];
        for (let i = 0; i < count; i++) {
          const cardId = uuidv4();
          await db.execute(
            'INSERT INTO cards (id, type, `values`) VALUES (?, ?, ?)',
            [cardId, type, values]
          );
          newCards.push({
            id: cardId,
            type,
            values
          });
        }

        return res.json({
          success: true,
          cards: newCards
        });

      case 'list':
        // 获取充值卡列表
        const [cards] = await db.execute(
          'SELECT id, type, `values`, used, used_by, used_at, created_at FROM cards ORDER BY created_at DESC'
        );
        
        return res.json({
          success: true,
          cards: cards.map(card => ({
            id: card.id,
            type: card.type,
            values: card.values,
            used: card.used === 1,
            used_by: card.used_by,
            used_at: card.used_at,
            created_at: card.created_at
          }))
        });

      case 'use':
        // 使用充值卡
        if (!cardId || !username) {
          return res.status(400).json({
            success: false,
            error: '缺少必要的参数：cardId, username'
          });
        }

        // 检查充值卡是否存在且未被使用
        const [cardsResult] = await db.execute(
          'SELECT * FROM cards WHERE id = ? AND used = FALSE',
          [cardId]
        );

        if (cardsResult.length === 0) {
          return res.status(400).json({
            success: false,
            error: '充值卡不存在或已被使用'
          });
        }

        const card = cardsResult[0];

        // 查找用户
        const [usersResult] = await db.execute(
          'SELECT id FROM users WHERE username = ?',
          [username]
        );

        if (usersResult.length === 0) {
          return res.status(404).json({
            success: false,
            error: '用户不存在'
          });
        }

        const user = usersResult[0];
        
        // 开始事务处理
        await db.query('START TRANSACTION');
        
        try {
          // 标记充值卡为已使用
          await db.execute(
            'UPDATE cards SET used = TRUE, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id, cardId]
          );

          // 根据充值卡类型更新用户相应资源
          if (card.type === 'login') {
            await db.execute(
              'UPDATE users SET remaining_logins = remaining_logins + ? WHERE id = ?',
              [card.values, user.id]
            );
          } else if (card.type === 'pdf') {
            await db.execute(
              'UPDATE users SET pdf_limit = pdf_limit + ? WHERE id = ?',
              [card.values, user.id]
            );
          }

          await db.query('COMMIT');

          // 获取更新后的用户信息
          const [updatedUserResult] = await db.execute(
            'SELECT remaining_logins, pdf_limit FROM users WHERE id = ?',
            [user.id]
          );

          return res.json({
            success: true,
            message: '充值卡使用成功',
            card: {
              id: card.id,
              type: card.type,
              values: card.values
            },
            user: updatedUserResult[0]
          });
        } catch (error) {
          await db.execute('ROLLBACK');
          throw error;
        }

      default:
        return res.status(400).json({
          success: false,
          error: '无效的操作类型'
        });
    }
  } catch (err) {
    console.error('充值卡管理接口出错:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取每小时登录统计接口
app.post('/api/get-hourly-login-stats', generalLimiter, async (req, res) => {
  try {
    // 获取请求中的日期或者使用今天
    const { date } = req.body;
    let targetDate;
    
    if (date) {
      targetDate = new Date(date);
    } else {
      targetDate = new Date();
    }
    
    targetDate.setHours(0, 0, 0, 0);
    
    // 格式化为 YYYY-MM-DD 字符串
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const targetDateStr = formatDate(targetDate);
    
    // 查询指定日期每小时登录统计数据
    const [hourlyStatsResult] = await db.execute(`
      SELECT 
        HOUR(login_time) as hour,
        COUNT(*) as total_logins,
        COUNT(DISTINCT user_id) as unique_users
      FROM login_logs 
      WHERE DATE(login_time) = ?
      GROUP BY HOUR(login_time)
      ORDER BY hour
    `, [targetDateStr]);

    // 构建24小时的数据数组，确保每个小时都有数据点
    const hourlyStats = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourData = hourlyStatsResult.find(row => row.hour === hour);
      hourlyStats.push({
        hour: hour,
        hourLabel: `${hour.toString().padStart(2, '0')}:00`,
        totalLogins: hourData ? hourData.total_logins : 0,
        uniqueUsers: hourData ? hourData.unique_users : 0
      });
    }

    res.json({
      success: true,
      hourlyStats
    });
  } catch (err) {
    console.error('获取每小时登录统计失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

app.post('/api/get-login-stats-range', generalLimiter, async (req, res) => {
  try {
    const { range } = req.body; // 'week' 或 'month'
    
    let startDate = new Date();
    if (range === 'week') {
      startDate.setDate(startDate.getDate() - 6); // 包括今天共7天
    } else if (range === 'month') {
      startDate.setDate(startDate.getDate() - 29); // 包括今天共30天
    } else {
      return res.status(400).json({
        success: false,
        error: '无效的范围参数，应为 "week" 或 "month"'
      });
    }
    
    // 格式化日期为 YYYY-MM-DD 字符串
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(new Date());
    
    // 查询日期范围内每天的登录统计数据
    const [dailyStatsResult] = await db.execute(`
      SELECT 
        DATE(login_time) as date,
        COUNT(*) as total_logins,
        COUNT(DISTINCT user_id) as unique_users
      FROM login_logs 
      WHERE DATE(login_time) BETWEEN ? AND ?
      GROUP BY DATE(login_time)
      ORDER BY date
    `, [startDateStr, endDateStr]);
    
    // 构建完整的日期数据数组
    const dailyStats = [];
    const currentDate = new Date(startDate);
    const finalEndDate = new Date(); // 今天
    
    // 将查询结果转换为Map方便查找
    const statsMap = new Map();
    dailyStatsResult.forEach(row => {
      // 处理日期格式，确保键是YYYY-MM-DD格式
      let dateKey = row.date;
      if (row.date instanceof Date) {
        dateKey = formatDate(row.date);
      } else if (typeof row.date === 'string' && row.date.includes('T')) {
        // 如果是ISO格式的日期字符串，提取日期部分
        dateKey = row.date.split('T')[0];
      }
      statsMap.set(dateKey, {
        totalLogins: row.total_logins,
        uniqueUsers: row.unique_users
      });
    });
    
    // 循环每一天，填充数据
    while (currentDate <= finalEndDate) {
      const dateStr = formatDate(currentDate);
      const dateData = statsMap.get(dateStr);
      
      dailyStats.push({
        date: dateStr,
        dateLabel: dateStr,
        totalLogins: dateData ? dateData.totalLogins : 0,
        uniqueUsers: dateData ? dateData.uniqueUsers : 0
      });
      
      // 移动到下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 计算汇总统计
    const totalLogins = dailyStats.reduce((sum, day) => sum + day.totalLogins, 0);
    const totalUniqueUsers = dailyStats.reduce((sum, day) => sum + day.uniqueUsers, 0);
    const avgLogins = dailyStats.length > 0 ? Math.round(totalLogins / dailyStats.length) : 0;
    
    const summary = {
      totalLogins,
      avgLogins,
      totalUniqueUsers,
      days: dailyStats.length
    };
    
    res.json({
      success: true,
      dailyStats,
      summary
    });
  } catch (err) {
    console.error('获取范围登录统计失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 生成学位验证报告PDF接口
app.post('/api/generate-degree-pdf', generalLimiter, generateDegreePdf);

// 生成学历PDF接口
app.post('/api/generate-education-pdf', generalLimiter, generateEducationPdf);

// 教育部学籍在线验证报告pdf生成接口
app.post('/api/generate-student-status-pdf', generalLimiter, generateStudentStatusPdf);

// 启动服务器
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});