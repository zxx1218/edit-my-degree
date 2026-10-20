const { v4: uuidv4 } = require('uuid');
const { logOperation } = require('./operation-logger');
const { getClientIp } = require('./get-client-ip');

/**
 * 获取表的字段列表（带缓存）
 */
const tableColumnsCache = new Map();

async function getTableColumns(db, tableName) {
  // 检查缓存
  if (tableColumnsCache.has(tableName)) {
    return tableColumnsCache.get(tableName);
  }
  
  try {
    const [columns] = await db.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
      [tableName]
    );
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    tableColumnsCache.set(tableName, columnNames);
    return columnNames;
  } catch (err) {
    console.error(`[数据操作] 获取表 ${tableName} 的字段列表失败:`, err.message);
    return [];
  }
}

/**
 * 过滤掉不存在的字段
 */
async function filterValidFields(db, tableName, data) {
  const validColumns = await getTableColumns(db, tableName);
  
  if (validColumns.length === 0) {
    // 如果无法获取字段列表，返回原始数据
    return data;
  }
  
  const filteredData = {};
  const invalidFields = [];
  
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      if (validColumns.includes(key)) {
        filteredData[key] = data[key];
      } else {
        invalidFields.push(key);
      }
    }
  }
  
  if (invalidFields.length > 0) {
    console.warn(`[数据操作] 过滤掉无效字段 - 表: ${tableName}, 无效字段: ${invalidFields.join(', ')}`);
  }
  
  return filteredData;
}

/**
 * 检查是否为研究生学籍（硕士或博士）
 */
function isGraduateStudent(degreeLevel) {
  return degreeLevel === '硕士研究生' || degreeLevel === '博士研究生';
}

/**
 * 检查用户是否存在指定学校的考研信息
 */
async function checkExamRecord(db, userId, schoolName) {
  try {
    const [records] = await db.execute(
      'SELECT id FROM exam WHERE user_id = ? AND school = ? LIMIT 1',
      [userId, schoolName]
    );
    return records.length > 0 ? records[0] : null;
  } catch (err) {
    console.error('[数据操作] 检查考研信息失败:', err.message);
    return null;
  }
}

/**
 * 创建考研信息
 */
async function createExamRecord(db, userId, schoolName) {
  try {
    const examId = uuidv4();
    
    // 获取用户基本信息
    const [userResult] = await db.execute(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );
    
    const username = userResult.length > 0 ? userResult[0].username : ''    
    // 获取当前年份
    const currentYear = new Date().getFullYear().toString();
    
    const insertData = {
      id: examId,
      user_id: userId,
      name: username,
      school: schoolName,
      year: currentYear,
      exam_location: '',
      registration_number: '',
      exam_unit: '',
      department: '',
      major: '',
      research_direction: '',
      exam_type: '',
      special_program: '',
      politics_name: '',
      politics_score: '',
      foreign_language_name: '',
      foreign_language_score: '',
      business_course1_name: '',
      business_course1_score: '',
      business_course2_name: '',
      business_course2_score: '',
      total_score: '',
      admission_unit: '',
      admission_major: '',
      note: '',
      photo: ''
    };

    const columns = Object.keys(insertData).join(', ');
    const placeholders = Object.keys(insertData).map(() => '?').join(', ');
    const values = Object.values(insertData);

    await db.execute(
      `INSERT INTO exam (${columns}) VALUES (${placeholders})`,
      values
    );

    console.log(`[数据操作] 已创建考研信息，ID: ${examId}，学校: ${schoolName}，年份: ${currentYear}`);
    return examId;
  } catch (err) {
    console.error('[数据操作] 创建考研信息失败:', err.message);
    throw err;
  }
}

/**
 * 检查用户是否存在指定层次的学籍
 */
async function checkStatusByLevel(db, userId, degreeLevel) {
  try {
    const [records] = await db.execute(
      'SELECT * FROM student_status WHERE user_id = ? AND degree_level = ?',
      [userId, degreeLevel]
    );
    return records;
  } catch (err) {
    console.error(`[数据操作] 检查${degreeLevel}学籍失败:`, err.message);
    return [];
  }
}

/**
 * 更新学籍状态为"不在籍（毕业）"
 */
