/**
 * SMTP配置验证脚本
 * 
 * 功能说明：
 * 1. 检查.env文件中的SMTP配置是否完整
 * 2. 验证SMTP服务器连接是否正常
 * 3. 测试邮件发送功能
 * 
 * 使用方法：
 * cd /home/ctkj/edit-my-degree/backend
 * node test/test-smtp-validation.js
 */

require('dotenv').config({ path: '../.env' });
const nodemailer = require('nodemailer');

console.log('='.repeat(80));
console.log('📧 SMTP配置验证工具');
console.log('='.repeat(80));

// 检查环境变量
console.log('\n📋 检查SMTP配置...\n');

const config = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.EMAIL_FROM,
  to: process.env.ERROR_NOTIFICATION_EMAIL,
  enabled: process.env.ENABLE_ERROR_EMAIL_NOTIFICATION
};

let hasError = false;

// 检查必填项
if (!config.host) {
  console.error('❌ SMTP_HOST 未配置');
  hasError = true;
} else {
  console.log(`✅ SMTP_HOST: ${config.host}`);
}

if (!config.port) {
  console.error('❌ SMTP_PORT 未配置');
  hasError = true;
} else {
  console.log(`✅ SMTP_PORT: ${config.port}`);
}

if (!config.user) {
  console.error('❌ SMTP_USER 未配置');
  hasError = true;
} else {
  console.log(`✅ SMTP_USER: ${config.user}`);
  
  // QQ邮箱特殊检查
  if (config.host === 'smtp.qq.com') {
    if (config.pass && config.pass.length === 16) {
      console.log(`✅ SMTP_PASS: 已配置（16位授权码格式正确）`);
    } else if (config.pass) {
      console.warn(`⚠️  SMTP_PASS: 已配置但长度不是16位，QQ邮箱应使用16位授权码`);
      console.warn(`   当前长度: ${config.pass.length}位`);
    } else {
      console.error('❌ SMTP_PASS 未配置（QQ邮箱需要16位授权码）');
      hasError = true;
    }
  } else {
    if (!config.pass) {
      console.error('❌ SMTP_PASS 未配置');
      hasError = true;
    } else {
      console.log(`✅ SMTP_PASS: 已配置`);
    }
  }
}

if (!config.from) {
  console.warn('⚠️  EMAIL_FROM 未配置，将使用SMTP_USER');
} else {
  console.log(`✅ EMAIL_FROM: ${config.from}`);
}

if (!config.to) {
  console.warn('⚠️  ERROR_NOTIFICATION_EMAIL 未配置，将使用默认值');
} else {
  console.log(`✅ ERROR_NOTIFICATION_EMAIL: ${config.to}`);
}

if (config.enabled !== 'true') {
  console.warn('⚠️  ENABLE_ERROR_EMAIL_NOTIFICATION 未设置为 "true"');
  console.warn(`   当前值: ${config.enabled || '未设置'}`);
} else {
  console.log(`✅ ENABLE_ERROR_EMAIL_NOTIFICATION: true`);
}

console.log('\n' + '='.repeat(80));

if (hasError) {
  console.error('\n❌ 配置不完整，请先修复上述问题');
  console.log('\n💡 提示：');
  console.log('   1. 编辑项目根目录的 .env 文件');
  console.log('   2. 确保所有SMTP配置项都已正确填写');
  console.log('   3. QQ邮箱需要使用16位授权码，而非登录密码');
  console.log('   4. 参考文档: backend/test/README-qq-smtp.md');
  process.exit(1);
}

console.log('\n✅ 配置检查通过，开始测试SMTP连接...\n');

// 创建传输器
const transporter = nodemailer.createTransport({
  host: config.host,
  port: parseInt(config.port),
  secure: parseInt(config.port) === 465,
  auth: {
    user: config.user,
    pass: config.pass
  }
});

// 验证连接
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ SMTP连接验证失败!');
    console.error(`错误信息: ${error.message}`);
    console.log('\n💡 可能的原因：');
    
    if (error.message.includes('535')) {
      console.log('   1. 使用了登录密码而非授权码（QQ邮箱）');
      console.log('   2. SMTP服务未开启');
      console.log('   3. 授权码不正确或已过期');
      console.log('   4. 账号存在安全风险被限制');
      console.log('\n🔧 解决方案：');
      console.log('   1. 登录QQ邮箱网页版 (mail.qq.com)');
      console.log('   2. 设置 → 账户 → 开启IMAP/SMTP服务');
      console.log('   3. 生成新的16位授权码');
      console.log('   4. 更新.env文件中的SMTP_PASS配置');
      console.log('   5. 重启后端服务: pm2 restart edit_my_degree_backend');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.log('   1. SMTP服务器地址或端口错误');
      console.log('   2. 防火墙阻止了连接');
      console.log('   3. 网络不可达');
    } else if (error.message.includes('timeout')) {
      console.log('   1. 网络连接超时');
      console.log('   2. SMTP服务器响应缓慢');
      console.log('   3. 防火墙拦截');
    }
    
    console.log('\n📖 详细文档请参考:');
    console.log('   - backend/batch_task/README.md');
    console.log('   - https://help.mail.qq.com/detail/108/1023');
    
    process.exit(1);
  } else {
    console.log('✅ SMTP连接成功！');
    console.log('\n📤 发送测试邮件...');
    
    const testEmail = config.to || 'zxx12182022@163.com';
    
    transporter.sendMail({
      from: config.from || config.user,
      to: testEmail,
      subject: '【测试邮件】SMTP配置验证',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; color: white; text-align: center;">
            <h1 style="margin: 0;">✅ SMTP配置验证成功</h1>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 10px;">
            <p style="color: #333; line-height: 1.6;">这是一封测试邮件，用于验证SMTP配置是否正确。</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #667eea; margin-top: 0;">📋 配置信息</h3>
              <p><strong>SMTP服务器:</strong> ${config.host}</p>
              <p><strong>端口:</strong> ${config.port}</p>
              <p><strong>发件人:</strong> ${config.from || config.user}</p>
              <p><strong>收件人:</strong> ${testEmail}</p>
              <p><strong>测试时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
            </div>
            
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; border-radius: 5px;">
              <p style="margin: 0; color: #155724;">✅ 如果您收到这封邮件，说明SMTP配置完全正确！</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>此邮件由系统自动发送，用于测试SMTP配置</p>
          </div>
        </div>
      `
    }, (error, info) => {
      if (error) {
        console.error('\n❌ 测试邮件发送失败!');
        console.error(`错误信息: ${error.message}`);
        console.log('\n💡 虽然SMTP连接成功，但邮件发送失败，可能原因：');
        console.log('   1. 发件人邮箱未开启SMTP服务');
        console.log('   2. 收件人地址无效');
        console.log('   3. 邮件被识别为垃圾邮件');
        console.log('   4. 邮箱配额已满');
        process.exit(1);
      } else {
        console.log('\n✅ 测试邮件发送成功！');
        console.log(`📬 MessageID: ${info.messageId}`);
        console.log(`📧 请检查收件箱: ${testEmail}`);
        console.log('\n' + '='.repeat(80));
        console.log('🎉 SMTP配置验证完成，一切正常！');
        console.log('='.repeat(80));
        console.log('\n💡 下一步：');
        console.log('   1. 确认收到了测试邮件');
        console.log('   2. 检查垃圾箱（如果没有在收件箱）');
        console.log('   3. 如果一切正常，可以重启服务使配置生效');
        console.log('   4. 重启命令: pm2 restart edit_my_degree_backend');
      }
    });
  }
});
