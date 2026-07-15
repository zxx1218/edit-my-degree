/**
 * 测试SMTP连接配置
 * 
 * 本脚本用于验证SMTP服务器配置是否正确
 * 
 * 使用方法:
 * cd /home/ctkj/edit-my-degree/backend
 * node test/test-smtp-connection.js
 */

require('dotenv').config({ path: '../.env' }); // 加载根目录的.env文件
const nodemailer = require('nodemailer');

// 兼容性处理
if (!console.safe) {
  console.safe = console.log;
}

console.log('=== SMTP连接测试 ===\n');
console.log('当前配置:');
console.log(`  SMTP_HOST: ${process.env.SMTP_HOST}`);
console.log(`  SMTP_PORT: ${process.env.SMTP_PORT}`);
console.log(`  SMTP_USER: ${process.env.SMTP_USER}`);
console.log(`  SMTP_PASS: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : '未配置'}`);
console.log(`  ENABLE_ERROR_EMAIL_NOTIFICATION: ${process.env.ENABLE_ERROR_EMAIL_NOTIFICATION}`);
console.log('');

/**
 * 测试SMTP连接
 */
async function testSmtpConnection() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ 错误: SMTP_USER或SMTP_PASS未配置');
    return false;
  }

  try {
    console.log('正在创建SMTP传输器...');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // SSL连接
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('正在验证SMTP连接...');
    
    // 验证连接
    await transporter.verify();
    
    console.log('✅ SMTP连接成功！');
    console.log('');
    console.log('📧 现在尝试发送测试邮件...');
    
    // 发送测试邮件
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.ERROR_NOTIFICATION_EMAIL || process.env.SMTP_USER,
      subject: '[测试] SMTP连接验证',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #28a745;">✅ SMTP连接测试成功</h2>
          <p>这是一封测试邮件，用于验证SMTP配置是否正确。</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <h3 style="margin-top: 0;">配置信息:</h3>
            <ul>
              <li><strong>SMTP服务器:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>端口:</strong> ${process.env.SMTP_PORT}</li>
              <li><strong>发件人:</strong> ${process.env.SMTP_USER}</li>
              <li><strong>时间:</strong> ${new Date().toLocaleString('zh-CN')}</li>
            </ul>
          </div>
          <p style="margin-top: 20px; color: #6c757d; font-size: 12px;">
            如果收到此邮件，说明SMTP配置正确。
          </p>
        </div>
      `
    });
    
    console.log('✅ 测试邮件发送成功！');
    console.log(`   邮件ID: ${info.messageId}`);
    console.log('');
    console.log('请检查邮箱是否收到测试邮件。');
    console.log('如果收到邮件，说明SMTP配置完全正确，可以正常使用邮件通知功能。');
    
    return true;
    
  } catch (error) {
    console.error('❌ SMTP连接失败！');
    console.error('');
    console.error('错误详情:');
    console.error(`  错误代码: ${error.code}`);
    console.error(`  错误信息: ${error.message}`);
    console.error('');
    
    // 提供针对性的解决方案
    if (error.code === 'EAUTH') {
      console.error('🔑 认证失败，可能的原因:');
      console.error('  1. 使用的是登录密码而非授权码');
      console.error('  2. 授权码不正确或已过期');
      console.error('  3. SMTP服务未开启');
      console.error('');
      console.error('💡 解决方案:');
      console.error('  1. 登录QQ邮箱网页版 (mail.qq.com)');
      console.error('  2. 设置 → 账户 → POP3/IMAP/SMTP服务');
      console.error('  3. 确保"IMAP/SMTP服务"已开启');
      console.error('  4. 点击"生成授权码"获取新的16位授权码');
      console.error('  5. 将新授权码更新到.env文件的SMTP_PASS字段');
      console.error('  6. 重启后端服务');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 网络连接失败，可能的原因:');
      console.error('  1. SMTP服务器地址错误');
      console.error('  2. 端口被防火墙阻止');
      console.error('  3. 网络连接问题');
      console.error('');
      console.error('💡 解决方案:');
      console.error('  - QQ邮箱: smtp.qq.com, 端口465(SSL)或587(TLS)');
      console.error('  - 163邮箱: smtp.163.com, 端口465(SSL)或25/587(TLS)');
      console.error('  - 检查防火墙设置，确保允许出站连接');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏱️ 连接超时，可能的原因:');
      console.error('  1. 网络延迟或中断');
      console.error('  2. 防火墙阻止连接');
      console.error('  3. SMTP服务器无响应');
      console.error('');
      console.error('💡 解决方案:');
      console.error('  - 检查网络连接是否正常');
      console.error('  - 尝试更换端口（465改为587）');
      console.error('  - 联系网络管理员确认防火墙规则');
    } else {
      console.error('❓ 未知错误，请检查:');
      console.error('  1. .env文件中的SMTP配置是否正确');
      console.error('  2. 邮箱账号是否正常');
      console.error('  3. 查看邮箱服务商的帮助文档');
    }
    
    console.error('');
    console.error('📖 更多帮助信息:');
    console.error('  - QQ邮箱: https://service.mail.qq.com/');
    console.error('  - 163邮箱: https://help.mail.163.com/');
    
    return false;
  }
}

// 执行测试
testSmtpConnection().then(success => {
  if (success) {
    console.log('\n✅ 测试完成 - SMTP配置正确');
    process.exit(0);
  } else {
    console.log('\n❌ 测试完成 - SMTP配置有误，请根据上述提示修正');
    process.exit(1);
  }
}).catch(err => {
  console.error('\n❌ 测试执行出错:', err);
  process.exit(1);
});