async function updateStatusToGraduated(db, userId, statusId) {
  try {
    await db.execute(
      'UPDATE student_status SET status = ? WHERE id = ? AND user_id = ?',
      ['不在籍（毕业）', statusId, userId]
    );
    console.log(`[数据操作] 已更新学籍 ${statusId} 状态为"不在籍（毕业）"`);
  } catch (err) {
    console.error('[数据操作] 更新学籍状态失败:', err.message);
    throw err;
  }
}

/**
 * 检查用户是否存在指定学校和专业的学历信息
 */
async function checkEducationRecord(db, userId, school, major, degreeLevel) {
  try {
    const [records] = await db.execute(
      'SELECT id FROM education WHERE user_id = ? AND school = ? AND major = ? AND degree_level = ?',
      [userId, school, major, degreeLevel]
    );
    return records.length > 0 ? records[0] : null;
  } catch (err) {
    console.error('[数据操作] 检查学历信息失败:', err.message);
    return null;
  }
}

/**
 * 创建学历信息
 */
async function createEducationRecord(db, userId, statusData, degreeLevel) {
  try {
    const educationId = uuidv4();
    
    // 根据层次设置不同的学制
    let duration = '4 年';
    if (degreeLevel === '硕士研究生') {
      duration = '3 年';
    } else if (degreeLevel === '博士研究生') {
      duration = '4 年';
    }

    const insertData = {
      id: educationId,
      user_id: userId,
      name: statusData.name || '',
      gender: statusData.gender || '',
      birth_date: statusData.birth_date || '',
      school: statusData.school || '',
      major: statusData.major || '',
      study_type: statusData.study_type || '',
      degree_level: degreeLevel,
      enrollment_date: statusData.enrollment_date || '',
      graduation_date: statusData.graduation_date || '',
      duration: duration,
      education_type: statusData.education_type || '',
      graduation_status: '长按我更新',
      principal_name: '长按我更新',
      certificate_number: '长按我更新',
      id_number: '',
      photo: statusData.degree_photo || ''
    };

    const columns = Object.keys(insertData).join(', ');
    const placeholders = Object.keys(insertData).map(() => '?').join(', ');
    const values = Object.values(insertData);

    await db.execute(
      `INSERT INTO education (${columns}) VALUES (${placeholders})`,
      values
    );

    console.log(`[数据操作] 已创建${degreeLevel}学历信息，ID: ${educationId}`);
    return educationId;
  } catch (err) {
    console.error(`[数据操作] 创建${degreeLevel}学历失败:`, err.message);
    throw err;
  }
}

/**
 * 检查用户是否存在指定学校和专业的学位信息
 */
async function checkDegreeRecord(db, userId, school, major, degreeType) {
  try {
    const [records] = await db.execute(
      'SELECT id FROM degree WHERE user_id = ? AND school = ? AND major = ? AND degree_type = ?',
      [userId, school, major, degreeType]
    );
    return records.length > 0 ? records[0] : null;
  } catch (err) {
    console.error('[数据操作] 检查学位信息失败:', err.message);
    return null;
  }
}

/**
 * 根据专业名称和学位层次生成学位名称
 */
