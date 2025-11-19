// backend/server.js
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
// =============pdf模块引入=================
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs').promises;
const path = require('path');
const { log } = require('console');
// ========================================

require('dotenv').config({ path: '../.env' }); // 修改这里，指向项目根目录的.env文件

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// 增加请求体大小限制以支持图片上传
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


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

// 生成学位验证报告PDF接口
app.post('/api/generate-degree-pdf', async (req, res) => {
  try {
    console.log('开始生成学位验证报告PDF...');
    const {
      name,
      gender,
      birthDate,
      degreeDate,
      university,
      degreeType,
      major,
      certificateNumber,
      photo
    } = req.body;

    console.log('接收到的数据:', {
      name,
      gender,
      birthDate,
      degreeDate,
      university,
      degreeType,
      major,
      certificateNumber,
      photo: photo ? '照片数据已接收' : '无照片数据'
    });

    // 验证必要字段
    if (!name || !gender || !birthDate || !degreeDate || !university || !degreeType || !major || !certificateNumber) {
      console.warn('缺少必要字段，无法生成PDF');
      return res.status(400).json({
        success: false,
        error: '缺少必要字段'
      });
    }

    // 模板路径
    const templatePath = path.join(__dirname, 'assets', 'xue_wei_template.pdf');
    console.log('PDF模板路径:', templatePath);
    
    // 检查模板文件是否存在
    try {
      await fs.access(templatePath);
      console.log('PDF模板文件存在');
    } catch (error) {
      console.error('PDF模板文件不存在:', error.message);
      return res.status(500).json({
        success: false,
        error: 'PDF模板文件不存在'
      });
    }

    // 读取模板文件
    console.log('正在读取PDF模板文件...');
    const templateBytes = await fs.readFile(templatePath);
    console.log('PDF模板文件读取完成，大小:', templateBytes.length, '字节');
    
    // 加载PDF模板并注册fontkit
    console.log('正在加载PDF文档...');
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    console.log('PDF文档加载完成');
    
    // 尝试加载中文字体（如果存在）
    let defaultFont, sourceHanFont;
    try {
      console.log('尝试加载自定义中文字体...');
      const defaultFontPath = path.join(__dirname, 'fonts', 'msyh.ttf');
      const sourceHanFontPath = path.join(__dirname, 'fonts', 'SourceHanSansK-Regular.TTF');
      
      console.log('字体路径:', { defaultFontPath, sourceHanFontPath });
      
      // 检查字体文件是否存在
      await fs.access(defaultFontPath);
      await fs.access(sourceHanFontPath);
      console.log('字体文件存在');
      
      // 加载字体文件
      console.log('正在加载字体文件...');
      const defaultFontBytes = await fs.readFile(defaultFontPath);
      const sourceHanFontBytes = await fs.readFile(sourceHanFontPath);
      
      defaultFont = await pdfDoc.embedFont(defaultFontBytes);
      sourceHanFont = await pdfDoc.embedFont(sourceHanFontBytes);
      console.log('自定义字体加载成功');
    } catch (error) {
      console.warn('无法加载自定义字体，使用默认字体:', error.message);
      // 使用默认字体
      defaultFont = await pdfDoc.embedStandardFont('Helvetica');
      sourceHanFont = defaultFont; // 如果无法加载SourceHan字体，使用默认字体
    }

    // 获取当前日期（中文格式）
    const now = new Date();
    const currentDate = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, "0")}月${String(now.getDate()).padStart(2, "0")}日`;
    console.log('当前日期:', currentDate);

    // 获取第一页
    const page = pdfDoc.getPage(0);
    console.log('获取PDF页面成功');
    
    // 定义文本内容配置
    const texts = [
      { content: currentDate, x: 285, y: 738, fontSize: 10, color: rgb(0.588, 0.588, 0.588), font: sourceHanFont },
      { content: name, x: 180, y: 701, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: gender, x: 180, y: 673, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: birthDate, x: 180, y: 644, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: degreeDate, x: 180, y: 617, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: university, x: 180, y: 589, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: degreeType, x: 180, y: 561, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: major, x: 180, y: 533, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: certificateNumber, x: 180, y: 505, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont }
    ];

    // 添加文本到PDF
    console.log('开始向PDF添加文本内容...');
    for (const text of texts) {
      page.drawText(text.content, {
        x: text.x,
        y: text.y,
        size: text.fontSize,
        font: text.font,
        color: text.color,
      });
    }
    console.log('文本内容添加完成');

    // 添加照片到PDF（如果提供了照片）
    if (photo) {
      try {
        console.log('开始处理照片...');
        
        // 从Base64字符串中提取图片数据
        const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // 确定图片类型并嵌入到PDF中
        let photoImage;
        if (photo.startsWith('data:image/jpeg') || photo.startsWith('data:image/jpg')) {
          photoImage = await pdfDoc.embedJpg(imageBuffer);
        } else if (photo.startsWith('data:image/png')) {
          photoImage = await pdfDoc.embedPng(imageBuffer);
        } else {
          // 默认当作PNG处理
          photoImage = await pdfDoc.embedPng(imageBuffer);
        }
        
        // 证件照配置
        const photoConfig = { 
          x: 455, // 右侧X坐标（根据PDF宽度调整）
          y: 589, // Y坐标（与文字区域对齐）
          width: 80, // 证件照宽度
          height: 106, // 证件照高度（保持1:1.33的标准证件照比例）
          borderWidth: 0, // 边框宽度设为0，去掉黑色边框
          borderColor: rgb(0, 0, 0) // 边框颜色（黑色，此时已无效）
        };

        // 7. 添加证件照（无边框）
        const { x, y, width: photoWidth, height: photoHeight } = photoConfig;
        page.drawImage(photoImage, { 
          x: x, 
          y: y, 
          width: photoWidth, 
          height: photoHeight, 
          fit: 'contain', 
          align: 'center', 
          valign: 'center' 
        });
        console.log(`✅ 已添加证件照（位置：x=${x}, y=${y}，尺寸：${photoWidth}x${photoHeight}，无边框）`);
      } catch (photoError) {
        console.error('处理照片时出错:', photoError.message);
        // 继续执行而不中断整个过程
      }
    } else {
      console.log('未提供照片，跳过照片添加步骤');
    }

    // 保存PDF
    console.log('正在保存PDF文档...');
    const pdfBytes = await pdfDoc.save();
    console.log('PDF文档保存完成，大小:', pdfBytes.length, '字节');

    // 生成文件名
    const fileName = `学位验证报告_${name}_${Date.now()}.pdf`;
    
    // 保存PDF到后端目录
    try {
      const reportDir = path.join(__dirname, 'report_records');
      const filePath = path.join(reportDir, fileName);
      await fs.writeFile(filePath, pdfBytes);
      console.log('PDF文件已在后端保存:', filePath);
    } catch (saveError) {
      console.error('保存PDF到后端目录失败:', saveError.message);
      // 不中断流程，仍然发送给前端
    }

    // 设置响应头以触发浏览器下载
    res.setHeader('Content-Type', 'application/pdf');
    // 对文件名进行编码以避免特殊字符导致的错误
    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    console.log('设置响应头完成，文件名:', fileName);

    // 发送PDF数据
    res.send(Buffer.from(pdfBytes));
    console.log('PDF文件发送成功');
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      success: false,
      error: 'PDF生成失败: ' + error.message
    });
  }
});

// 生成学位验证报告PDF接口
app.post('/api/generate-degree-pdf', async (req, res) => {
  try {
    console.log('开始生成学位验证报告PDF...');
    const {
      name,
      gender,
      birthDate,
      degreeDate,
      university,
      degreeType,
      major,
      certificateNumber,
      photo
    } = req.body;

    console.log('接收到的数据:', {
      name,
      gender,
      birthDate,
      degreeDate,
      university,
      degreeType,
      major,
      certificateNumber,
      photo: photo ? '照片数据已接收' : '无照片数据'
    });

    // 验证必要字段
    if (!name || !gender || !birthDate || !degreeDate || !university || !degreeType || !major || !certificateNumber) {
      console.warn('缺少必要字段，无法生成PDF');
      return res.status(400).json({
        success: false,
        error: '缺少必要字段'
      });
    }

    // 模板路径
    const templatePath = path.join(__dirname, 'assets', 'xue_wei_template.pdf');
    console.log('PDF模板路径:', templatePath);
    
    // 检查模板文件是否存在
    try {
      await fs.access(templatePath);
      console.log('PDF模板文件存在');
    } catch (error) {
      console.error('PDF模板文件不存在:', error.message);
      return res.status(500).json({
        success: false,
        error: 'PDF模板文件不存在'
      });
    }

    // 读取模板文件
    console.log('正在读取PDF模板文件...');
    const templateBytes = await fs.readFile(templatePath);
    console.log('PDF模板文件读取完成，大小:', templateBytes.length, '字节');
    
    // 加载PDF模板并注册fontkit
    console.log('正在加载PDF文档...');
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    console.log('PDF文档加载完成');
    
    // 尝试加载中文字体（如果存在）
    let defaultFont, sourceHanFont;
    try {
      console.log('尝试加载自定义中文字体...');
      const defaultFontPath = path.join(__dirname, 'fonts', 'msyh.ttf');
      const sourceHanFontPath = path.join(__dirname, 'fonts', 'SourceHanSansK-Regular.TTF');
      
      console.log('字体路径:', { defaultFontPath, sourceHanFontPath });
      
      // 检查字体文件是否存在
      await fs.access(defaultFontPath);
      await fs.access(sourceHanFontPath);
      console.log('字体文件存在');
      
      // 加载字体文件
      console.log('正在加载字体文件...');
      const defaultFontBytes = await fs.readFile(defaultFontPath);
      const sourceHanFontBytes = await fs.readFile(sourceHanFontPath);
      
      defaultFont = await pdfDoc.embedFont(defaultFontBytes);
      sourceHanFont = await pdfDoc.embedFont(sourceHanFontBytes);
      console.log('自定义字体加载成功');
    } catch (error) {
      console.warn('无法加载自定义字体，使用默认字体:', error.message);
      // 使用默认字体
      defaultFont = await pdfDoc.embedStandardFont('Helvetica');
      sourceHanFont = defaultFont; // 如果无法加载SourceHan字体，使用默认字体
    }

    // 获取当前日期（中文格式）
    const now = new Date();
    const currentDate = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, "0")}月${String(now.getDate()).padStart(2, "0")}日`;
    console.log('当前日期:', currentDate);

    // 获取第一页
    const page = pdfDoc.getPage(0);
    console.log('获取PDF页面成功');
    
    // 定义文本内容配置
    const texts = [
      { content: currentDate, x: 285, y: 738, fontSize: 10, color: rgb(0.588, 0.588, 0.588), font: sourceHanFont },
      { content: name, x: 180, y: 701, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: gender, x: 180, y: 673, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: birthDate, x: 180, y: 644, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: degreeDate, x: 180, y: 617, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: university, x: 180, y: 589, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: degreeType, x: 180, y: 561, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: major, x: 180, y: 533, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: certificateNumber, x: 180, y: 505, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont }
    ];

    // 添加文本到PDF
    console.log('开始向PDF添加文本内容...');
    for (const text of texts) {
      page.drawText(text.content, {
        x: text.x,
        y: text.y,
        size: text.fontSize,
        font: text.font,
        color: text.color,
      });
    }
    console.log('文本内容添加完成');

    // 添加照片到PDF（如果提供了照片）
    if (photo) {
      try {
        console.log('开始处理照片...');
        
        // 从Base64字符串中提取图片数据
        const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // 确定图片类型并嵌入到PDF中
        let photoImage;
        if (photo.startsWith('data:image/jpeg') || photo.startsWith('data:image/jpg')) {
          photoImage = await pdfDoc.embedJpg(imageBuffer);
        } else if (photo.startsWith('data:image/png')) {
          photoImage = await pdfDoc.embedPng(imageBuffer);
        } else {
          // 默认当作PNG处理
          photoImage = await pdfDoc.embedPng(imageBuffer);
        }
        
        // 证件照配置
        const photoConfig = { 
          x: 455, // 右侧X坐标（根据PDF宽度调整）
          y: 589, // Y坐标（与文字区域对齐）
          width: 80, // 证件照宽度
          height: 106, // 证件照高度（保持1:1.33的标准证件照比例）
          borderWidth: 0, // 边框宽度设为0，去掉黑色边框
          borderColor: rgb(0, 0, 0) // 边框颜色（黑色，此时已无效）
        };

        // 7. 添加证件照（无边框）
        const { x, y, width: photoWidth, height: photoHeight } = photoConfig;
        page.drawImage(photoImage, { 
          x: x, 
          y: y, 
          width: photoWidth, 
          height: photoHeight, 
          fit: 'contain', 
          align: 'center', 
          valign: 'center' 
        });
        console.log(`✅ 已添加证件照（位置：x=${x}, y=${y}，尺寸：${photoWidth}x${photoHeight}，无边框）`);
      } catch (photoError) {
        console.error('处理照片时出错:', photoError.message);
        // 继续执行而不中断整个过程
      }
    } else {
      console.log('未提供照片，跳过照片添加步骤');
    }

    // 保存PDF
    console.log('正在保存PDF文档...');
    const pdfBytes = await pdfDoc.save();
    console.log('PDF文档保存完成，大小:', pdfBytes.length, '字节');

    // 生成文件名
    const fileName = `学位验证报告_${name}_${Date.now()}.pdf`;
    
    // 保存PDF到后端目录
    try {
      const reportDir = path.join(__dirname, 'report_records');
      const filePath = path.join(reportDir, fileName);
      await fs.writeFile(filePath, pdfBytes);
      console.log('PDF文件已在后端保存:', filePath);
    } catch (saveError) {
      console.error('保存PDF到后端目录失败:', saveError.message);
      // 不中断流程，仍然发送给前端
    }

    // 设置响应头以触发浏览器下载
    res.setHeader('Content-Type', 'application/pdf');
    // 对文件名进行编码以避免特殊字符导致的错误
    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    console.log('设置响应头完成，文件名:', fileName);

    // 发送PDF数据
    res.send(Buffer.from(pdfBytes));
    console.log('PDF文件发送成功');
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      success: false,
      error: 'PDF生成失败: ' + error.message
    });
  }
});

