import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DegreeData {
  name: string;
  gender: string;
  birthDate: string;
  degreeDate: string;
  university: string;
  degreeType: string;
  major: string;
  certificateNumber: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: DegreeData = await req.json();
    
    // Get current date in Chinese format
    const now = new Date();
    const currentDate = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, "0")}月${String(now.getDate()).padStart(2, "0")}日`;

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

    // Get page dimensions
    const { width, height } = page.getSize();

    // Draw background (light gray)
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(0.95, 0.95, 0.95),
    });

    // Draw header background
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: rgb(0.2, 0.4, 0.8),
    });

    // Title
    page.drawText("中国高等教育学位在线验证报告", {
      x: 50,
      y: height - 50,
      size: 24,
      color: rgb(1, 1, 1),
    });

    // Date in header (gray color)
    page.drawText(currentDate, {
      x: 285,
      y: height - 103,
      size: 10,
      color: rgb(0.588, 0.588, 0.588),
    });

    // Content area
    const startY = height - 140;
    const lineHeight = 28;
    let currentY = startY;

    const fields = [
      { label: "姓名:", value: data.name },
      { label: "性别:", value: data.gender },
      { label: "出生日期:", value: data.birthDate },
      { label: "获学位日期:", value: data.degreeDate },
      { label: "学位授予单位:", value: data.university },
      { label: "所授学位:", value: data.degreeType },
      { label: "学科/专业:", value: data.major },
      { label: "学位证书编号:", value: data.certificateNumber },
    ];

    for (const field of fields) {
      // Draw label
      page.drawText(field.label, {
        x: 50,
        y: currentY,
        size: 11,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Draw value
      page.drawText(field.value, {
        x: 180,
        y: currentY,
        size: 11,
        color: rgb(0, 0, 0),
      });

      currentY -= lineHeight;
    }

    // Draw footer
    page.drawText("本报告由系统自动生成", {
      x: 50,
      y: 50,
      size: 9,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    const uint8Array = new Uint8Array(pdfBytes);
    const blob = new Blob([uint8Array], { type: "application/pdf" });

    return new Response(blob, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="degree_verification_${data.name}_${Date.now()}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error("PDF generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});