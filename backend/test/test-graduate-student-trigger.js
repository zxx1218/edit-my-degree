/**
 * 测试研究生学籍被动触发逻辑
 * 
 * 测试场景：
 * 1. 添加硕士研究生学籍时，自动创建考研信息、本科学历和学位
 * 2. 添加博士研究生学籍时，自动创建考研信息、本科和硕士的学历和学位
 */

require('dotenv').config({ path: './.env' });

const dbManager = require('../src/db-utils');
const { v4: uuidv4 } = require('uuid');

// 测试用户ID（需要替换为实际存在的用户ID）
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-id';

async function setupTestData() {
  console.log('\n📝 准备测试数据...');
  
  try {
    // 1. 创建测试本科学籍
    const undergradStatusId = uuidv4();
    await dbManager.execute(
      `INSERT INTO student_status (id, user_id, name, gender, birth_date, school, major, study_type, degree_level, enrollment_date, graduation_date, status, degree_photo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        undergradStatusId,
        TEST_USER_ID,
        '测试用户',
        '男',
        '2000-01-01',
        '北京大学',
        '计算机科学与技术',
        '全日制',
        '本科',
        '2018-09-01',
        '2022-06-30',
        '在籍（注册学籍）',
        ''
      ]
    );
    console.log(`✅ 已创建本科学籍，ID: ${undergradStatusId}`);

    // 2. 创建测试硕士学籍
    const masterStatusId = uuidv4();
    await dbManager.execute(
      `INSERT INTO student_status (id, user_id, name, gender, birth_date, school, major, study_type, degree_level, enrollment_date, graduation_date, status, degree_photo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        masterStatusId,
        TEST_USER_ID,
        '测试用户',
        '男',
        '2000-01-01',
        '清华大学',
        '软件工程',
        '全日制',
        '硕士研究生',
        '2022-09-01',
        '2025-06-30',
        '在籍（注册学籍）',
        ''
      ]
    );
    console.log(`✅ 已创建硕士学籍，ID: ${masterStatusId}`);

    return { undergradStatusId, masterStatusId };
  } catch (err) {
    console.error('❌ 准备测试数据失败:', err.message);
    throw err;
  }
}

async function testMasterStudentTrigger() {
  console.log('\n🎓 测试场景1：添加硕士研究生学籍');
  console.log('=' .repeat(60));

  try {
    // 模拟添加硕士研究生学籍
    const masterStatusId = uuidv4();
    const insertData = {
      id: masterStatusId,
      user_id: TEST_USER_ID,
      name: '测试用户',
      gender: '男',
      birth_date: '2000-01-01',
      school: '复旦大学',
      major: '人工智能',
      study_type: '全日制',
      degree_level: '硕士研究生',
      enrollment_date: '2025-09-01',
      graduation_date: '2028-06-30',
      status: '在籍（注册学籍）',
      degree_photo: ''
    };

    const columns = Object.keys(insertData).join(', ');
    const placeholders = Object.keys(insertData).map(() => '?').join(', ');
    const values = Object.values(insertData);

    await dbManager.execute(
      `INSERT INTO student_status (${columns}) VALUES (${placeholders})`,
      values
    );

    console.log(`✅ 已添加硕士研究生学籍，学校: ${insertData.school}`);

    // 等待一下让被动触发逻辑执行
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 检查结果
    console.log('\n🔍 检查触发结果...');

    // 1. 检查是否创建了考研信息
    const [examRecords] = await dbManager.execute(
      'SELECT * FROM exam WHERE user_id = ? AND school = ?',
      [TEST_USER_ID, insertData.school]
    );
    console.log(`   - 考研信息: ${examRecords.length > 0 ? '✅ 已创建' : '❌ 未创建'}`);
    if (examRecords.length > 0) {
      console.log(`     学校: ${examRecords[0].school}`);
    }

    // 2. 检查本科学籍状态是否更新
    const [undergradStatus] = await dbManager.execute(
      'SELECT * FROM student_status WHERE user_id = ? AND degree_level = ?',
      [TEST_USER_ID, '本科']
    );
    console.log(`   - 本科学籍状态: ${undergradStatus.length > 0 ? undergradStatus[0].status : '❌ 未找到'}`);

    // 3. 检查是否创建了本科学历
    const [undergradEducation] = await dbManager.execute(
      'SELECT * FROM education WHERE user_id = ? AND degree_level = ?',
      [TEST_USER_ID, '本科']
    );
    console.log(`   - 本科学历: ${undergradEducation.length > 0 ? '✅ 已创建' : '❌ 未创建'}`);
    if (undergradEducation.length > 0) {
      console.log(`     学校: ${undergradEducation[0].school}, 专业: ${undergradEducation[0].major}`);
    }

    // 4. 检查是否创建了本科学位
    const [undergradDegree] = await dbManager.execute(
      'SELECT * FROM degree WHERE user_id = ? AND degree_type = ?',
      [TEST_USER_ID, '学士']
    );
    console.log(`   - 本科学位: ${undergradDegree.length > 0 ? '✅ 已创建' : '❌ 未创建'}`);
    if (undergradDegree.length > 0) {
      console.log(`     学校: ${undergradDegree[0].school}, 专业: ${undergradDegree[0].major}`);
    }

    console.log('\n✅ 硕士研究生触发测试完成\n');
  } catch (err) {
    console.error('❌ 测试失败:', err.message);
    throw err;
  }
}

