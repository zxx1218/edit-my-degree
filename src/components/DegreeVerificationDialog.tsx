/**
 * 压缩图片
 * @param file - 图片文件
 * @param maxSizeMB - 最大大小(MB)，默认2MB
 * @returns 压缩后的base64数据
 */
export async function compressImage(file: File, maxSizeMB = 2): Promise<string> {
  // 如果文件小于指定大小，直接返回
  if (file.size / 1024 / 1024 < maxSizeMB) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法获取canvas上下文'));
          return;
        }

        // 设置画布尺寸
        canvas.width = img.width;
        canvas.height = img.height;

        // 绘制图片
        ctx.drawImage(img, 0, 0);

        // 从0.9开始尝试压缩质量
        let quality = 0.9;
        const dataUrlToBlob = (dataUrl: string): Blob | null => {
          try {
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)![1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
          } catch {
            return null;
          }
        };

        const tryCompress = () => {
          // 尝试导出图片
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const blob = dataUrlToBlob(dataUrl);
          
          if (!blob) {
            reject(new Error('图片处理失败'));
            return;
          }

          // 检查大小
          if (blob.size / 1024 / 1024 < maxSizeMB || quality <= 0.3) {
            // 达到目标大小或质量已很低
            resolve(dataUrl);
          } else {
            // 继续降低质量
            quality -= 0.1;
            setTimeout(tryCompress, 50);
          }
        };

        tryCompress();
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import LoadingDialog from "./LoadingDialog";