function getDegreeNameByMajor(major, degreeType) {
  if (!major) {
    return '请长按卡片编辑学位名称';
  }

  const majorLower = major.toLowerCase();
  
  // 工学类
  const engineeringMajors = ['计算机', '软件', '机械', '电子', '通信', '土木', '建筑', '电气', '自动化', '材料', '化工', '环境', '生物工程'];
  if (engineeringMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '工学硕士学位' : degreeType === '博士' ? '工学博士学位' : '工学学士学位';
  }
  
  // 理学类
  const scienceMajors = ['数学', '物理', '化学', '生物', '统计', '天文', '地理', '大气', '海洋'];
  if (scienceMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '理学硕士学位' : degreeType === '博士' ? '理学博士学位' : '理学学士学位';
  }
  
  // 管理学类
  const managementMajors = ['工商管理', '管理', '会计', '财务', '市场营销', '人力资源', '物流', '电子商务', '旅游管理', '行政管理'];
  if (managementMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '管理学硕士学位' : degreeType === '博士' ? '管理学博士学位' : '管理学学士学位';
  }
  
  // 经济学类
  const economicsMajors = ['经济', '金融', '贸易', '财政', '税收', '保险', '投资'];
  if (economicsMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '经济学硕士学位' : degreeType === '博士' ? '经济学博士学位' : '经济学学士学位';
  }
  
  // 文学类
  const literatureMajors = ['中文', '汉语', '英语', '日语', '俄语', '德语', '法语', '外语', '新闻', '传播', '广告'];
  if (literatureMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '文学硕士学位' : degreeType === '博士' ? '文学博士学位' : '文学学士学位';
  }
  
  // 法学类
  const lawMajors = ['法学', '法律', '政治', '社会学', '民族', '公安'];
  if (lawMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '法学硕士学位' : degreeType === '博士' ? '法学博士学位' : '法学学士学位';
  }
  
  // 教育学类
  const educationMajors = ['教育', '心理', '学前', '小学', '特殊教育'];
  if (educationMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '教育学硕士学位' : degreeType === '博士' ? '教育学博士学位' : '教育学学士学位';
  }
  
  // 医学类
  const medicalMajors = ['医学', '临床', '口腔', '中医', '药学', '护理', '公共卫生', '预防医学'];
  if (medicalMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '医学硕士学位' : degreeType === '博士' ? '医学博士学位' : '医学学士学位';
  }
  
  // 农学类
  const agricultureMajors = ['农学', '农业', '园艺', '植物', '动物', '畜牧', '兽医', '林学'];
  if (agricultureMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '农学硕士学位' : degreeType === '博士' ? '农学博士学位' : '农学学士学位';
  }
  
  // 历史学类
  const historyMajors = ['历史', '考古', '文物', '博物馆'];
  if (historyMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '历史学硕士学位' : degreeType === '博士' ? '历史学博士学位' : '历史学学士学位';
  }
  
  // 哲学类
  const philosophyMajors = ['哲学', '逻辑', '伦理', '美学'];
  if (philosophyMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '哲学硕士学位' : degreeType === '博士' ? '哲学博士学位' : '哲学学士学位';
  }
  
  // 艺术学类
  const artMajors = ['艺术', '美术', '设计', '音乐', '舞蹈', '戏剧', '电影', '动画'];
  if (artMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '艺术学硕士学位' : degreeType === '博士' ? '艺术学博士学位' : '艺术学学士学位';
  }
  
  // 军事学类
  const militaryMajors = ['军事', '国防', '指挥'];
  if (militaryMajors.some(m => majorLower.includes(m))) {
    return degreeType === '硕士' ? '军事学硕士学位' : degreeType === '博士' ? '军事学博士学位' : '军事学学士学位';
  }
  
  // 如果无法匹配，返回默认提示
  return '请长按卡片编辑学位名称';
}

/**
 * 创建学位信息
 */
async function createDegreeRecord(db, userId, statusData, degreeLevel) {
  try {
    const degreeId = uuidv4();
    
    // 根据层次设置学位类型
    let degreeType = '学士';
    if (degreeLevel === '硕士研究生') {
      degreeType = '硕士';
    } else if (degreeLevel === '博士研究生') {
      degreeType = '博士';
    }

    // 根据专业名称生成学位名称
    const degreeName = getDegreeNameByMajor(statusData.major, degreeType);

    const insertData = {
      id: degreeId,
      user_id: userId,
      name: statusData.name || '',
      gender: statusData.gender || '',
      birth_date: statusData.birth_date || '',
      school: statusData.school || '',
      major: degreeName,
      degree_type: degreeType,
      degree_level: degreeLevel,
      degree_date: statusData.graduation_date || '',
      certificate_number: '长按我更新',
      photo: statusData.degree_photo || ''
    };

    const columns = Object.keys(insertData).join(', ');
    const placeholders = Object.keys(insertData).map(() => '?').join(', ');
    const values = Object.values(insertData);

    await db.execute(
      `INSERT INTO degree (${columns}) VALUES (${placeholders})`,
      values
    );

    console.log(`[数据操作] 已创建${degreeLevel}学位信息，ID: ${degreeId}，学位名称: ${degreeName}`);
    return degreeId;
  } catch (err) {
    console.error(`[数据操作] 创建${degreeLevel}学位失败:`, err.message);
    throw err;
  }
}

