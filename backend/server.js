// backend/server.js
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // 修改这里，指向项目根目录的.env文件

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
// 增加请求体大小限制以支持图片上传
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


// 创建数据库连接池
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'degree_management',
  port: process.env.DB_PORT || 3306,
};

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
    
    // 创建表（如果不存在）
    await createTables();
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
}

// 创建表结构
// 创建表结构
async function createTables() {
  const tables = [
    `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      remaining_logins INT NOT NULL DEFAULT 10,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS student_status (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
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
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
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
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
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
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
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
    `
  ];

  for (const query of tables) {
    await db.execute(query);
  }
  
  console.log('Database tables initialized');
}

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 登录接口
app.post('/api/auth', async (req, res) => {
  try {
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
app.post('/api/register', async (req, res) => {
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

    // 插入新用户，初始登录次数为0
    const [{ insertId }] = await db.execute(
      'INSERT INTO users (username, password, remaining_logins) VALUES (?, ?, ?)',
      [username, password, 0]
    );

    // 为新用户创建默认的学生状态记录
    await db.execute(
      `INSERT INTO student_status (user_id, name, school, major, study_type, degree_level) VALUES (?, ?, ?, ?, ?, ?)`,
      [insertId, '新用户', '清华大学', '汉语言文学', '全日制', '本科']
    );

    // 获取新创建的用户信息
    const [newUsers] = await db.execute(
      'SELECT id, username, remaining_logins FROM users WHERE id = ?',
      [insertId]
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
app.post('/api/get-user-data', async (req, res) => {
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
app.post('/api/update-data', async (req, res) => {
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
        // 构造插入语句，排除id字段让数据库自动生成
        const insertData = { ...sanitizedData, user_id: userId }; // 添加 user_id 字段
        delete insertData.id; // 删除id字段，让数据库自增生成
        
        const columns = Object.keys(insertData).join(', ');
        const placeholders = Object.keys(insertData).map(() => '?').join(', ');
        const values = Object.values(insertData);
        
        const [{ insertId }] = await db.execute(
          `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
          values
        );
        
        // 将id放在data对象的第一位并返回
        const responseData = { id: insertId, ...sanitizedData };
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
app.post('/api/update-user-logins', async (req, res) => {
  try {
    const { userId, addLogins } = req.body;
    
    if (!userId || addLogins === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }
    
    // 更新用户登录次数
    const [result] = await db.execute(
      'UPDATE users SET remaining_logins = remaining_logins + ? WHERE id = ?',
      [addLogins, userId]
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
      [userId]
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
app.post('/api/change-password', async (req, res) => {
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
app.post('/api/reset-user-logins', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: '缺少用户名参数'
      });
    }
    
    // 将用户登录次数重置为0
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
      message: `已将用户 ${username} 的登录次数重置为 0`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取所有用户接口
app.post('/api/get-all-users', async (req, res) => {
  try {
    // 查询所有用户，包括密码字段
    const [users] = await db.execute(
      'SELECT id, username, password, remaining_logins FROM users ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id.toString(),
        username: user.username,
        password: user.password,
        remaining_logins: user.remaining_logins
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

// 启动服务器
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});