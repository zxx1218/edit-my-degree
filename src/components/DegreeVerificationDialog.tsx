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
import { CalendarIcon, ExternalLink, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  // 从环境变量读取PDF积分购买链接
  const cardPdfUrl = import.meta.env.VITE_CARD_PDF_URL || "http://4ox.cn/sdms3r";
  
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
  const [currentPdfLimit, setCurrentPdfLimit] = useState<number>(0);
  // 下载链接对话框状态
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadLink, setDownloadLink] = useState<string>("");
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [copied, setCopied] = useState(false);

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
      // Import compressImage utility
      const { compressImage } = await import('@/lib/utils');
      // Compress image if needed
      const compressedPhotoData = await compressImage(file);
      setFormData({ ...formData, photo: compressedPhotoData });
    } catch (error) {
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

    // Get current PDF limit before showing confirmation dialog
    const currentUserStr = localStorage.getItem("currentUser");
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      setCurrentPdfLimit(currentUser.pdf_limit || 0);
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

      // 准备签名参数
      const timestamp = Date.now().toString();
      const appKey = import.meta.env.VITE_APP_KEY || 'sadwgfsefsdgfsdgf'; // 从环境变量获取appKey
      
      // 生成区块链节点验证字段（使用时间戳加密）
      const secretKeyForNode = import.meta.env.VITE_API_SECRET_KEY || 'edit_my_degree_api_secret_key';
      const blockchainNodeHash = (() => {
        const nodeString = `blockchain_verify_${timestamp}`;
        let nodeHash = 0;
        for (let i = 0; i < nodeString.length; i++) {
          const char = nodeString.charCodeAt(i);
          nodeHash = ((nodeHash << 5) - nodeHash) + char;
          nodeHash = nodeHash & nodeHash;
        }
        // 使用API_SECRET_KEY来影响哈希值
        for (let i = 0; i < secretKeyForNode.length; i++) {
          const char = secretKeyForNode.charCodeAt(i);
          nodeHash = ((nodeHash << 5) - nodeHash) + char;
          nodeHash = nodeHash & nodeHash;
        }
        return Math.abs(nodeHash).toString(16);
      })();

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
        blockchain_node: blockchainNodeHash, // 添加区块链节点验证字段
      };

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

      // 获取JWT token用于认证
      const authToken = localStorage.getItem("authToken");
      
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
            ...(authToken && { "Authorization": `Bearer ${authToken}` }),
          },
          body: JSON.stringify(pdfData),
        }
      );

      if (!response.ok) {
        // 检查是否是认证错误（401）
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "请先登录");
        }
        // 检查是否是限流错误（429）
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "操作过于频繁，请稍后再试");
        }
        throw new Error("PDF生成失败");
      }

      // 检查响应类型 - 新版本的API可能返回JSON(包含downloadUrl)或直接的PDF数据
      const contentType = response.headers.get('content-type');
      
      let downloadUrl: string | null = null;
      let filename: string;
      
      if (contentType && contentType.includes('application/json')) {
        // 新版本: 返回JSON包含MinIO下载链接
        const result = await response.json();
        if (result.success && result.downloadUrl) {
          downloadUrl = result.downloadUrl;
          filename = result.fileName || `中国高等教育学位在线验证报告_${formData.name}_${Date.now()}.pdf`;
        } else {
          throw new Error(result.error || "PDF生成失败");
        }
      } else {
        // 旧版本: 直接返回PDF二进制数据
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        downloadUrl = window.URL.createObjectURL(blob);
        filename = `中国高等教育学位在线验证报告_${formData.name}_${Date.now()}.pdf`;
      }
      
      // 显示下载链接对话框
      if (downloadUrl) {
        setDownloadLink(downloadUrl);
        setPdfFileName(filename);
        setShowDownloadDialog(true);
        toast.success("PDF生成成功！请使用下方链接下载");
      }

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
      toast.error(`${error},学位在线验证报告PDF生成失败！`);
    } finally {
      setIsGenerating(false);
      setShowLoadingDialog(false);
    }
  };

  // 复制链接功能
  const handleCopyLink = async () => {
    try {
      // 方法1: 使用现代Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(downloadLink);
        setCopied(true);
        toast.success("链接已复制到剪贴板");
        setTimeout(() => setCopied(false), 2000);
      } 
      // 方法2: 降级方案 - 使用传统execCommand
      else {
        const textArea = document.createElement('textarea');
        textArea.value = downloadLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopied(true);
            toast.success("链接已复制到剪贴板");
            setTimeout(() => setCopied(false), 2000);
          } else {
            throw new Error('execCommand copy failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      // 最后降级方案：选中输入框内容让用户手动复制
      const inputElement = document.querySelector('input[readonly]') as HTMLInputElement;
      if (inputElement) {
        inputElement.select();
        inputElement.setSelectionRange(0, 99999);
        toast.info("已选中文本，请按 Ctrl+C (Mac: Cmd+C) 手动复制");
      } else {
        toast.error("复制失败，请手动复制上方链接");
      }
    }
  };

  // 触发下载
  const handleDownload = () => {
    if (downloadLink.startsWith('http')) {
      // MinIO链接，新窗口打开
      window.open(downloadLink, '_blank');
      toast.success("正在打开下载链接...");
    } else {
      // Blob URL，使用<a>标签下载
      const link = document.createElement("a");
      link.href = downloadLink;
      link.download = pdfFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("开始下载...");
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

  // 处理PDF积分购买
  const handlePurchasePdfCredits = () => {
    window.open(cardPdfUrl, "_blank");
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
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">确认生成报告</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-center">
            <div className="bg-primary/10 rounded-lg p-4 space-y-2">
              <div className="text-lg font-semibold text-primary">
                当前剩余PDF积分：<span className="text-2xl">{currentPdfLimit}</span> 分
              </div>
              <div className="text-sm text-muted-foreground">
                生成学位验证报告PDF需要消耗 <span className="font-semibold text-destructive">30个PDF积分</span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex flex-col gap-3 pt-2">
          {/* 主要操作按钮 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 h-11 text-base"
            >
              取消
            </Button>
            <Button
              onClick={handleConfirmGenerate}
              className="flex-1 h-11 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
            >
              确认生成
            </Button>
          </div>
          
          {/* 购买积分按钮 - 独立一行 */}
          <Button
            onClick={handlePurchasePdfCredits}
            variant="outline"
            className="w-full h-11 text-base border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-600 transition-all duration-200 shadow-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            积分不足？点击购买PDF积分
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>

    {/* 下载链接对话框 */}
    <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-center">📄 PDF已生成成功</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              💡 提示：点击下方链接即可下载PDF文件。您可以复制链接到浏览器中打开下载。
            </p>
            
            {/* 下载链接显示区域 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 mb-3">
              <div className="flex items-center gap-2">
                <Input
                  value={downloadLink}
                  readOnly
                  className="flex-1 text-xs font-mono bg-transparent border-0 focus-visible:ring-0"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* 文件名显示 */}
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              📁 文件名：{pdfFileName}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDownloadDialog(false)}
              className="flex-1"
            >
              关闭
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              立即下载
            </Button>
          </div>
          
          {/* 移动端特别说明 */}
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              📱 <strong>iOS用户注意：</strong>若您使用safri浏览器，点击下载后，在浏览器中找到分享按钮即可选择发送到微信或者保存到文件。
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default DegreeVerificationDialog;