/**
 * 处理研究生学籍添加的被动触发逻辑
 */
async function handleGraduateStudentInsert(db, userId, insertedData) {
  try {
    const degreeLevel = insertedData.degree_level;
    
    // 检查是否为硕士或博士研究生
    if (!isGraduateStudent(degreeLevel)) {
      return;
    }

    console.log(`[数据操作] 检测到研究生学籍添加（${degreeLevel}），开始执行被动触发逻辑...`);

    // 根据研究生类型处理
    if (degreeLevel === '硕士研究生') {
      // 硕士研究生：检查并创建考研信息，处理本科学籍
      const examRecord = await checkExamRecord(db, userId, insertedData.school);
      if (!examRecord) {
        console.log('[数据操作] 未找到考研信息，开始创建...');
        await createExamRecord(db, userId, insertedData.school);
      } else {
        console.log('[数据操作] 已存在考研信息，跳过创建');
      }

      // 检查并处理本科学籍
      const undergraduateStatuses = await checkStatusByLevel(db, userId, '本科');
      
      if (undergraduateStatuses.length === 0) {
        console.log('[数据操作] 未找到本科学籍，跳过后续操作');
        return;
      }

      console.log(`[数据操作] 找到 ${undergraduateStatuses.length} 条本科学籍，开始处理...`);

      for (const undergradStatus of undergraduateStatuses) {
        // 更新本科学籍状态为"不在籍（毕业）"
        await updateStatusToGraduated(db, userId, undergradStatus.id);

        // 检查是否存在本科学历信息
        const undergraduateEducation = await checkEducationRecord(
          db, 
          userId, 
          undergradStatus.school, 
          undergradStatus.major,
          '本科'
        );

        if (!undergraduateEducation) {
          console.log('[数据操作] 未找到本科学历信息，开始创建...');
          await createEducationRecord(db, userId, undergradStatus, '本科');
        } else {
          console.log('[数据操作] 已存在本科学历信息，跳过创建');
        }

        // 检查是否存在本科学位信息
        const undergraduateDegreeName = getDegreeNameByMajor(undergradStatus.major, '学士');
        const undergraduateDegree = await checkDegreeRecord(
          db,
          userId,
          undergradStatus.school,
          undergraduateDegreeName,
          '学士'
        );

        if (!undergraduateDegree) {
          console.log('[数据操作] 未找到本科学位信息，开始创建...');
          await createDegreeRecord(db, userId, undergradStatus, '本科');
        } else {
          console.log('[数据操作] 已存在本科学位信息，跳过创建');
        }
      }
    } else if (degreeLevel === '博士研究生') {
      // 博士研究生：只处理硕士学籍（不创建考研信息，不处理本科学籍）
      const masterStatuses = await checkStatusByLevel(db, userId, '硕士研究生');

      // 处理硕士学籍
      if (masterStatuses.length > 0) {
        console.log(`[数据操作] 找到 ${masterStatuses.length} 条硕士学籍，开始处理...`);

        for (const masterStatus of masterStatuses) {
          // 更新硕士学籍状态为"不在籍（毕业）"
          await updateStatusToGraduated(db, userId, masterStatus.id);

          // 检查是否存在硕士学历信息
          const masterEducation = await checkEducationRecord(
            db, 
            userId, 
            masterStatus.school, 
            masterStatus.major,
            '硕士研究生'
          );

          if (!masterEducation) {
            console.log('[数据操作] 未找到硕士学历信息，开始创建...');
            await createEducationRecord(db, userId, masterStatus, '硕士研究生');
          } else {
            console.log('[数据操作] 已存在硕士学历信息，跳过创建');
          }

          // 检查是否存在硕士学位信息
          const masterDegreeName = getDegreeNameByMajor(masterStatus.major, '硕士');
          const masterDegree = await checkDegreeRecord(
            db,
            userId,
            masterStatus.school,
            masterDegreeName,
            '硕士'
          );

          if (!masterDegree) {
            console.log('[数据操作] 未找到硕士学位信息，开始创建...');
            await createDegreeRecord(db, userId, masterStatus, '硕士研究生');
          } else {
            console.log('[数据操作] 已存在硕士学位信息，跳过创建');
          }
        }
      } else {
        console.log('[数据操作] 未找到硕士学籍，跳过后续操作');
      }
    }

    console.log('[数据操作] 研究生学籍被动触发逻辑执行完成');
  } catch (err) {
    console.error('[数据操作] 处理研究生学籍被动触发逻辑失败:', err.message);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 更新数据接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    const ipAddress = getClientIp(req);
    const userAgent = req.get('User-Agent') || 'Unknown';

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
      
      // 获取用户名
      let username = 'unknown';
      try {
        const [userResult] = await db.execute(
          'SELECT username FROM users WHERE id = ?',
          [userId]
        );
        if (userResult.length > 0) {
          username = userResult[0].username;
        }
      } catch (err) {
        console.error('[数据操作] 获取用户名失败:', err.message, { userId });
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
      
      // 过滤掉数据库中不存在的字段
      const validData = await filterValidFields(db, table, sanitizedData);
      
      switch (action) {
        case 'insert':
          // 生成UUID作为记录ID
          const recordId = uuidv4();
          
          // 构造插入语句
          const insertData = { id: recordId, ...validData, user_id: userId };
          
          const columns = Object.keys(insertData).join(', ');
          const placeholders = Object.keys(insertData).map(() => '?').join(', ');
          const values = Object.values(insertData);
          
          await db.execute(
            `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
            values
          );
          
          // 记录操作日志
          logOperation(userId, username, 'insert', table, { id: recordId, ...sanitizedData }, ipAddress, userAgent, 'success');
          
          // 如果是学籍表且为研究生学籍，执行被动触发逻辑（异步非阻塞）
          if (table === 'student_status' && isGraduateStudent(sanitizedData.degree_level)) {
            // 使用 setImmediate 将耗时操作推迟到下一个事件循环，确保HTTP响应立即返回
            // 关键：在当前连接上执行，避免连接管理问题
            const currentDb = db; // 保存当前数据库连接引用
            setImmediate(async () => {
              try {
                await handleGraduateStudentInsert(currentDb, userId, sanitizedData);
                console.log('[数据操作] 研究生学籍被动触发逻辑执行完成');
              } catch (err) {
                console.error('[数据操作] 研究生学籍被动触发逻辑执行失败:', err.message);
              }
            });
          }
          
          // 返回完整的数据对象
          const responseData = insertData;
          res.json({ success: true, data: [responseData] }); // 包装成数组以匹配supabase格式
          return;
          
        case 'update':
          // 验证更新数据是否为空
          if (Object.keys(validData).length === 0) {
            return res.status(400).json({
              success: false,
              error: '更新数据不能为空或包含无效字段'
            });
          }
          
          // 构造更新语句
          const updates = Object.keys(validData).map(key => `${key} = ?`).join(', ');
          const updateValues = Object.values(validData);
          updateValues.push(id, userId); // 添加 id 和 userId 用于 WHERE 条件
          
          await db.execute(
            `UPDATE ${table} SET ${updates} WHERE id = ? AND user_id = ?`,
            updateValues
          );
          
          // 记录操作日志
          logOperation(userId, username, 'update', table, { id, data: validData }, ipAddress, userAgent, 'success');
          
          result = { id };
          break;
          
        case 'delete':
          // 获取要删除的记录数据用于日志
          let deletedData = {};
          try {
            const [recordResult] = await db.execute(
              `SELECT * FROM ${table} WHERE id = ? AND user_id = ?`,
              [id, userId]
            );
            if (recordResult.length > 0) {
              deletedData = recordResult[0];
            }
          } catch (err) {
            console.error('[数据操作] 获取删除记录数据失败:', err.message, { id, userId });
          }
          
          await db.execute(
            `DELETE FROM ${table} WHERE id = ? AND user_id = ?`,
            [id, userId].map(value => value === undefined ? null : value)
          );
          
          // 记录操作日志
          logOperation(userId, username, 'delete', table, { id, data: deletedData }, ipAddress, userAgent, 'success');
          
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
      console.error('[数据操作] 操作异常:', err.message, { 
        table: req.body?.table,
        action: req.body?.action,
        userId: req.body?.userId,
        ip: ipAddress,
        stack: err.stack 
      });
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