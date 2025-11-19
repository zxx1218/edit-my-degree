import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      name,
      gender,
      birthDate,
      enrollmentDate,
      graduationDate,
      school,
      major,
      duration,
      degreeLevel,
      educationType,
      studyType,
      graduationStatus,
      certificateNumber,
      principalName,
      photo,
    } = await req.json();

    console.log('生成教育部学历证书电子注册备案表，用户:', name);

    // 创建新的PDF文档
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4大小

    // 嵌入字体
    const font = await pdfDoc.embedFont('Helvetica');
    const boldFont = await pdfDoc.embedFont('Helvetica-Bold');

    // 处理照片
    let photoImage;
    if (photo) {
      try {
        const base64Data = photo.split(',')[1] || photo;
        const photoBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        photoImage = await pdfDoc.embedJpg(photoBytes);
      } catch (error) {
        console.error('照片处理失败:', error);
      }
    }

    const { width, height } = page.getSize();

    // 标题
    page.drawText('教育部学历证书电子注册备案表', {
      x: width / 2 - 150,
      y: height - 50,
      size: 20,
      font: boldFont,
    });

    // 绘制照片
    if (photoImage) {
      const photoWidth = 80;
      const photoHeight = 100;
      page.drawImage(photoImage, {
        x: width - photoWidth - 50,
        y: height - 150,
        width: photoWidth,
        height: photoHeight,
      });
    }

    // 定义字段位置
    const leftMargin = 50;
    const labelWidth = 120;
    const valueX = leftMargin + labelWidth + 10;
    let currentY = height - 100;
    const lineHeight = 25;

    // 绘制表单字段
    const fields = [
      { label: '姓名:', value: name },
      { label: '性别:', value: gender },
      { label: '出生日期:', value: birthDate },
      { label: '入学日期:', value: enrollmentDate },
      { label: '毕（结）业日期:', value: graduationDate },
      { label: '学校名称:', value: school },
      { label: '专业:', value: major },
      { label: '学制:', value: duration },
      { label: '层次:', value: degreeLevel },
      { label: '学历类别:', value: educationType },
      { label: '学习形式:', value: studyType },
      { label: '毕（结）业:', value: graduationStatus },
      { label: '证书编号:', value: certificateNumber },
      { label: '校（院）长姓名:', value: principalName },
    ];

    fields.forEach((field) => {
      // 绘制标签
      page.drawText(field.label, {
        x: leftMargin,
        y: currentY,
        size: 12,
        font: boldFont,
      });

      // 绘制值
      page.drawText(field.value || '', {
        x: valueX,
        y: currentY,
        size: 12,
        font: font,
      });

      currentY -= lineHeight;
    });

    // 添加底部说明
    currentY -= 40;
    page.drawText('本表由教育部学信网提供在线验证', {
      x: leftMargin,
      y: currentY,
      size: 10,
      font: font,
    });

    // 生成PDF
    const pdfBytes = await pdfDoc.save();
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));

    console.log('PDF生成成功');

    return new Response(
      JSON.stringify({ pdfBase64: base64Pdf }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        }, 
        status: 200 
      }
    );

  } catch (error) {
    console.error('生成PDF失败:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        }, 
        status: 500 
      }
    );
  }
});