// 生成教育背景PDF接口（新增）
app.post('/api/generate-education-pdf', async (req, res) => {
  try {
    console.log('开始生成教育背景PDF...');
    // 从请求中获取数据
    const {
      name,
      gender,
      birthDate,
      enrollmentDate,
      graduationDate,
      school,
      major,
      duration,
      degreeLevel,
      educationType,
      studyType,
      graduationStatus,
      certificateNumber,
      principalName,
      photo
    } = req.body;

    console.log('接收到的数据:', {
      name,
      gender,
      birthDate,
      enrollmentDate,
      graduationDate,
      school,
      major,
      duration,
      degreeLevel,
      educationType,
      studyType,
      graduationStatus,
      certificateNumber,
      principalName,
      photo: photo ? '照片数据已接收' : '无照片数据'
    });

    // 验证必要字段
    if (!name || !gender || !birthDate || !enrollmentDate || !graduationDate || 
        !school || !major || !duration || !degreeLevel || !educationType || 
        !studyType || !graduationStatus || !certificateNumber || !principalName) {
      console.warn('缺少必要字段，无法生成PDF');
      return res.status(400).json({
        success: false,
        error: '缺少必要字段'
      });
    }

    // TODO: 实现教育背景PDF生成功能
    // 1. 加载对应的PDF模板文件
    // 2. 填充数据到模板中
    // 3. 嵌入照片
    // 4. 保存并返回PDF
    
    // 示例占位代码（实际应替换为完整的PDF处理逻辑）：
    /*
    const templatePath = path.join(__dirname, 'assets', 'education_background_template.pdf');
    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    
    // 加载字体等后续处理...
    // 填充数据...
    // 添加照片...
    
    const pdfBytes = await pdfDoc.save();
    */

    // 临时模拟PDF生成（实际应删除此部分）
    console.warn('注意：这是临时模拟的PDF生成功能，需要替换为真实的实现');
    
    // 模拟生成PDF数据
    const pdfBytes = Buffer.from('Fake PDF Content - Replace with actual PDF generation logic');
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/pdf');
    const fileName = `教育背景_${name}_${Date.now()}.pdf`;
    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    
    // 发送PDF数据
    res.send(pdfBytes);
    console.log('教育背景PDF文件发送成功');
  } catch (error) {
    console.error("教育背景PDF生成错误:", error);
    res.status(500).json({
      success: false,
      error: 'PDF生成失败: ' + error.message
    });
  }
});

