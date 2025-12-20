const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs').promises;
const path = require('path');
const QRCode = require('qrcode');

const generateStudentStatusPdf = async (req, res) => {
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
      department,
      enrollmentDate,
      status,
      graduationDate,
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
      department,
      enrollmentDate,
      status,
      graduationDate,
      degreePhoto: degreePhoto ? '毕业照片数据已接收' : '无毕业照片数据'
    });

    // 验证必要字段
    if (!name || !gender || !birthDate || !nationality || !school || 
        !degreeLevel || !major || !duration || !educationType || 
        !studyType || !enrollmentDate || 
        !status || !graduationDate) {
      console.warn('缺少必要字段，无法生成PDF');
      return res.status(400).json({
        success: false,
        error: '缺少必要字段'
      });
    }

    // 模板路径
    const templatePath = path.join(__dirname, '../assets', 'xueji_tmp.pdf');
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
    if (!templateBytes) {
      throw new Error('无法读取PDF模板文件');
    }
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
      const defaultFontPath = path.join(__dirname, '../fonts', 'msyh.ttf');
      const sourceHanFontPath = path.join(__dirname, '../fonts', 'SourceHanSansK-Regular.TTF');
      
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
      { content: currentDate, x: 285, y: 746, fontSize: 10, color: rgb(0.588, 0.588, 0.588), font: sourceHanFont, specialFont: true },
      { content: name, x: 179, y: 709, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: gender, x: 179, y: 680, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: birthDate, x: 179, y: 651.5, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: nationality, x: 179, y: 624, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: school, x: 179, y: 596.5, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: degreeLevel, x: 179, y: 569, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: major, x: 179, y: 541.5, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: duration, x: 179, y: 513, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: educationType, x: 179, y: 485, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: studyType, x: 179, y: 457, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: branch, x: 179, y: 431, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: department, x: 179, y: 403.5, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: enrollmentDate, x: 179, y: 373, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: status, x: 179, y: 345, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: graduationDate, x: 179, y: 317, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont }
    ];

    // 添加文本到PDF
    console.log('开始向PDF添加文本内容...');
    for (const text of texts) {
      page.drawText(text.content, {
        x: text.x,
        y: text.y,
        size: text.fontSize,
        font: text.specialFont ? text.font : defaultFont,
        color: text.color,
      });
    }
    console.log('文本内容添加完成');

    // 添加毕业照片到PDF（如果提供了照片）
    if (degreePhoto) {
      try {
        console.log('开始处理毕业照片...');
        
        // 从Base64字符串中提取图片数据
        const base64Data = degreePhoto.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // 确定图片类型并嵌入到PDF中
        let photoImage;
        if (degreePhoto.startsWith('data:image/jpeg') || degreePhoto.startsWith('data:image/jpg')) {
          console.log('检测到JPG或者JPEG格式照片');
          photoImage = await pdfDoc.embedJpg(imageBuffer);
        } else if (degreePhoto.startsWith('data:image/png')) {
          console.log('检测到PNG格式照片');
          try {
            photoImage = await pdfDoc.embedPng(imageBuffer);
          } catch (pngError) {
            console.warn('PNG解析失败，尝试用JPG解析:', pngError);
            // 如果PNG解析失败，尝试用JPG解析
            try {
              photoImage = await pdfDoc.embedJpg(imageBuffer);
              console.log('使用JPG解析成功');
            } catch (jpgError) {
              console.warn('JPG解析也失败了，使用默认PNG解析:', jpgError);
              // 如果都失败了，默认再试一次PNG
              photoImage = await pdfDoc.embedPng(imageBuffer);
            }
          }
        } else {
          // 尝试自动检测图片类型
          console.log('无法确定照片格式，尝试自动检测');
          try {
            photoImage = await pdfDoc.embedPng(imageBuffer);
            console.log('自动检测为PNG格式');
          } catch (pngError) {
            console.warn('PNG解析失败，尝试JPG解析:', pngError.message);
            try {
              photoImage = await pdfDoc.embedJpg(imageBuffer);
              console.log('自动检测为JPG格式');
            } catch (jpgError) {
              console.error('无法解析图片数据:', jpgError.message);
              throw new Error('无法识别的图片格式');
            }
          }
        }
        
        // 证件照配置
        const photoConfig = { 
          x: 455.5, // 右侧X坐标（根据PDF宽度调整）
          y: 627.5, // Y坐标（与文字区域对齐）
          width: 79.5, // 证件照宽度
          height: 106, // 证件照高度（保持1:1.33的标准证件照比例）
          borderWidth: 0, // 边框宽度设为0，去掉黑色边框
          borderColor: rgb(0, 0, 0) // 边框颜色（黑色，此时已无效）
        };

        // 添加证件照（无边框）
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
        console.log(`✅ 已添加毕业证件照（位置：x=${x}, y=${y}，尺寸：${photoWidth}x${photoHeight}，无边框）`);
      } catch (photoError) {
        console.error('处理毕业照片时出错:', photoError.message || photoError);
        // 继续执行而不中断整个过程
      }
    } else {
      console.log('未提供毕业照片，跳过照片添加步骤');
    }

    // 生成并添加二维码
    try {
      console.log('开始生成二维码...');

      /*
          样例url - 学籍
          /verification-studentStatus?name=张三&gender=男&birthDate=1998年01月15日&nationality=汉族&school=北京大学&degreeLevel=本科&major=计算机科学与技术&duration=四年&educationType=普通高等教育&studyType=普通全日制&branch=信息科学技术学院&department=计算机系&enrollmentDate=2016年09月01日&status=注册学籍&graduationDate=2020年06月30日&verificationCode=ABCD1234567890&updateDate=2024年11月27日&photo=https://example.com/photo.jpg
      */
      
      // 构建查询参数对象
      const t = '服务器错误'
      const queryParams = {
        name: name || t,
        gender: gender || t,
        birthDate: birthDate || t,
        nationality: nationality || t,
        school: school || t,
        degreeLevel: degreeLevel || t,
        major: major || t,
        duration: duration || t,
        educationType: educationType || t,
        studyType: studyType || t,
        branch: branch || t,
        department: department || t,
        enrollmentDate: enrollmentDate || t,
        status: status || t,
        graduationDate: graduationDate || t,
        verificationCode: 'A4DV5W4DV20DV8S', // 在线验证码，目前先写死
        updateDate: currentDate,
        photo: 'https://example.com/photo.jpg' // 照片URL目前先写死，后续添加miniio
        // photo: degreePhoto || 'https://example.com/photo.jpg'
      };

      // 构建查询字符串并对所有值进行编码
      const queryString = Object.keys(queryParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
        .join('&');

      // 二维码配置
      // const qrCodeConfig = {
      //   content: `${process.env.VERIFICATION_BASE_URL}/verification-studentStatus?${queryString}`, // 二维码内容
      //   x: 76.5,                           // 二维码X坐标
      //   y: 126,                            // 二维码Y坐标
      //   size: 68.5,                        // 二维码大小(宽高)
      //   quality: 'L'                       // 容错级别: L(7%), M(15%), Q(25%), H(30%)
      // };
      const qrCodeConfig = {
        content: "403 Forbidden 服务器正在维护中，请稍后再试、403 Forbidden 服务器正在维护中", // 临时屏蔽二维码功能
        x: 76.5,                           // 二维码X坐标
        y: 126,                            // 二维码Y坐标
        size: 68.5,                        // 二维码大小(宽高)
        quality: 'H'                       // 容错级别: L(7%), M(15%), Q(25%), H(30%)
      };
      // 使用更高的分辨率生成二维码（10倍于目标尺寸）
      const highResolution = qrCodeConfig.size * 10;
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeConfig.content, {
        width: highResolution,  // 提高分辨率
        margin: 0,
        errorCorrectionLevel: qrCodeConfig.quality,
        quality: 1,  // 质量 0-1.0
        type: 'image/png'
      });

      // 将数据URL转换为Buffer
      const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      const qrCodeImage = await pdfDoc.embedPng(qrCodeBuffer);

      // 绘制二维码到PDF
      page.drawImage(qrCodeImage, {
        x: qrCodeConfig.x,
        y: qrCodeConfig.y,
        width: qrCodeConfig.size,
        height: qrCodeConfig.size
      });
      console.log(`✅ 已添加二维码（位置：x=${qrCodeConfig.x}, y=${qrCodeConfig.y}，尺寸：${qrCodeConfig.size}x${qrCodeConfig.size}）`);
    } catch (qrError) {
      console.error('生成或添加二维码时出错:', qrError.message);
    }

    // 保存PDF
    console.log('正在保存学籍在线验证报告PDF文档...');
    const pdfBytes = await pdfDoc.save();
    console.log('学籍在线验证报告PDF文档保存完成，大小:', pdfBytes.length, '字节');

    // 生成文件名
    const fileName = `教育部学籍在线验证报告_${name}_${Date.now()}.pdf`;
    
    // 保存PDF到后端目录
    try {
      const reportDir = path.join(__dirname, '../report_records');
      const filePath = path.join(reportDir, fileName);
      await fs.writeFile(filePath, pdfBytes);
      console.log('学籍在线验证报告PDF文件已在后端保存:', filePath);
    } catch (saveError) {
      console.error('保存学籍在线验证报告PDF到后端目录失败:', saveError.message);
      // 不中断流程，仍然发送给前端
    }

    // 设置响应头以触发浏览器下载
    res.setHeader('Content-Type', 'application/pdf');
    // 对文件名进行编码以避免特殊字符导致的错误
    const encodedFileName = encodeURIComponent(fileName);
    // 修复文件名显示问题，同时兼容不同浏览器
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
    // 添加额外的头部确保浏览器将响应视为附件而非内联内容
    res.setHeader('X-Content-Type-Options', 'nosniff');
    console.log('设置响应头完成，文件名:', fileName);

    // 发送PDF数据
    res.send(Buffer.from(pdfBytes));
    console.log('学籍在线验证报告PDF文件发送成功');
  } catch (error) {
    console.error("学籍在线验证报告PDF生成错误:", error);
    res.status(500).json({
      success: false,
      error: '学籍在线验证报告PDF生成失败: ' + error.message
    });
  }
};

module.exports = generateStudentStatusPdf;