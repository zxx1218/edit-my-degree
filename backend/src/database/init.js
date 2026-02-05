const mysql = require('mysql2/promise');
const dbManager = require('../db-utils');

async function initializeDatabaseConnection() {
  try {
    // 使用连接池管理器
    const pool = await dbManager.initializePool();
    console.log('使用连接池连接到MySQL数据库');
    return pool;
  } catch (err) {
    console.error('数据库连接初始化失败:', err);
    throw err;
  }
}

async function createTables(db) {
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT chk_pdf_limit CHECK (pdf_limit <= 90)
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
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    `,
    `
    CREATE TABLE IF NOT EXISTS admins (
      id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
  
  // 插入初始管理员账户（如果不存在）
  const [adminExists] = await db.execute(
    'SELECT id FROM admins WHERE username = ?',
    ['zxx']
  );
  
  if (adminExists.length === 0) {
    // 注意：在实际应用中，应该使用 bcrypt 对密码进行加密
    await db.execute(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      ['zxx', '991218zxnmA-']
    );
    console.log('Initial admin user created');
  }
}

module.exports = {
  initializeDatabaseConnection,
  createTables
};