// 生成学籍状态PDF接口
app.post('/api/generate-student-status-pdf', async (req, res) => {
  try {
    console.log('开始生成学籍状态PDF...');
    // 从请求中获取数据
    const {
      name,
      gender,
      birthDate,
      nationality,
      school,
      degreeLevel,
      major,
      duration,
      educationType,
      studyType,
      branch,
      enrollmentDate,
      status,
      graduationDate,
      admissionPhoto,
      degreePhoto
    } = req.body;

    console.log('接收到的数据:', {
      name,
      gender,
      birthDate,
      nationality,
      school,
      degreeLevel,
      major,
      duration,
      educationType,
      studyType,
      branch,
      enrollmentDate,
      status,
      graduationDate,
      admissionPhoto: admissionPhoto ? '录取照片数据已接收' : '无录取照片数据',
      degreePhoto: degreePhoto ? '毕业照片数据已接收' : '无毕业照片数据'
    });

    // 验证必要字段
    if (!name || !gender || !birthDate || !nationality || !school || 
        !degreeLevel || !major || !duration || !educationType || 
        !studyType || !branch || !enrollmentDate || !status || 
        !graduationDate || !admissionPhoto || !degreePhoto) {
      console.warn('缺少必要字段，无法生成PDF');
      return res.status(400).json({
        success: false,
        error: '缺少必要字段'
      });
    }

    // 加载字体文件
    const fontPath = path.join(__dirname, 'assets', 'simhei.ttf'); // 使用黑体字体
    let fontBytes;
    try {
      fontBytes = await fs.readFile(fontPath);
    } catch (fontError) {
      console.error('加载字体文件失败:', fontError.message);
      throw new Error('字体文件加载失败');
    }

    // 创建PDF文档
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const font = await pdfDoc.embedFont(fontBytes);
    const boldFont = font; // 在中文字体中使用相同字体作为粗体显示

    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // 绘制背景
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(1, 1, 1),
    });

    // 绘制头部
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: rgb(0.2, 0.4, 0.8),
    });

    // 标题
    const title = "教育部学籍在线验证报告";
    const titleSize = 24;
    page.drawText(title, {
      x: (width - font.widthOfTextAtSize(title, titleSize)) / 2,
      y: height - 60,
      size: titleSize,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // 日期
    const today = new Date().toLocaleDateString('zh-CN');
    const dateText = `报告日期：${today}`;
    page.drawText(dateText, {
      x: width - 150,
      y: height - 120,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // 处理并嵌入录取照片（如果提供了）
    let admissionPhotoImage;
    if (admissionPhoto) {
      try {
        const base64Data = admissionPhoto.split(',')[1] || admissionPhoto;
        const photoBytes = Uint8Array.from(atob(base64Data));
        admissionPhotoImage = await pdfDoc.embedJpg(photoBytes);
      } catch (error) {
        console.error("嵌入录取照片时出错:", error);
      }
    }

    // 处理并嵌入毕业照片（如果提供了）
    let degreePhotoImage;
    if (degreePhoto) {
      try {
        const base64Data = degreePhoto.split(',')[1] || degreePhoto;
        const photoBytes = Uint8Array.from(atob(base64Data));
        degreePhotoImage = await pdfDoc.embedJpg(photoBytes);
      } catch (error) {
        console.error("嵌入毕业照片时出错:", error);
      }
    }

    // 绘制照片
    if (admissionPhotoImage) {
      page.drawImage(admissionPhotoImage, {
        x: width - 150,
        y: height - 280,
        width: 100,
        height: 130,
      });
      
      page.drawText("录取证件照", {
        x: width - 140,
        y: height - 290,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    if (degreePhotoImage) {
      page.drawImage(degreePhotoImage, {
        x: width - 150,
        y: height - 440,
        width: 100,
        height: 130,
      });
      
      page.drawText("毕业学历证件照", {
        x: width - 150,
        y: height - 450,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    // 内容字段
    const fields = [
      { label: "姓名", value: name },
      { label: "性别", value: gender },
      { label: "出生日期", value: birthDate },
      { label: "民族", value: nationality },
      { label: "学校名称", value: school },
      { label: "层次", value: degreeLevel },
      { label: "专业", value: major },
      { label: "学制", value: duration },
      { label: "学历类别", value: educationType },
      { label: "学习形式", value: studyType },
      { label: "分院系所", value: branch },
      { label: "入学日期", value: enrollmentDate },
      { label: "学籍状态", value: status },
      { label: "离校日期", value: graduationDate },
    ];

    let yPosition = height - 160;
    const lineHeight = 30;
    const labelX = 50;
    const valueX = 180;

    fields.forEach((field) => {
      // 绘制字段标签
      page.drawText(`${field.label}:`, {
        x: labelX,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      // 绘制字段值
      page.drawText(field.value || "", {
        x: valueX,
        y: yPosition,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      yPosition -= lineHeight;
    });

    // 页脚注释
    const footerText = "本报告由学信网学籍学历信息管理平台提供，仅用于验证学籍信息。";
    page.drawText(footerText, {
      x: 50,
      y: 50,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // 保存PDF
    const pdfBytes = await pdfDoc.save();
    
    // 生成文件名
    const fileName = `学籍在线验证报告_${name}_${Date.now()}.pdf`;
    
    // 保存PDF到后端目录
    try {
      const reportDir = path.join(__dirname, 'report_records');
      // 确保目录存在
      await fs.mkdir(reportDir, { recursive: true });
      const filePath = path.join(reportDir, fileName);
      await fs.writeFile(filePath, pdfBytes);
      console.log('PDF文件已在后端保存:', filePath);
    } catch (saveError) {
      console.error('保存PDF到后端目录失败:', saveError.message);
      // 不中断流程，仍然发送给前端
    }

    // 设置响应头以触发浏览器下载
    res.setHeader('Content-Type', 'application/pdf');
    // 对文件名进行编码以避免特殊字符导致的错误
    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    console.log('设置响应头完成，文件名:', fileName);

    // 发送PDF数据
    res.send(Buffer.from(pdfBytes));
    console.log('学籍状态PDF文件发送成功');
  } catch (error) {
    console.error("学籍状态PDF生成错误:", error);
    res.status(500).json({
      success: false,
      error: 'PDF生成失败: ' + error.message
    });
  }
});

// 启动服务器
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});