interface DegreeVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const DegreeVerificationDialog = ({
  open,
  onOpenChange,
  onLoadingChange,
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
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [degreeDateOpen, setDegreeDateOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 获取用户的学位记录
  useEffect(() => {
    const fetchDegreeRecords = async () => {
      if (open) {
        setIsLoading(true);
        onLoadingChange?.(true);
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
          onLoadingChange?.(false);
        }
      } else {
        // 对话框关闭时重置状态
        setShowForm(false);
        setSelectedRecordId("");
        setIsLoading(false);
        onLoadingChange?.(false);
      }
    };
    fetchDegreeRecords();
  }, [open, onLoadingChange]);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error("请选择有效的图片文件");
      return;
    }

    try {
      // Log user info and file details
      const currentUser = localStorage.getItem("currentUser");
      if (currentUser) {
        const user = JSON.parse(currentUser);
        console.log(`用户 ${user.name || user.id} 正在上传学位验证照片，文件名: ${file.name}`);
      }
      
      // Import compressImage utility
      const { compressImage } = await import('@/lib/utils');
      // Compress image if needed
      const compressedPhotoData = await compressImage(file);
      setFormData({ ...formData, photo: compressedPhotoData });
    } catch (error) {
      console.error("照片上传失败:", error);
      toast.error("照片上传失败，请重试");
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

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

const handleConfirmGenerate = async () => {
    setShowConfirmDialog(false);
    
    try {
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser) {
        toast.error("用户信息获取失败");
        return;
      }
      
      const user = JSON.parse(currentUser);
      console.log("Current user:", user);

      // 导入API函数
      const { decreasePdfLimit } = await import('@/lib/api');

      // 调用后端API扣除PDF积分
      const pdfLimitData = await decreasePdfLimit(user.username, 30);

      if (!pdfLimitData?.success) {
        const errorMsg = pdfLimitData?.message || pdfLimitData?.error || "扣除PDF下载积分失败";
        toast.error(errorMsg);
        return;
      }

      // Update localStorage with new pdf_limit
      const updatedUser = { ...user, pdf_limit: pdfLimitData.newPdfLimit };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      // Close the current dialog and show loading dialog
      onOpenChange(false);
      setShowLoadingDialog(true);
      setIsGenerating(true);

      const pdfData = {
        name: formData.name,
        gender: formData.gender,
        birthDate: formatDateToChinese(formData.birthDate),
        degreeDate: formatDateToChinese(formData.degreeDate),
        university: formData.university,
        degreeType: formData.degreeType,
        major: formData.major,
        certificateNumber: formData.certificateNumber,
        photo: formData.photo,
      };

      // 准备签名参数
      const timestamp = Date.now().toString();
      const appKey = import.meta.env.VITE_APP_KEY || 'sadwgfsefsdgfsdgf'; // 从环境变量获取appKey
      
      // 生成签名
      const method = 'POST';
      const apiUrl = '/api/generate-degree-pdf';
      const sortedParams = Object.keys(pdfData).sort().map(key => `${key}=${pdfData[key as keyof typeof pdfData]}`).join('&');
      const signString = `${method.toUpperCase()}${apiUrl}${sortedParams}${timestamp}`;
      
      let hash = 0;
      for (let i = 0; i < signString.length; i++) {
        const char = signString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      // 使用从环境变量获取的密钥影响哈希值
      const secretKey = import.meta.env.VITE_API_SECRET_KEY || 'edit_my_degree_api_secret_key';
      for (let i = 0; i < secretKey.length; i++) {
        const char = secretKey.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      const signature = Math.abs(hash).toString(16);

      // Call the PDF generation API
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/generate-degree-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Timestamp": timestamp,
            "X-App-Key": appKey,
            "X-Signature": signature,
          },
          body: JSON.stringify(pdfData),
        }
      );

      if (!response.ok) {
        throw new Error("PDF生成失败");
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      
      // Mobile-friendly download approach
      const url = window.URL.createObjectURL(blob);
      const filename = `中国高等教育学位在线验证报告_${formData.name}_${Date.now()}.pdf`;
      
      // Try modern approach first
      if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
        try {
          const file = new File([blob], filename, { type: 'application/pdf' });
          await navigator.share({
            files: [file],
            title: '学位验证报告'
          });
        } catch (shareError) {
          // Fallback to download
          downloadFile(url, filename);
        }
      } else {
        // Desktop or fallback download
        downloadFile(url, filename);
      }
      
      window.URL.revokeObjectURL(url);

      toast.success("学位在线验证报告PDF生成成功！");
      
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
      console.error("学位在线验证报告PDF生成错误:", error);
      toast.error(`${error},学位在线验证报告PDF生成失败！`);
    } finally {
      setIsGenerating(false);
      setShowLoadingDialog(false);
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  };

  return (
    <>
      <LoadingDialog open={showLoadingDialog} />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>学位在线验证报告信息</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 加载状态 */}
          {isLoading && (
            <div className="space-y-4 py-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {/* 如果有学位记录但未选择，先显示选择器 */}
          {!isLoading && degreeRecords.length > 0 && !showForm && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground mb-4">
                请选择一条学位记录或手动填写：
              </p>
              <div className="space-y-2">
                {degreeRecords.map((record) => (
                  <Button
                    key={record.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleRecordSelect(record.id)}
                  >
                    <div>
                      <div className="font-medium">{record.school}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.name} · {record.degree_type}
                      </div>
                    </div>
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleManualInput}
                >
                  手动填写
                </Button>
              </div>
            </div>
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
            <Label htmlFor="name">姓名 <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入姓名"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gender">性别 <span className="text-destructive">*</span></Label>
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
            <Label>出生日期 <span className="text-destructive">*</span></Label>
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
            <Label>获学位日期 <span className="text-destructive">*</span></Label>
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
            <Label htmlFor="university">学位授予单位 <span className="text-destructive">*</span></Label>
            <Input
              id="university"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              placeholder="请输入学位授予单位"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="degreeType">所授学位 <span className="text-destructive">*</span></Label>
            <Input
              id="degreeType"
              value={formData.degreeType}
              onChange={(e) => setFormData({ ...formData, degreeType: e.target.value })}
              placeholder="例如：电子信息硕士专业学位"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="major">学科/专业 <span className="text-destructive">*</span></Label>
            <Input
              id="major"
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              placeholder="请输入学科或专业"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="certificateNumber">学位证书编号 <span className="text-destructive">*</span></Label>
            <Input
              id="certificateNumber"
              value={formData.certificateNumber}
              onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
              placeholder="16位纯数字学位证书编号"
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

    <LoadingDialog 
      open={showLoadingDialog} 
      message="正在生成学位验证报告，请稍候..." 
    />

    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认生成报告</AlertDialogTitle>
          <AlertDialogDescription>
            生成学位验证报告PDF<span className="text-destructive">需要消耗30个PDF积分</span>，是否确认生成？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmGenerate}>确认</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default DegreeVerificationDialog;
