import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DegreeVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DegreeVerificationDialog = ({
  open,
  onOpenChange,
}: DegreeVerificationDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    birthDate: undefined as Date | undefined,
    degreeDate: undefined as Date | undefined,
    university: "",
    degreeType: "",
    major: "",
    certificateNumber: "",
  });

  const formatDateToChinese = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}年${month}月${day}日`;
  };

  const handleSubmit = async () => {
    // Validate all fields
    if (!formData.name || !formData.gender || !formData.birthDate || 
        !formData.degreeDate || !formData.university || !formData.degreeType || 
        !formData.major || !formData.certificateNumber) {
      toast.error("请填写所有必填字段");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the PDF generation edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-degree-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            name: formData.name,
            gender: formData.gender,
            birthDate: formatDateToChinese(formData.birthDate),
            degreeDate: formatDateToChinese(formData.degreeDate),
            university: formData.university,
            degreeType: formData.degreeType,
            major: formData.major,
            certificateNumber: formData.certificateNumber,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("PDF生成失败");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `学位验证报告_${formData.name}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF生成成功！");
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: "",
        gender: "",
        birthDate: undefined,
        degreeDate: undefined,
        university: "",
        degreeType: "",
        major: "",
        certificateNumber: "",
      });
    } catch (error) {
      console.error("PDF生成错误:", error);
      toast.error("PDF生成失败，请重试");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>学位在线验证报告信息</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">姓名 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入姓名"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gender">性别 *</Label>
            <Input
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              placeholder="请输入性别（男/女）"
            />
          </div>

          <div className="grid gap-2">
            <Label>出生日期 *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.birthDate ? formatDateToChinese(formData.birthDate) : "选择日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.birthDate}
                  onSelect={(date) => setFormData({ ...formData, birthDate: date })}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label>获学位日期 *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.degreeDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.degreeDate ? formatDateToChinese(formData.degreeDate) : "选择日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.degreeDate}
                  onSelect={(date) => setFormData({ ...formData, degreeDate: date })}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="university">学位授予单位 *</Label>
            <Input
              id="university"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              placeholder="请输入学位授予单位"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="degreeType">所授学位 *</Label>
            <Input
              id="degreeType"
              value={formData.degreeType}
              onChange={(e) => setFormData({ ...formData, degreeType: e.target.value })}
              placeholder="例如：电子信息硕士专业学位"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="major">学科/专业 *</Label>
            <Input
              id="major"
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              placeholder="请输入学科或专业"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="certificateNumber">学位证书编号 *</Label>
            <Input
              id="certificateNumber"
              value={formData.certificateNumber}
              onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
              placeholder="请输入学位证书编号"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>生成报告</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DegreeVerificationDialog;
