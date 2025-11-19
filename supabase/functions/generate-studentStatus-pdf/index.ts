import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentStatusData {
  name: string;
  gender: string;
  birthDate: string;
  nationality: string;
  school: string;
  degreeLevel: string;
  major: string;
  duration: string;
  educationType: string;
  studyType: string;
  branch: string;
  enrollmentDate: string;
  status: string;
  graduationDate: string;
  admissionPhoto?: string;
  degreePhoto?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: StudentStatusData = await req.json();

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Draw background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(1, 1, 1),
    });

    // Draw header
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: rgb(0.2, 0.4, 0.8),
    });

    // Title
    const title = "教育部学籍在线验证报告";
    const titleSize = 24;
    page.drawText(title, {
      x: (width - font.widthOfTextAtSize(title, titleSize)) / 2,
      y: height - 60,
      size: titleSize,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // Date
    const today = new Date().toLocaleDateString('zh-CN');
    const dateText = `报告日期：${today}`;
    page.drawText(dateText, {
      x: width - 150,
      y: height - 120,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Process and embed admission photo if provided
    let admissionPhotoImage;
    if (data.admissionPhoto) {
      try {
        const base64Data = data.admissionPhoto.split(',')[1] || data.admissionPhoto;
        const photoBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        admissionPhotoImage = await pdfDoc.embedJpg(photoBytes);
      } catch (error) {
        console.error("Error embedding admission photo:", error);
      }
    }

    // Process and embed degree photo if provided
    let degreePhotoImage;
    if (data.degreePhoto) {
      try {
        const base64Data = data.degreePhoto.split(',')[1] || data.degreePhoto;
        const photoBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        degreePhotoImage = await pdfDoc.embedJpg(photoBytes);
      } catch (error) {
        console.error("Error embedding degree photo:", error);
      }
    }

    // Draw photos
    if (admissionPhotoImage) {
      page.drawImage(admissionPhotoImage, {
        x: width - 150,
        y: height - 280,
        width: 100,
        height: 130,
      });
      
      page.drawText("录取证件照", {
        x: width - 140,
        y: height - 290,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    if (degreePhotoImage) {
      page.drawImage(degreePhotoImage, {
        x: width - 150,
        y: height - 440,
        width: 100,
        height: 130,
      });
      
      page.drawText("毕业学历证件照", {
        x: width - 150,
        y: height - 450,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    // Content fields
    const fields = [
      { label: "姓名", value: data.name },
      { label: "性别", value: data.gender },
      { label: "出生日期", value: data.birthDate },
      { label: "民族", value: data.nationality },
      { label: "学校名称", value: data.school },
      { label: "层次", value: data.degreeLevel },
      { label: "专业", value: data.major },
      { label: "学制", value: data.duration },
      { label: "学历类别", value: data.educationType },
      { label: "学习形式", value: data.studyType },
      { label: "分院系所", value: data.branch },
      { label: "入学日期", value: data.enrollmentDate },
      { label: "学籍状态", value: data.status },
      { label: "离校日期", value: data.graduationDate },
    ];

    let yPosition = height - 160;
    const lineHeight = 30;
    const labelX = 50;
    const valueX = 180;

    fields.forEach((field) => {
      // Draw field label
      page.drawText(`${field.label}:`, {
        x: labelX,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      // Draw field value
      page.drawText(field.value || "", {
        x: valueX,
        y: yPosition,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      yPosition -= lineHeight;
    });

    // Footer note
    const footerText = "本报告由学信网学籍学历信息管理平台提供，仅用于验证学籍信息。";
    page.drawText(footerText, {
      x: 50,
      y: 50,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));

    return new Response(
      JSON.stringify({ pdf: base64Pdf }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
    );
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
    );
  }
});
