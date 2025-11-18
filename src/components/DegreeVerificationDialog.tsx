import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getUserData } from "@/lib/api";

interface DegreeVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DegreeVerificationDialog = ({
  open,
  onOpenChange,
}: DegreeVerificationDialogProps) => {
  const [degreeRecords, setDegreeRecords] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    birthDate: undefined as Date | undefined,
    degreeDate: undefined as Date | undefined,
    university: "",
    degreeType: "",
    major: "",
    certificateNumber: "",
    photo: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [degreeDateOpen, setDegreeDateOpen] = useState(false);

  // 获取用户的学位记录
  useEffect(() => {
    const fetchDegreeRecords = async () => {
      if (open) {
        setIsLoading(true);
        try {
          const currentUser = localStorage.getItem("currentUser");
          if (currentUser) {
            const user = JSON.parse(currentUser);
            // 添加最小延迟确保加载动画可见
            const [userData] = await Promise.all([
              getUserData(user.id),
              new Promise(resolve => setTimeout(resolve, 500))
            ]);
            if (userData.degree && userData.degree.length > 0) {
              setDegreeRecords(userData.degree);
              setShowForm(false);
            } else {
              // 没有学位记录，直接显示表单
              setShowForm(true);
            }
          }
        } catch (error) {
          console.error("获取学位记录失败:", error);
          setShowForm(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        // 对话框关闭时重置状态
        setShowForm(false);
        setSelectedRecordId("");
        setIsLoading(false);
      }
    };
    fetchDegreeRecords();
  }, [open]);

  // 当用户选择一条记录时，自动填充表单
  const handleRecordSelect = (recordId: string) => {
    setSelectedRecordId(recordId);
    const record = degreeRecords.find((r) => r.id === recordId);
    if (record) {
      // 解析日期字符串，支持多种格式
      const parseBirthDate = (dateStr: string | null) => {
        if (!dateStr) return undefined;
        // 如果是 "YYYY年MM月DD日" 格式
        const chineseMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (chineseMatch) {
          return new Date(parseInt(chineseMatch[1]), parseInt(chineseMatch[2]) - 1, parseInt(chineseMatch[3]));
        }
        // 否则尝试直接解析
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? undefined : date;
      };

      setFormData({
        name: record.name || "",
        gender: record.gender || "",
        birthDate: parseBirthDate(record.birth_date),
        degreeDate: parseBirthDate(record.degree_date),
        university: record.school || "",
        degreeType: record.degree_type || "",
        major: record.major || "",
        certificateNumber: record.certificate_number || "",
        photo: record.photo || "",
      });
      setShowForm(true);
    }
  };

  // 手动填写
  const handleManualInput = () => {
    setSelectedRecordId("");
    setFormData({
      name: "",
      gender: "",
      birthDate: undefined,
      degreeDate: undefined,
      university: "",
      degreeType: "",
      major: "",
      certificateNumber: "",
      photo: "",
    });
    setShowForm(true);
  };

  const formatDateToChinese = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}年${month}月${day}日`;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    // Validate all fields
    if (!formData.name || !formData.gender || !formData.birthDate || 
        !formData.degreeDate || !formData.university || !formData.degreeType || 
        !formData.major || !formData.certificateNumber) {
      toast.error("请填写所有必填字段");
      return;
    }

    // 立即关闭对话框并显示加载动画
    onOpenChange(false);
    setIsGenerating(true);
    
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
      
      // 检测是否为移动设备
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // 移动端：在新标签页打开PDF
        const url = window.URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          // 如果被浏览器阻止弹窗，尝试直接在当前标签打开
          window.location.href = url;
        }
        // 延迟释放URL，确保文件能被加载
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        // 桌面端：使用下载链接
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `学位验证报告_${formData.name}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast.success("PDF生成成功！");
      
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
        photo: "",
      });
    } catch (error) {
      console.error("PDF生成错误:", error);
      toast.error("PDF生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
...
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isGenerating}>
            {isGenerating ? "生成中..." : "生成报告"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* 全屏加载动画 */}
    {isGenerating && (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-lg flex items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-6 p-8 bg-card rounded-2xl shadow-2xl border-2 border-primary/20 max-w-sm mx-4">
          <div className="relative">
            <div className="h-20 w-20 animate-spin rounded-full border-[5px] border-primary/30 border-t-primary shadow-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 animate-pulse rounded-full bg-primary/30"></div>
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold text-foreground">正在生成报告</p>
            <p className="text-sm text-muted-foreground">请稍候，这可能需要几秒钟...</p>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default DegreeVerificationDialog;
