const mysql = require('mysql2/promise');
const readline = require('readline');
const dbManager = require('../db-utils');

// 判断是否为日志进程（只在进程 0 中询问用户）
const isLogProcess = process.env.NODE_APP_INSTANCE === '0' || !process.env.NODE_APP_INSTANCE;

/**
 * 检查数据库是否存在，如果不存在则询问用户是否创建
 */
async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME || 'degree_management';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbPort = parseInt(process.env.DB_PORT || '3306');

  // 先连接 MySQL（不指定数据库）
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      multipleStatements: true
    });
  } catch (err) {
    console.error(`[数据库] 无法连接到 MySQL 服务器 (${dbHost}:${dbPort}): ${err.message}`);
    throw err;
  }

  try {
    // 检查数据库是否存在
    const [rows] = await connection.execute(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [dbName]
    );

    if (rows.length > 0) {
      // 数据库已存在，直接返回
      await connection.end();
      return;
    }

    // 数据库不存在
    console.warn(`\n[数据库] ⚠️  数据库 "${dbName}" 不存在！`);
    console.warn(`[数据库] 即将创建数据库: ${dbName}`);
    console.warn(`[数据库] MySQL 服务器: ${dbHost}:${dbPort}\n`);

    // 在集群模式下，只有进程 0 可以询问用户
    if (!isLogProcess) {
      // 非日志进程等待一段时间让进程 0 完成创建
      console.safe('[数据库] 等待主进程创建数据库...');
      await waitForDatabase(dbName, connection);
      await connection.end();
      return;
    }

    // 检查是否设置了自动创建环境变量
    const autoCreate = process.env.AUTO_CREATE_DB === 'true' || process.env.AUTO_CREATE_DB === '1';
    
    let confirmed = autoCreate;
    
    if (!autoCreate) {
      // 日志进程询问用户确认
      confirmed = await askUserConfirmation(
        '是否确认创建数据库？(输入 yes 确认): '
      );
    } else {
      console.safe('[数据库] ✅ 检测到 AUTO_CREATE_DB 环境变量，自动创建数据库');
    }

    if (confirmed) {
      console.safe(`[数据库] 正在创建数据库: ${dbName} ...`);
      await connection.execute(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.safe(`[数据库] ✅ 数据库 "${dbName}" 创建成功`);
    } else {
      await connection.end();
      console.error('[数据库] ❌ 用户取消创建数据库，应用退出');
      process.exit(1);
    }
  } catch (err) {
    await connection.end();
    throw err;
  }

  await connection.end();
}

/**
 * 等待数据库创建完成（用于集群模式下的非主进程）
 */
async function waitForDatabase(dbName, connection, maxWaitMs = 30000) {
  const startTime = Date.now();
  const checkInterval = 1000; // 每秒检查一次

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const [rows] = await connection.execute(
        'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
        [dbName]
      );
      if (rows.length > 0) {
        console.safe(`[数据库] ✅ 数据库 "${dbName}" 已就绪`);
        return;
      }
    } catch (err) {
      // 忽略错误，继续等待
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  throw new Error(`等待数据库 "${dbName}" 创建超时（${maxWaitMs / 1000}秒）`);
}

/**
 * 在终端询问用户确认
 */
