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

    // 调试信息
    console.log('准备发送的数据:', {
      name: formData.name,
      gender: formData.gender,
      birthDate: formatDateToChinese(formData.birthDate),
      degreeDate: formatDateToChinese(formData.degreeDate),
      university: formData.university,
      degreeType: formData.degreeType,
      major: formData.major,
      certificateNumber: formData.certificateNumber,
      photo: formData.photo ? `照片数据长度: ${formData.photo.length} 字符` : '无照片数据'
    });

    setIsGenerating(true);
    try {
      // 使用本地后端API生成PDF
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/generate-degree-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
            photo: formData.photo, // 添加照片数据
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>学位在线验证报告信息</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 加载状态 */}
          {isLoading && (
            <div className="grid gap-6 py-8">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
                </div>
                <p className="text-sm text-muted-foreground">正在加载学位记录...</p>
              </div>
              <div className="grid gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32 mx-auto" />
              </div>
            </div>
          )}

          {/* 如果有学位记录但未选择，先显示选择器 */}
          {!isLoading && degreeRecords.length > 0 && !showForm && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="record-select">选择已有学位记录</Label>
                <Select value={selectedRecordId} onValueChange={handleRecordSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择一条学位记录" />
                  </SelectTrigger>
                  <SelectContent>
                    {degreeRecords.map((record) => (
                      <SelectItem key={record.id} value={record.id}>
                        {record.school} - {record.name} - {record.degree_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={handleManualInput}>
                  或手动填写
                </Button>
              </div>
            </>
          )}

          {/* 选择记录后或手动填写时显示表单 */}
          {!isLoading && showForm && (
            <>
              {degreeRecords.length > 0 && (
                <div className="flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowForm(false)}
                  >
                    ← 重新选择
                  </Button>
                </div>
              )}
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
            <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
              <SelectTrigger>
                <SelectValue placeholder="请选择性别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="男">男</SelectItem>
                <SelectItem value="女">女</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>出生日期 *</Label>
            <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
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
              <PopoverContent className="w-auto p-0 shadow-lg border-2" align="start">
                <Calendar
                  mode="single"
                  selected={formData.birthDate}
                  onSelect={(date) => {
                    setFormData({ ...formData, birthDate: date });
                    setBirthDateOpen(false);
                  }}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1950}
                  toYear={new Date().getFullYear()}
                  className="pointer-events-auto rounded-lg"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label>获学位日期 *</Label>
            <Popover open={degreeDateOpen} onOpenChange={setDegreeDateOpen}>
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
              <PopoverContent className="w-auto p-0 shadow-lg border-2" align="start">
                <Calendar
                  mode="single"
                  selected={formData.degreeDate}
                  onSelect={(date) => {
                    setFormData({ ...formData, degreeDate: date });
                    setDegreeDateOpen(false);
                  }}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1950}
                  toYear={new Date().getFullYear()}
                  className="pointer-events-auto rounded-lg"
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
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, degreeType: e.target.value })}
              placeholder="例如：工学学士学位"
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

          <div className="grid gap-2">
            <Label htmlFor="photo">学位照片</Label>
            <div className="flex flex-col gap-3">
              {formData.photo && (
                <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                  <img src={formData.photo} alt="学位照片" className="w-full h-full object-cover" />
                </div>
              )}
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="cursor-pointer"
              />
            </div>
          </div>
          </>
          )}
        </div>

        {isGenerating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-primary/20"></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">正在生成报告</p>
                <p className="text-sm text-muted-foreground mt-1">请稍候，这可能需要几秒钟...</p>
              </div>
            </div>
          </div>
        )}

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
  );
};

export default DegreeVerificationDialog;