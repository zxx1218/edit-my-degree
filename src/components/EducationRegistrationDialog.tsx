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
import { CalendarIcon, Upload, ExternalLink, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getUserData } from "@/lib/api";
import { compressImage } from "@/lib/utils"; // Import compressImage utility
import LoadingDialog from "./LoadingDialog";
import { DEGREE_LEVELS } from "@/lib/educationSort";

interface EducationRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const EducationRegistrationDialog = ({
  open,
  onOpenChange,
  onLoadingChange,
}: EducationRegistrationDialogProps) => {
  // 从环境变量读取PDF积分购买链接
  const cardPdfUrl = import.meta.env.VITE_CARD_PDF_URL || "http://4ox.cn/sdms3r";
  
  const [educationRecords, setEducationRecords] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    birthDate: undefined as Date | undefined,
    enrollmentDate: undefined as Date | undefined,
    graduationDate: undefined as Date | undefined,
    school: "",
    major: "",
    duration: "",
    degreeLevel: "",
    educationType: "",
    studyType: "",
    graduationStatus: "",
    certificateNumber: "",
    principalName: "",
    photo: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [enrollmentDateOpen, setEnrollmentDateOpen] = useState(false);
  const [graduationDateOpen, setGraduationDateOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentPdfLimit, setCurrentPdfLimit] = useState<number>(0);
  // 下载链接对话框状态
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadLink, setDownloadLink] = useState<string>("");
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // 获取用户的学历记录
  useEffect(() => {
    const fetchEducationRecords = async () => {
      if (open) {
        setIsLoading(true);
        onLoadingChange?.(true);
        try {
          const currentUser = localStorage.getItem("currentUser");
          if (currentUser) {
            const user = JSON.parse(currentUser);
            const [userData] = await Promise.all([
              getUserData(user.id),
              new Promise(resolve => setTimeout(resolve, 500))
            ]);
            if (userData.education && userData.education.length > 0) {
              setEducationRecords(userData.education);
              setShowForm(false);
            } else {
              setShowForm(true);
            }
          }
        } catch (error) {
          console.error("获取学历记录失败:", error);
          setShowForm(true);
        } finally {
          setIsLoading(false);
          onLoadingChange?.(false);
        }
      } else {
        setShowForm(false);
        setSelectedRecordId("");
        setIsLoading(false);
        onLoadingChange?.(false);
      }
    };
    fetchEducationRecords();
  }, [open, onLoadingChange]);

  // 当用户选择一条记录时，自动填充表单
  const handleRecordSelect = (recordId: string) => {
    setSelectedRecordId(recordId);
    const record = educationRecords.find((r) => r.id === recordId);
    if (record) {
      const parseDate = (dateStr: string | null) => {
        if (!dateStr) return undefined;
        const chineseMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (chineseMatch) {
          return new Date(parseInt(chineseMatch[1]), parseInt(chineseMatch[2]) - 1, parseInt(chineseMatch[3]));
        }
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? undefined : date;
      };

      setFormData({
        name: record.name || "",
        gender: record.gender || "",
        birthDate: parseDate(record.birth_date),
        enrollmentDate: parseDate(record.enrollment_date),
        graduationDate: parseDate(record.graduation_date),
        school: record.school || "",
        major: record.major || "",
        duration: record.duration || "",
        degreeLevel: record.degree_level || "",
        educationType: record.education_type || "",
        studyType: record.study_type || "",
        graduationStatus: record.graduation_status || "",
        certificateNumber: record.certificate_number || "",
        principalName: record.principal_name || "",
        photo: record.photo || "",
      });
      setShowForm(true);
    }
  };

  const handleManualInput = () => {
    setSelectedRecordId("manual");
    setFormData({
      name: "",
      gender: "",
      birthDate: undefined,
      enrollmentDate: undefined,
      graduationDate: undefined,
      school: "",
      major: "",
      duration: "",
      degreeLevel: "",
      educationType: "",
      studyType: "",
      graduationStatus: "",
      certificateNumber: "",
      principalName: "",
      photo: "",
    });
    setShowForm(true);
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
        console.log(`用户 ${user.name || user.id} 正在上传教育背景照片，文件名: ${file.name}`);
      }
      
      // Compress image if needed
      const compressedPhotoData = await compressImage(file);
      setFormData({ ...formData, photo: compressedPhotoData });
    } catch (error) {
      console.error("照片上传失败:", error);
      toast.error("照片上传失败");
    }
  };

  const formatDateForDisplay = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}年${month}月${day}日`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.gender || !formData.birthDate || !formData.enrollmentDate || 
        !formData.graduationDate || !formData.school || !formData.major || !formData.duration || 
        !formData.degreeLevel || !formData.educationType || !formData.studyType || 
        !formData.graduationStatus || !formData.certificateNumber || !formData.principalName || !formData.photo) {
      toast.error("请填写所有必填项");
      return;
    }

    // Get current PDF limit before showing confirmation dialog
    const currentUserStr = localStorage.getItem("currentUser");
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      setCurrentPdfLimit(currentUser.pdf_limit || 0);
    }

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

      // 准备签名参数
      const timestamp = Date.now().toString();
      const appKey = import.meta.env.VITE_APP_KEY || 'sadwgfsefsdgfsdgf'; // 从环境变量获取appKey
      
      const pdfData = {
        name: formData.name,
        gender: formData.gender,
        birthDate: formatDateForDisplay(formData.birthDate),
        enrollmentDate: formatDateForDisplay(formData.enrollmentDate),
        graduationDate: formatDateForDisplay(formData.graduationDate),
        school: formData.school,
        major: formData.major,
        duration: formData.duration,
        degreeLevel: formData.degreeLevel,
        educationType: formData.educationType,
        studyType: formData.studyType,
        graduationStatus: formData.graduationStatus,
        certificateNumber: formData.certificateNumber,
        principalName: formData.principalName,
        photo: formData.photo,
      };

      // 生成签名
      const method = 'POST';
      const requestUrl = '/api/generate-education-pdf';
      const sortedParams = Object.keys(pdfData).sort().map(key => `${key}=${pdfData[key as keyof typeof pdfData]}`).join('&');
      const signString = `${method.toUpperCase()}${requestUrl}${sortedParams}${timestamp}`;
      
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

      // 调用后端API生成学籍验证报告PDF
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/generate-education-pdf`,
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
      console.log("学籍报告pdf的Response:", response);
      if (!response.ok) throw new Error("生成学历证书电子注册备案表PDF失败");

      // 检查响应类型 - 新版本的API可能返回JSON(包含downloadUrl)或直接的PDF数据
      const contentType = response.headers.get('content-type');
      
      let downloadUrl: string | null = null;
      let filename: string;
      
      if (contentType && contentType.includes('application/json')) {
        // 新版本: 返回JSON包含MinIO下载链接
        const result = await response.json();
        if (result.success && result.downloadUrl) {
          downloadUrl = result.downloadUrl;
          filename = result.fileName || `教育部学历证书电子注册备案表_${formData.name}_${Date.now()}.pdf`;
        } else {
          throw new Error(result.error || "PDF生成失败");
        }
      } else {
        // 旧版本: 直接返回PDF二进制数据
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        downloadUrl = window.URL.createObjectURL(blob);
        filename = `教育部学历证书电子注册备案表_${formData.name}_${Date.now()}.pdf`;
      }
      
      // 显示下载链接对话框
      if (downloadUrl) {
        setDownloadLink(downloadUrl);
        setPdfFileName(filename);
        setShowDownloadDialog(true);
        toast.success("PDF生成成功！请使用下方链接下载");
      }

      toast.success("学历证书电子注册备案表生成成功！");
    } catch (error) {
      console.error("生成学历证书电子注册备案表失败:", error);
      toast.error(`${error},生成学历证书电子注册备案表失败！`);
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
      console.error('复制失败:', err);
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
      <Dialog open={open && !showLoadingDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>教育部学历证书电子注册备案表</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !showForm ? (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground mb-4">
                请选择一条学历记录或手动填写：
              </p>
              <div className="space-y-2">
                {educationRecords.map((record) => (
                  <Button
                    key={record.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleRecordSelect(record.id)}
                  >
                    <div>
                      <div className="font-medium">{record.school}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.major} · {record.degree_level}
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
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名 <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入姓名"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">性别 <span className="text-destructive">*</span></Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男">男</SelectItem>
                      <SelectItem value="女">女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>出生日期 <span className="text-destructive">*</span></Label>
                <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !formData.birthDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.birthDate ? formatDateForDisplay(formData.birthDate) : "选择日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.birthDate}
                      onSelect={(date) => {
                        setFormData({ ...formData, birthDate: date });
                        setBirthDateOpen(false);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                      captionLayout="dropdown-buttons"
                      fromYear={1950}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>入学日期 <span className="text-destructive">*</span></Label>
                <Popover open={enrollmentDateOpen} onOpenChange={setEnrollmentDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !formData.enrollmentDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.enrollmentDate ? formatDateForDisplay(formData.enrollmentDate) : "选择日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.enrollmentDate}
                      onSelect={(date) => {
                        setFormData({ ...formData, enrollmentDate: date });
                        setEnrollmentDateOpen(false);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                      captionLayout="dropdown-buttons"
                      fromYear={1950}
                      toYear={new Date().getFullYear() + 10}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>毕（结）业日期 <span className="text-destructive">*</span></Label>
                <Popover open={graduationDateOpen} onOpenChange={setGraduationDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !formData.graduationDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.graduationDate ? formatDateForDisplay(formData.graduationDate) : "选择日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.graduationDate}
                      onSelect={(date) => {
                        setFormData({ ...formData, graduationDate: date });
                        setGraduationDateOpen(false);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                      captionLayout="dropdown-buttons"
                      fromYear={1950}
                      toYear={new Date().getFullYear() + 10}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school">学校名称 <span className="text-destructive">*</span></Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder="就读学校的名字"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="major">专业 <span className="text-destructive">*</span></Label>
                  <Input
                    id="major"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    placeholder="例：经济与金融"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">学制 <span className="text-destructive">*</span></Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="例：4 年（存在空格）"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="degreeLevel">层次 <span className="text-destructive">*</span></Label>
                <Select 
                  value={formData.degreeLevel} 
                  onValueChange={(value) => setFormData({ ...formData, degreeLevel: value })}
                >
                  <SelectTrigger id="degreeLevel">
                    <SelectValue placeholder="选择学历层次" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="educationType">学历类别 <span className="text-destructive">*</span></Label>
                  <Input
                    id="educationType"
                    value={formData.educationType}
                    onChange={(e) => setFormData({ ...formData, educationType: e.target.value })}
                    placeholder="例：普通高等教育"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studyType">学习形式 <span className="text-destructive">*</span></Label>
                  <Input
                    id="studyType"
                    value={formData.studyType}
                    onChange={(e) => setFormData({ ...formData, studyType: e.target.value })}
                    placeholder="例：普通全日制"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationStatus">毕（结）业 <span className="text-destructive">*</span></Label>
                <Input
                  id="graduationStatus"
                  value={formData.graduationStatus}
                  onChange={(e) => setFormData({ ...formData, graduationStatus: e.target.value })}
                  placeholder="例：毕业 或 结业"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificateNumber">证书编号 <span className="text-destructive">*</span></Label>
                <Input
                  id="certificateNumber"
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                  placeholder="例：1234 5678 1234 5678 12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="principalName">校（院）长姓名 <span className="text-destructive">*</span></Label>
                <Input
                  id="principalName"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  placeholder="请输入校（院）长的姓名"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">蓝底证件照 <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-4">
                  {formData.photo && (
                    <img src={formData.photo} alt="证件照" className="w-20 h-24 object-cover rounded" />
                  )}
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">
                      <Upload className="w-4 h-4" />
                      <span>{formData.photo ? "更换照片" : "上传蓝底照片"}</span>
                    </div>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedRecordId("");
                  }}
                >
                  返回
                </Button>
                <Button type="submit" className="flex-1" disabled={isGenerating}>
                  生成报告
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <LoadingDialog
        open={showLoadingDialog}
        message="正在生成报告"
        description="请稍候，这可能需要 10 秒钟左右..."
      />

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">确认制作报告</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-center">
              <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                <div className="text-lg font-semibold text-primary">
                  当前剩余PDF积分：<span className="text-2xl">{currentPdfLimit}</span> 分
                </div>
                <div className="text-sm text-muted-foreground">
                  生成学历证书电子注册备案表PDF需要消耗 <span className="font-semibold text-destructive">30个PDF积分</span>
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
                className="flex-1 h-11 text-base bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md"
              >
                确认生成
              </Button>
            </div>
            
            {/* 购买积分按钮 - 独立一行 */}
            <Button
              onClick={handlePurchasePdfCredits}
              variant="outline"
              className="w-full h-11 text-base border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-600 transition-all duration-200 shadow-sm"
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
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
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

export default EducationRegistrationDialog;
