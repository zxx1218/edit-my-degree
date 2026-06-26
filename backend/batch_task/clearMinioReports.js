/**
 * MinIO reports目录清空脚本
 * 
 * 功能说明：
 * 1. 连接MinIO服务器
 * 2. 列出reports目录下的所有文件（包括子目录）
 * 3. 逐个删除所有文件
 * 4. 输出删除统计信息
 * 
 * 注意事项：
 * - 此操作不可逆，请谨慎执行
 * - 确保.env文件中MinIO配置正确
 * - 只删除reports目录下的文件，不会删除目录结构本身
 */

require('dotenv').config({ path: '../.env' });
const minio = require('minio');

// MinIO客户端配置
const minioClient = new minio.Client({
  endPoint: (process.env.MINIO_ENDPOINT || 'cheerout.cn:19000').split(':')[0],
  port: parseInt((process.env.MINIO_ENDPOINT || 'cheerout.cn:19000').split(':')[1]) || 19000,
  useSSL: process.env.MINIO_USE_SSL === 'true' || false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'editmydegree';
const REPORTS_DIR = 'reports/';

// 主函数：清空reports目录
async function clearReportsDirectory() {
  const startTime = Date.now();
  let deletedCount = 0;
  let errorCount = 0;

  try {
    console.log('🔌 正在连接MinIO服务器...');
    
    // 检查存储桶是否存在
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      console.error(`❌ 存储桶 "${BUCKET_NAME}" 不存在`);
      process.exit(1);
    }
    console.log(`✅ 成功连接到存储桶: ${BUCKET_NAME}`);

    // 列出reports目录下的所有对象
    console.log('\n📋 正在获取reports目录下的文件列表...');
    const objects = [];
    
    const stream = minioClient.listObjects(BUCKET_NAME, REPORTS_DIR, true);
    
    stream.on('data', (obj) => {
      objects.push(obj.name);
    });

    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    console.log(`📊 找到 ${objects.length} 个文件待删除\n`);

    if (objects.length === 0) {
      console.log('✅ reports目录已经是空的，无需清理');
      process.exit(0);
    }

    // 逐个删除文件
    console.log('🗑️  开始删除文件...\n');
    
    for (let i = 0; i < objects.length; i++) {
      const objectName = objects[i];
      const progress = ((i + 1) / objects.length * 100).toFixed(1);
      
      try {
        await minioClient.removeObject(BUCKET_NAME, objectName);
        deletedCount++;
        
        // 每删除10个文件或最后一个文件时显示进度
        if ((i + 1) % 10 === 0 || i === objects.length - 1) {
          console.log(`   [${progress}%] 已删除 ${i + 1}/${objects.length} 个文件`);
        }
      } catch (err) {
        errorCount++;
        console.error(`   ❌ 删除失败: ${objectName}`, err.message);
      }
    }

    // 输出统计信息
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ 清空完成！');
    console.log('='.repeat(50));
    console.log(`📊 统计信息:`);
    console.log(`   - 总文件数: ${objects.length}`);
    console.log(`   - 成功删除: ${deletedCount}`);
    console.log(`   - 删除失败: ${errorCount}`);
    console.log(`   - 耗时: ${duration} 秒`);
    console.log('='.repeat(50));

    if (errorCount > 0) {
      console.warn('\n⚠️  有部分文件删除失败，请检查错误信息');
      process.exit(1);
    }

  } catch (err) {
    console.error('\n❌ 执行过程中出错:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// 执行清空操作
console.log('⚠️  警告: 即将清空MinIO上reports目录下的所有文件！');
console.log('⚠️  此操作不可逆，请确认是否继续...\n');

clearReportsDirectory().catch(err => {
  console.error('❌ 脚本执行失败:', err);
  process.exit(1);
});