async function testDoctoralStudentTrigger() {
  console.log('\n🎓 测试场景2：添加博士研究生学籍');
  console.log('=' .repeat(60));

  try {
    // 模拟添加博士研究生学籍
    const doctoralStatusId = uuidv4();
    const insertData = {
      id: doctoralStatusId,
      user_id: TEST_USER_ID,
      name: '测试用户',
      gender: '男',
      birth_date: '2000-01-01',
      school: '浙江大学',
      major: '计算机科学',
      study_type: '全日制',
      degree_level: '博士研究生',
      enrollment_date: '2028-09-01',
      graduation_date: '2032-06-30',
      status: '在籍（注册学籍）',
      degree_photo: ''
    };

    const columns = Object.keys(insertData).join(', ');
    const placeholders = Object.keys(insertData).map(() => '?').join(', ');
    const values = Object.values(insertData);

    await dbManager.execute(
      `INSERT INTO student_status (${columns}) VALUES (${placeholders})`,
      values
    );

    console.log(`✅ 已添加博士研究生学籍，学校: ${insertData.school}`);

    // 等待一下让被动触发逻辑执行
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 检查结果
    console.log('\n🔍 检查触发结果...');

    // 1. 检查是否创建了考研信息
    const [examRecords] = await dbManager.execute(
      'SELECT * FROM exam WHERE user_id = ? AND school = ?',
      [TEST_USER_ID, insertData.school]
    );
    console.log(`   - 考研信息: ${examRecords.length > 0 ? '✅ 已创建' : '❌ 未创建'}`);

    // 2. 检查本科学籍状态
    const [undergradStatus] = await dbManager.execute(
      'SELECT * FROM student_status WHERE user_id = ? AND degree_level = ? AND status = ?',
      [TEST_USER_ID, '本科', '不在籍（毕业）']
    );
    console.log(`   - 本科学籍状态: ${undergradStatus.length > 0 ? '✅ 已更新为毕业' : '❌ 未更新'}`);

    // 3. 检查硕士学籍状态
    const [masterStatus] = await dbManager.execute(
      'SELECT * FROM student_status WHERE user_id = ? AND degree_level = ? AND status = ?',
      [TEST_USER_ID, '硕士研究生', '不在籍（毕业）']
    );
    console.log(`   - 硕士学籍状态: ${masterStatus.length > 0 ? '✅ 已更新为毕业' : '❌ 未更新'}`);

    // 4. 检查本科学历
    const [undergradEducation] = await dbManager.execute(
      'SELECT * FROM education WHERE user_id = ? AND degree_level = ?',
      [TEST_USER_ID, '本科']
    );
    console.log(`   - 本科学历: ${undergradEducation.length > 0 ? '✅ 已创建' : '❌ 未创建'}`);

    // 5. 检查本科学位
    const [undergradDegree] = await dbManager.execute(
      'SELECT * FROM degree WHERE user_id = ? AND degree_type = ?',
      [TEST_USER_ID, '学士']
    );
    console.log(`   - 本科学位: ${undergradDegree.length > 0 ? '✅ 已创建' : '❌ 未创建'}`);

    // 6. 检查硕士学历
    const [masterEducation] = await dbManager.execute(
      'SELECT * FROM education WHERE user_id = ? AND degree_level = ?',
      [TEST_USER_ID, '硕士研究生']
    );
    console.log(`   - 硕士学历: ${masterEducation.length > 0 ? '✅ 已创建' : '❌ 未创建'}`);

    // 7. 检查硕士学位
    const [masterDegree] = await dbManager.execute(
      'SELECT * FROM degree WHERE user_id = ? AND degree_type = ?',
      [TEST_USER_ID, '硕士']
    );
    console.log(`   - 硕士学位: ${masterDegree.length > 0 ? '✅ 已创建' : '❌ 未创建'}`);

    console.log('\n✅ 博士研究生触发测试完成\n');
  } catch (err) {
    console.error('❌ 测试失败:', err.message);
    throw err;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 清理测试数据...');
  
  try {
    await dbManager.execute('DELETE FROM exam WHERE user_id = ?', [TEST_USER_ID]);
    await dbManager.execute('DELETE FROM degree WHERE user_id = ?', [TEST_USER_ID]);
    await dbManager.execute('DELETE FROM education WHERE user_id = ?', [TEST_USER_ID]);
    await dbManager.execute('DELETE FROM student_status WHERE user_id = ?', [TEST_USER_ID]);
    
    console.log('✅ 测试数据已清理\n');
  } catch (err) {
    console.error('❌ 清理测试数据失败:', err.message);
  }
}

async function main() {
  console.log('\n🚀 开始测试研究生学籍被动触发逻辑');
  console.log('=' .repeat(60));

  try {
    await dbManager.initializePool();
    console.log('✅ 数据库连接成功');

    // 准备测试数据
    await setupTestData();

    // 测试硕士研究生触发
    await testMasterStudentTrigger();

    // 测试博士研究生触发
    await testDoctoralStudentTrigger();

    console.log('\n🎉 所有测试完成！');
  } catch (err) {
    console.error('\n❌ 测试过程中发生错误:', err.message);
    console.error(err.stack);
  } finally {
    // 清理测试数据
    await cleanupTestData();
    
    await dbManager.close();
    console.log('✅ 数据库连接已关闭\n');
  }
}

// 支持直接运行
if (require.main === module) {
  main().catch(error => {
    console.error('未捕获的错误:', error);
    process.exit(1);
  });
}

module.exports = { main };