function askUserConfirmation(question) {
  return new Promise((resolve) => {
    // 检查 stdin 是否可用（PM2 集群模式下可能不可用）
    if (!process.stdin.isTTY) {
      console.error('[数据库] ❌ 当前环境不支持交互式输入');
      console.error('[数据库] 💡 如需自动创建数据库，请设置环境变量: AUTO_CREATE_DB=true');
      console.error('[数据库] 💡 或手动创建数据库后重新启动应用');
      resolve(false);
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    let answered = false;

    rl.question(question, (answer) => {
      if (answered) return;
      answered = true;
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });

    // 超时处理（30秒）
    setTimeout(() => {
      if (answered) return;
      answered = true;
      rl.close();
      console.error('[数据库] ❌ 等待用户输入超时（30秒），应用退出');
      console.error('[数据库] 💡 如需自动创建数据库，请设置环境变量: AUTO_CREATE_DB=true');
      process.exit(1);
    }, 30000);
  });
}

async function initializeDatabaseConnection() {
  try {
    // 先确保数据库存在
    await ensureDatabaseExists();

    // 使用连接池管理器
    const pool = await dbManager.initializePool();
    // 只在日志进程中打印初始化日志
    if (dbManager.isLogProcess) {
      console.safe('使用连接池连接到 MySQL 数据库');
    }
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
      id VARCHAR(36) PRIMARY KEY COMMENT '用户唯一标识ID',
      username VARCHAR(255) NOT NULL UNIQUE COMMENT '用户名，唯一',
      password VARCHAR(255) NOT NULL COMMENT '加密后的密码',
      remaining_logins INT NOT NULL DEFAULT 0 COMMENT '剩余登录次数',
      pdf_limit INT NOT NULL DEFAULT 0 COMMENT 'PDF积分额度，最大90',
      registration_ip VARCHAR(45) COMMENT '注册时的IP地址',
      is_trial_user TINYINT(1) DEFAULT NULL COMMENT '是否为体验版用户: NULL-未设置, 1-是, 0-否',
      has_used_card_reset TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已使用卡密改密: 0-未使用, 1-已使用（一次性限制）',
      tags TEXT DEFAULT NULL COMMENT '用户标签（JSON数组格式），用于标记特别关注的用户',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '账号创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
      CONSTRAINT chk_pdf_limit CHECK (pdf_limit <= 90)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS student_status (
      id VARCHAR(36) PRIMARY KEY COMMENT '学籍记录唯一标识ID',
      user_id VARCHAR(36) NOT NULL COMMENT '关联的用户ID',
      name TEXT NOT NULL COMMENT '学生姓名',
      gender TEXT COMMENT '性别',
      birth_date TEXT COMMENT '出生日期',
      school TEXT NOT NULL COMMENT '学校名称',
      major TEXT NOT NULL COMMENT '专业名称',
      study_type TEXT COMMENT '学习形式（如：普通全日制）',
      degree_level TEXT COMMENT '学历层次（如：本科、专科）',
      nationality TEXT COMMENT '国籍',
      id_number TEXT COMMENT '身份证号',
      status TEXT COMMENT '学籍状态（如：在籍、毕业）',
      enrollment_date TEXT COMMENT '入学日期',
      graduation_date TEXT COMMENT '毕业日期',
      duration TEXT COMMENT '学制年限',
      education_type TEXT COMMENT '教育类型',
      branch TEXT COMMENT '院系',
      department TEXT COMMENT '系别',
      class TEXT COMMENT '班级',
      student_id TEXT COMMENT '学号',
      admission_photo LONGTEXT COMMENT '录取照片（Base64编码）',
      degree_photo LONGTEXT COMMENT '学位照片（Base64编码）',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS education (
      id VARCHAR(36) PRIMARY KEY COMMENT '学历记录唯一标识ID',
      user_id VARCHAR(36) NOT NULL COMMENT '关联的用户ID',
      name TEXT NOT NULL COMMENT '学生姓名',
      gender TEXT COMMENT '性别',
      birth_date TEXT COMMENT '出生日期',
      school TEXT NOT NULL COMMENT '学校名称',
      major TEXT NOT NULL COMMENT '专业名称',
      study_type TEXT COMMENT '学习形式',
      degree_level TEXT COMMENT '学历层次',
      enrollment_date TEXT COMMENT '入学日期',
      graduation_date TEXT COMMENT '毕业日期',
      duration TEXT COMMENT '学制年限',
      education_type TEXT COMMENT '教育类型',
      graduation_status TEXT COMMENT '毕业状态（如：毕业、结业）',
      principal_name TEXT COMMENT '校长姓名',
      certificate_number TEXT COMMENT '证书编号',
      id_number TEXT COMMENT '身份证号',
      photo LONGTEXT COMMENT '学历照片（Base64编码）',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS degree (
      id VARCHAR(36) PRIMARY KEY COMMENT '学位记录唯一标识ID',
      user_id VARCHAR(36) NOT NULL COMMENT '关联的用户ID',
      name TEXT NOT NULL COMMENT '学生姓名',
      gender TEXT COMMENT '性别',
      birth_date TEXT COMMENT '出生日期',
      school TEXT NOT NULL COMMENT '学校名称',
      major TEXT COMMENT '专业名称',
      degree_type TEXT NOT NULL COMMENT '学位类型（如：学士、硕士、博士）',
      degree_level TEXT COMMENT '学位层次',
      degree_date TEXT COMMENT '授予学位日期',
      certificate_number TEXT COMMENT '学位证书编号',
      photo LONGTEXT COMMENT '学位证书照片（Base64编码）',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS exam (
      id VARCHAR(36) PRIMARY KEY COMMENT '考试记录唯一标识ID',
      user_id VARCHAR(36) NOT NULL COMMENT '关联的用户ID',
      name TEXT NOT NULL COMMENT '考生姓名',
      school TEXT NOT NULL COMMENT '报考学校',
      year TEXT COMMENT '考试年份',
      exam_location TEXT COMMENT '考试地点',
      registration_number TEXT COMMENT '准考证号',
      exam_unit TEXT COMMENT '考试单位',
      department TEXT COMMENT '院系',
      major TEXT COMMENT '专业',
      research_direction TEXT COMMENT '研究方向',
      exam_type TEXT COMMENT '考试类型（如：硕士、博士）',
      special_program TEXT COMMENT '专项计划',
      politics_name TEXT COMMENT '政治科目名称',
      politics_score TEXT COMMENT '政治科目成绩',
      foreign_language_name TEXT COMMENT '外语科目名称',
      foreign_language_score TEXT COMMENT '外语科目成绩',
      business_course1_name TEXT COMMENT '业务课一科目名称',
      business_course1_score TEXT COMMENT '业务课一成绩',
      business_course2_name TEXT COMMENT '业务课二科目名称',
      business_course2_score TEXT COMMENT '业务课二成绩',
      total_score TEXT COMMENT '总成绩',
      admission_unit TEXT COMMENT '录取单位',
      admission_major TEXT COMMENT '录取专业',
      note TEXT COMMENT '备注信息',
      photo LONGTEXT COMMENT '考试成绩单照片（Base64编码）',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后更新时间',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS login_logs (
      id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY COMMENT '登录日志唯一标识ID',
      user_id VARCHAR(36) NOT NULL COMMENT '关联的用户ID',
      username TEXT NOT NULL COMMENT '用户名',
      login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
      login_ip VARCHAR(45) COMMENT '登录IP地址',
      ip_location TEXT COMMENT 'IP地理位置',
      login_type VARCHAR(20) DEFAULT 'normal' COMMENT '登录类型：normal-普通用户登录, admin_impersonate-管理员代登录, web_chsi-网页版学信网',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS cards (
      id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY COMMENT '充值卡唯一标识ID',
      \`values\` INT NOT NULL COMMENT '充值额度（登录次数或PDF积分）',
      type ENUM('login', 'pdf') NOT NULL DEFAULT 'login' COMMENT '卡片类型：login-登录次数卡, pdf-PDF积分卡',
      used BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已使用：FALSE-未使用, TRUE-已使用',
      used_by VARCHAR(36) COMMENT '使用该卡的用户ID',
      used_at TIMESTAMP NULL COMMENT '使用时间',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '卡片创建时间',
      FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS admins (
      id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY COMMENT '管理员唯一标识ID',
      username VARCHAR(255) NOT NULL UNIQUE COMMENT '管理员用户名，唯一',
      password VARCHAR(255) NOT NULL COMMENT '加密后的密码',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '账号创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间'
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY COMMENT '留言唯一标识ID',
      username VARCHAR(255) NOT NULL COMMENT '留言用户名称',
      content TEXT NOT NULL COMMENT '留言内容',
      reply_content TEXT COMMENT '管理员回复内容',
      replied_at TIMESTAMP COMMENT '回复时间',
      priority INT DEFAULT NULL COMMENT '留言优先级：数字越小越靠前，NULL表示无优先级按时间排序',
      ip_address VARCHAR(45) DEFAULT NULL COMMENT '留言者IP地址，用于安全审计和频率控制',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '留言创建时间',
      INDEX idx_username_created_at (username, created_at),
      INDEX idx_ip_created_at (ip_address, created_at)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS ip_blacklist (
      id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY COMMENT '黑名单记录唯一标识ID',
      ip_address VARCHAR(45) NOT NULL COMMENT '被封禁的IP地址',
      reason TEXT COMMENT '封禁原因',
      blocked_until TIMESTAMP NOT NULL COMMENT '封禁截止时间',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
      INDEX idx_ip_address (ip_address),
      INDEX idx_blocked_until (blocked_until)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS qr_code_urls (
      id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY COMMENT '二维码记录唯一标识ID',
      short_code VARCHAR(20) NOT NULL UNIQUE COMMENT '短链接代码，唯一',
      full_url TEXT NOT NULL COMMENT '完整的PDF访问URL',
      pdf_type ENUM('degree', 'education', 'student_status') NOT NULL COMMENT 'PDF类型：degree-学位, education-学历, student_status-学籍',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '二维码创建时间',
      expires_at TIMESTAMP COMMENT '二维码过期时间',
      scan_count INT NOT NULL DEFAULT 0 COMMENT '扫描次数',
      last_scanned_at TIMESTAMP NULL COMMENT '最后扫描时间',
      INDEX idx_short_code (short_code),
      INDEX idx_created_at (created_at)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS user_blacklist (
      id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY COMMENT '用户黑名单记录唯一标识ID',
      username VARCHAR(255) NOT NULL COMMENT '被封禁的用户名',
      reason TEXT NOT NULL COMMENT '封禁原因',
      blocked_until TIMESTAMP NOT NULL COMMENT '封禁截止时间',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
      created_by VARCHAR(255) COMMENT '执行封禁的管理员用户名',
      INDEX idx_username (username),
      INDEX idx_blocked_until (blocked_until)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS notification_history (
      id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY COMMENT '通知唯一标识ID',
      channel ENUM('bark', 'email') NOT NULL COMMENT '通知渠道：bark-Bark推送, email-邮件',
      title TEXT NOT NULL COMMENT '通知标题',
      body TEXT NOT NULL COMMENT '通知正文',
      recipient TEXT COMMENT '接收者（Bark设备密钥或邮箱地址）',
      \`group\` TEXT COMMENT '消息分组',
      level TEXT COMMENT '推送级别',
      sound TEXT COMMENT '铃声',
      status ENUM('success', 'failed') NOT NULL DEFAULT 'success' COMMENT '发送状态：success-成功, failed-失败',
      error_message TEXT COMMENT '错误信息（失败时记录）',
      metadata JSON COMMENT '额外元数据（JSON格式）',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
      INDEX idx_channel (channel),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知历史记录表'
    `,
    `
    CREATE TABLE IF NOT EXISTS password_change_history (
      id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY COMMENT '记录唯一标识ID',
      user_id VARCHAR(36) NOT NULL COMMENT '关联的用户ID',
      username VARCHAR(255) NOT NULL COMMENT '用户名',
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
      ip_address VARCHAR(45) COMMENT 'IP地址',
      user_agent TEXT COMMENT 'User-Agent',
      result ENUM('success', 'failed') NOT NULL DEFAULT 'success' COMMENT '操作结果：success-成功, failed-失败',
      is_admin_operation TINYINT(1) DEFAULT 0 COMMENT '是否为管理员操作：0-否, 1-是',
      operator_username VARCHAR(255) COMMENT '操作者用户名（管理员代改时记录）',
      reason TEXT COMMENT '失败原因（失败时记录）',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
      INDEX idx_username (username),
      INDEX idx_changed_at (changed_at),
      INDEX idx_result (result)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='密码修改历史记录表'
    `,
    `
    CREATE TABLE IF NOT EXISTS system_config (
      config_key VARCHAR(100) NOT NULL PRIMARY KEY COMMENT '配置键',
      config_value TEXT NOT NULL COMMENT '配置值',
      description VARCHAR(255) COMMENT '配置描述',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_updated_at (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统动态配置表'
    `
  ];

  // 创建表
  for (const query of tables) {
    await db.execute(query);
  }
  
  // 只在日志进程中打印日志
  const isLogProcess = dbManager.isLogProcess;
  
  // 创建索引的辅助函数，处理死锁和重复索引的情况
  async function createIndexIfExists(indexName, tableName, columnName) {
   try {
      await db.execute(`CREATE INDEX ${indexName} ON ${tableName}(${columnName})`);
    if (isLogProcess) {
      console.safe(`索引 ${indexName} 创建成功`);
    }
    } catch (err) {
      // 如果索引已存在或发生死锁，忽略错误
      if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_LOCK_DEADLOCK') {
      if (isLogProcess) {
        console.safe(`索引 ${indexName} 已存在或创建时发生死锁，跳过`);
      }
      } else {
        throw err; // 其他错误继续抛出
      }
    }
  }
  
  // 使用辅助函数创建索引
  await createIndexIfExists('idx_login_logs_login_time', 'login_logs', 'login_time');
  await createIndexIfExists('idx_login_logs_user_id', 'login_logs', 'user_id');
  await createIndexIfExists('idx_users_registration_ip', 'users', 'registration_ip');
  await createIndexIfExists('idx_cards_used_type', 'cards', '`used`, `type`, `values`');
  await createIndexIfExists('idx_cards_used_at', 'cards', '`used_at`');
  await createIndexIfExists('idx_notification_history_created', 'notification_history', '`created_at`');
  await createIndexIfExists('idx_password_change_user', 'password_change_history', '`user_id`, `changed_at`');
  
  if (isLogProcess) {
    console.safe('Database tables initialized');
  }
  
  // 插入系统配置默认值（如果不存在）
  const defaultConfigs = [
    ['bark_enabled', 'true', 'Bark推送功能开关'],
    ['bark_sound', 'paymentsuccess', 'Bark推送铃声'],
    ['bark_level', 'active', 'Bark推送级别'],
    ['bark_group', '学位管理系统充值通知', 'Bark推送分组'],
    ['bark_icon', '', 'Bark推送图标URL'],
    ['bark_url', '', 'Bark推送点击跳转URL'],
    ['bark_daily_report_enabled', 'true', '每日收入统计定时推送开关'],
  ];
  for (const [key, value, desc] of defaultConfigs) {
    await db.execute(
      `INSERT IGNORE INTO system_config (config_key, config_value, description) VALUES (?, ?, ?)`,
      [key, value, desc]
    );
  }
  
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
    if (isLogProcess) {
      console.safe('Initial admin user created');
    }
  }
}

module.exports = {
  initializeDatabaseConnection,
  createTables
};