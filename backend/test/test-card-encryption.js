/**
 * 测试充值卡加密解密功能
 */

const cryptoUtils = require('../src/crypto-utils');
require('dotenv').config({ path: '../.env' }); // 加载根目录的.env文件

// 测试用例
function testCardEncryption() {
  console.log('=== 充值卡加密解密测试 ===\n');
  
  // 生成一个测试用的UUID（模拟充值卡ID）
  const { v4: uuidv4 } = require('uuid');
  const cardId = uuidv4();
  
  console.log('1. 原始充值卡ID:', cardId);
  
  // 前端加密（模拟）
  const encrypted = cryptoUtils.encrypt(cardId);
  console.log('2. 加密后的SBverify值:', encrypted);
  
  // 后端解密（模拟）
  const decrypted = cryptoUtils.decrypt(encrypted);
  console.log('3. 解密后的充值卡ID:', decrypted);
  
  // 验证
  console.log('4. 验证结果:', cardId === decrypted ? '✅ 成功' : '❌ 失败');
  
  console.log('\n=== 管理员Token验证测试 ===\n');
  
  // 模拟管理员登录生成token
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
  
  const adminPayload = {
    id: 1,
    username: 'admin',
    is_admin: true
  };
  
  const adminToken = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '1h' });
  console.log('1. 生成的管理员Token:', adminToken.substring(0, 50) + '...');
  
  try {
    const verified = cryptoUtils.verifyAdminToken(adminToken, JWT_SECRET);
    console.log('2. Token验证结果: ✅ 成功');
    console.log('   - 用户名:', verified.username);
    console.log('   - 是否为管理员:', verified.is_admin);
  } catch (error) {
    console.log('2. Token验证结果: ❌ 失败 -', error.message);
  }
  
  // 测试普通用户token（应该失败）
  const userPayload = {
    id: 2,
    username: 'user123',
    is_admin: false
  };
  
  const userToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
  console.log('\n3. 测试普通用户Token验证:');
  
  try {
    const verified = cryptoUtils.verifyAdminToken(userToken, JWT_SECRET);
    console.log('   验证结果: ❌ 应该失败但成功了');
  } catch (error) {
    console.log('   验证结果: ✅ 正确拒绝 -', error.message);
  }
  
  console.log('\n=== 测试完成 ===');
}

// 执行测试
testCardEncryption();
