/**
 * MinIO 连接测试脚本
 * 
 * 使用方法：
 * node test-minio.js
 * 
 * 此脚本用于测试 MinIO 配置是否正确
 */

require('dotenv').config({ path: '../../.env' });
const minio = require('minio');

// 初始化 MinIO 客户端
const endPoint = process.env.MINIO_ENDPOINT || 'cheerot.cn:19000';
const [host, port] = endPoint.split(':');

const minioClient = new minio.Client({
  endPoint: host, // 主机名
  port: parseInt(port) || 19000, // 端口号
  useSSL: process.env.MINIO_USE_SSL === 'true' || false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'editmydegree';

async function testMinioConnection() {
  console.log('========== MinIO 连接测试 ==========\n');
  
  console.log('📋 配置信息:');
  console.log('  Endpoint:', process.env.MINIO_ENDPOINT);
  console.log('  Bucket:', BUCKET_NAME);
  console.log('  Port:', 19000);
  console.log('  SSL:', process.env.MINIO_USE_SSL === 'true' ? '是' : '否');
  console.log('  Access Key:', process.env.MINIO_ACCESS_KEY ? '已配置' : '❌ 未配置');
  console.log('  Secret Key:', process.env.MINIO_SECRET_KEY ? '已配置' : '❌ 未配置');
  console.log();

  try {
    // 测试 1: 检查凭证是否有效
   console.log('🧪 测试 1: 验证访问凭证...');
   await minioClient.listBuckets();
   console.log('✅ 访问凭证有效\n');

    // 测试 2: 检查 bucket 是否存在
   console.log('🧪 测试 2: 检查存储桶是否存在...');
   const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (bucketExists) {
     console.log(`✅ 存储桶 "${BUCKET_NAME}" 已存在\n`);
    } else {
     console.log(`⚠️  存储桶 "${BUCKET_NAME}" 不存在`);
     console.log('🔄 正在创建存储桶...');
     await minioClient.makeBucket(BUCKET_NAME);
     console.log(`✅ 存储桶 "${BUCKET_NAME}" 创建成功\n`);
    }

    // 测试 3: 测试上传功能
   console.log('🧪 测试 3: 测试文件上传...');
   const testFileName = `test/${Date.now()}_test.txt`;
   const testContent = 'MinIO connection test - ' + new Date().toISOString();
    
   await minioClient.putObject(BUCKET_NAME, testFileName, testContent, {
      'Content-Type': 'text/plain'
    });
   console.log(`✅ 测试文件上传成功：${testFileName}`);

    // 测试 4: 测试下载功能
   console.log('\n🧪 测试 4: 测试文件下载...');
   const dataStream = await minioClient.getObject(BUCKET_NAME, testFileName);
    let downloadedContent = '';
    
    dataStream.on('data', (chunk) => {
      downloadedContent += chunk.toString();
    });
    
   await new Promise((resolve, reject) => {
      dataStream.on('end', resolve);
      dataStream.on('error', reject);
    });
    
    if (downloadedContent === testContent) {
     console.log('✅ 文件下载成功，内容验证通过\n');
    } else {
     console.log('❌ 文件下载成功，但内容不匹配\n');
    }

    // 测试 5: 删除测试文件
   console.log('🧪 测试 5: 清理测试文件...');
   await minioClient.removeObject(BUCKET_NAME, testFileName);
   console.log('✅ 测试文件已删除\n');

   console.log('===========================================');
   console.log('🎉 所有测试通过！MinIO 配置正确！');
   console.log('===========================================\n');
    
   console.log('💡 提示:');
   console.log(`  - 照片将存储在：${BUCKET_NAME}/photos/`);
   console.log(`  - 照片访问 URL 格式：http://${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/photos/{文件名}`);
   console.log();

  } catch (error) {
  console.error('\n===========================================');
  console.error('❌ MinIO 连接测试失败！');
  console.error('===========================================\n');
  console.error('错误信息:', error.message);
  console.error();
    
    if (error.code === 'ECONNREFUSED') {
    console.error('可能原因:');
    console.error('  1. MinIO 服务器未启动');
    console.error('  2. 防火墙阻止了连接');
    console.error('  3. Endpoint 配置错误');
    console.error();
    console.error('建议操作:');
    console.error('  - 检查 MinIO 服务器是否运行');
    console.error('  - 验证 .env 中的 MINIO_ENDPOINT 配置');
    console.error('  - 检查端口 19000 是否可访问');
    } else if (error.code === 'AccessDenied') {
    console.error('可能原因:');
    console.error('  1. Access Key 或 Secret Key 错误');
    console.error('  2. 凭证已过期或被撤销');
    console.error();
    console.error('建议操作:');
    console.error('  - 检查 .env 中的 MINIO_ACCESS_KEY 和 MINIO_SECRET_KEY');
    console.error('  - 联系 MinIO 管理员确认凭证有效性');
    } else if (error.code === 'NoSuchBucket') {
    console.error('可能原因:');
    console.error('  - 存储桶不存在且没有自动创建权限');
    console.error();
    console.error('建议操作:');
    console.error('  - 手动在 MinIO 控制台创建存储桶：' + BUCKET_NAME);
    console.error('  - 或者确保当前凭证有创建存储桶的权限');
    } else if (error.code === 'ENOTFOUND') {
    console.error('可能原因:');
    console.error('  1. DNS 解析失败，域名不存在');
    console.error('  2. 网络连接问题');
    console.error('  3. MINIO_ENDPOINT 配置错误');
    console.error();
    console.error('建议操作:');
    console.error('  - 检查 .env 中的 MINIO_ENDPOINT 配置是否正确');
    console.error('  - 尝试 ping 域名：ping cheerot.cn');
    console.error('  - 如果是内网部署，请使用内网 IP 地址');
    console.error('  - 确认网络连接正常');
    }
    
   console.error('\n💡 提示:');
   console.error('  1. 确保 .env文件中的 MINIO_ACCESS_KEY 和 MINIO_SECRET_KEY 已正确配置');
   console.error('  2. 如果 MinIO 还未部署，请参考 backend/minio-setup.md 文档进行部署');
   console.error('  3. 如果 MinIO 服务器地址变更，请修改 MINIO_ENDPOINT 配置');
   console.error();
    
    process.exit(1);
  }
}

// 运行测试
testMinioConnection();
