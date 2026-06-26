import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compressImage } from "@/lib/utils";
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
import LoadingDialog from "./LoadingDialog";
import { de } from "date-fns/locale";
import { DEGREE_LEVELS } from "@/lib/educationSort";

interface StudentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const StudentStatusDialog = ({
  open,
  onOpenChange,
  onLoadingChange,
}: StudentStatusDialogProps) => {
  // 从环境变量读取PDF积分购买链接
  const cardPdfUrl = import.meta.env.VITE_CARD_PDF_URL || "http://4ox.cn/sdms3r";
  
  const [studentRecords, setStudentRecords] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    birthDate: undefined as Date | undefined,
    nationality: "",
    school: "",
    degreeLevel: "",
    major: "",
    duration: "",
    educationType: "",
    studyType: "",
    branch: "",
    department: "",
    enrollmentDate: undefined as Date | undefined,
    status: "",
    graduationDate: undefined as Date | undefined,
    degreePhoto: "",
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

  // 获取用户的学籍记录
  useEffect(() => {
    const fetchStudentRecords = async () => {
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
            if (userData.studentStatus && userData.studentStatus.length > 0) {
              setStudentRecords(userData.studentStatus);
              setShowForm(false);
            } else {
              setShowForm(true);
            }
          }
        } catch (error) {
          console.error("获取学籍记录失败:", error);
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
    fetchStudentRecords();
  }, [open, onLoadingChange]);

  // 手动填写
  const handleManualInput = () => {
    setSelectedRecordId("");
    setFormData({
      name: "",
      gender: "",
      birthDate: undefined,
      nationality: "",
      school: "",
      degreeLevel: "",
      major: "",
      duration: "",
      educationType: "",
      studyType: "",
      branch: "",
      department: "",
      enrollmentDate: undefined,
      status: "",
      graduationDate: undefined,
      degreePhoto: "",
    });
    setShowForm(true);
  };

  // 当用户选择一条记录时，自动填充表单
  const handleRecordSelect = (recordId: string) => {
    setSelectedRecordId(recordId);
    const record = studentRecords.find((r) => r.id === recordId);
    if (record) {
      const parseDate = (dateStr: string | null) => {
        if (!dateStr) return undefined;
        
        // Try to match full Chinese date format: "2000年1月1日"
        const chineseFullMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (chineseFullMatch) {
          return new Date(
            parseInt(chineseFullMatch[1]),
            parseInt(chineseFullMatch[2]) - 1,
            parseInt(chineseFullMatch[3])
          );
        }
        
        // Try to match year-month Chinese format: "2000年1月"
        const chineseYearMonthMatch = dateStr.match(/(\d{4})年(\d{1,2})月/);
        if (chineseYearMonthMatch) {
          return new Date(
            parseInt(chineseYearMonthMatch[1]),
            parseInt(chineseYearMonthMatch[2]) - 1,
            1 // Default to first day of the month
          );
        }
        
        // Try to match ISO year-month format: "2000-01"
        const isoYearMonthMatch = dateStr.match(/^(\d{4})-(\d{1,2})$/);
        if (isoYearMonthMatch) {
          return new Date(
            parseInt(isoYearMonthMatch[1]),
            parseInt(isoYearMonthMatch[2]) - 1,
            1
          );
        }
        
        // Try standard date parsing
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? undefined : date;
      };

      setFormData({
        name: record.name || "",
        gender: record.gender || "",
        birthDate: parseDate(record.birth_date),
        nationality: record.nationality || "",
        school: record.school || "",
        degreeLevel: record.degree_level || "",
        major: record.major || "",
        duration: record.duration || "",
        educationType: record.education_type || "",
        studyType: record.study_type || "",
        branch: record.branch || "",
        department: record.department || "",
        enrollmentDate: parseDate(record.enrollment_date),
        status: record.status || "",
        graduationDate: parseDate(record.graduation_date),
        degreePhoto: record.degree_photo || "",
      });
      setShowForm(true);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}年${month}月${day}日`;
  };

  const handlePhotoUpload = async (file: File) => {
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
        console.log(`用户 ${user.name || user.id} 正在上传学籍状态照片，文件名: ${file.name}, 文件大小: ${file.size}字节, 文件类型: ${file.type}`);
      }
      
      // Compress image if needed
      const compressedPhotoData = await compressImage(file);
      setFormData((prev) => ({
        ...prev,
        degreePhoto: compressedPhotoData,
      }));
    } catch (error) {
      console.error("照片上传失败:", error);
      toast.error("照片上传失败");
    }
  };

  const handleGenerate = async () => {
    // 验证必填字段，如果非必填就从这里删除即可
    if (
      !formData.name ||
      !formData.gender ||
      !formData.birthDate ||
      !formData.nationality ||
      !formData.school ||
      !formData.degreeLevel ||
      !formData.major ||
      !formData.duration ||
      !formData.educationType ||
      !formData.studyType ||
      !formData.enrollmentDate ||
      !formData.status ||
      !formData.graduationDate ||
      !formData.degreePhoto
    ) {
      toast.error("请填写所有必填字段");
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

      console.log("PDF limit result:", pdfLimitData);

      if (!pdfLimitData?.success) {
        const errorMsg = pdfLimitData?.message || pdfLimitData?.error || "扣除PDF下载积分失败";
        toast.error(errorMsg);
        return;
      }

      // Update localStorage with new pdf_limit
      const updatedUser = { ...user, pdf_limit: pdfLimitData.newPdfLimit };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      setIsGenerating(true);
      onOpenChange(false);
      setShowLoadingDialog(true);

      const pdfData = {
        name: formData.name,
        gender: formData.gender,
        birthDate: formatDate(formData.birthDate),
        nationality: formData.nationality,
        school: formData.school,
        degreeLevel: formData.degreeLevel,
        major: formData.major,
        duration: formData.duration,
        educationType: formData.educationType,
        studyType: formData.studyType,
        branch: formData.branch,
        department: formData.department,
        enrollmentDate: formatDate(formData.enrollmentDate),
        status: formData.status,
        graduationDate: formatDate(formData.graduationDate),
        degreePhoto: formData.degreePhoto,
      };

      // 准备签名参数
      const timestamp = Date.now().toString();
      const appKey = import.meta.env.VITE_APP_KEY || 'sadwgfsefsdgfsdgf'; // 从环境变量获取appKey
      
      // 生成签名
      const method = 'POST';
      const requestUrl = '/api/generate-student-status-pdf';
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

      // 调用后端接口生成学籍验证报告PDF
      const generateResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/generate-student-status-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Timestamp': timestamp,
          'X-App-Key': appKey,
          'X-Signature': signature,
        },
        body: JSON.stringify(pdfData),
      });

      console.log("学籍验证报告PDF response:", generateResponse);

      // 检查响应是否成功
      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        let errorMessage = '生成PDF失败';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // 如果不是JSON格式，则使用原始文本
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      // 检查响应类型 - 新版本的API可能返回JSON(包含downloadUrl)或直接的PDF数据
      const contentType = generateResponse.headers.get('content-type');
      
      let downloadUrl: string | null = null;
      let fileName: string;
      
      if (contentType && contentType.includes('application/json')) {
        // 新版本: 返回JSON包含MinIO下载链接
        const result = await generateResponse.json();
        if (result.success && result.downloadUrl) {
          downloadUrl = result.downloadUrl;
          fileName = result.fileName || `教育部学籍在线验证报告_${formData.name}_${Date.now()}.pdf`;
        } else {
          throw new Error(result.error || "PDF生成失败");
        }
      } else {
        // 旧版本: 直接返回PDF二进制数据
        if (!contentType || !contentType.includes('application/pdf')) {
          const errorText = await generateResponse.text();
          let errorMessage = '服务器返回了意外的响应格式';
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // 如果不是JSON格式，则使用原始文本
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }

        // 使用 arrayBuffer() 替代 blob()
        const arrayBuffer = await generateResponse.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        downloadUrl = window.URL.createObjectURL(blob);
        
        const contentDisposition = generateResponse.headers.get('content-disposition');
        fileName = `教育部学籍在线验证报告_${formData.name}_${Date.now()}.pdf`;
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (fileNameMatch && fileNameMatch[1]) {
            fileName = fileNameMatch[1].replace(/['"]/g, '');
          }
        }
        fileName = decodeURIComponent(fileName);
      }

      // 显示下载链接对话框
      if (downloadUrl) {
        setDownloadLink(downloadUrl);
        setPdfFileName(fileName);
        setShowDownloadDialog(true);
        toast.success("PDF生成成功！请使用下方链接下载");
      }

      toast.success("教育部学籍在线验证报告生成成功");
    } catch (error) {
      console.error("生成学籍在线验证报告失败:", error);
      toast.error(`${error},生成学籍在线验证报告失败！`);
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

  // 处理PDF积分购买
  const handlePurchasePdfCredits = () => {
    window.open(cardPdfUrl, "_blank");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>教育部学籍在线验证报告</DialogTitle>
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
                请选择一条学籍记录或手动填写：
              </p>
              <div className="space-y-2">
                {studentRecords.map((record) => (
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名 <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="请输入姓名"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">性别 <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男">男</SelectItem>
                      <SelectItem value="女">女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
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
                        {formData.birthDate
                          ? formatDate(formData.birthDate)
                          : "选择日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
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
                  <Label htmlFor="nationality">民族 <span className="text-destructive">*</span></Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) =>
                      setFormData({ ...formData, nationality: e.target.value })
                    }
                    placeholder="例:：汉族 \ 回族"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="school">学校名称 <span className="text-destructive">*</span></Label>
                  <Input
                    id="school"
                    value={formData.school}
                    onChange={(e) =>
                      setFormData({ ...formData, school: e.target.value })
                    }
                    placeholder="输入大学校名"
                  />
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

                <div className="space-y-2">
                  <Label htmlFor="major">专业 <span className="text-destructive">*</span></Label>
                  <Input
                    id="major"
                    value={formData.major}
                    onChange={(e) =>
                      setFormData({ ...formData, major: e.target.value })
                    }
                    placeholder="请输入所学专业名称"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">学制 <span className="text-destructive">*</span></Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    placeholder="例：4 年（存在空格）"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="educationType">学历类别 <span className="text-destructive">*</span></Label>
                  <Input
                    id="educationType"
                    value={formData.educationType}
                    onChange={(e) =>
                      setFormData({ ...formData, educationType: e.target.value })
                    }
                    placeholder="例：普通高等教育"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studyType">学习形式 <span className="text-destructive">*</span></Label>
                  <Input
                    id="studyType"
                    value={formData.studyType}
                    onChange={(e) =>
                      setFormData({ ...formData, studyType: e.target.value })
                    }
                    placeholder="例：普通全日制 \ 全日制 \ 非全日制"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">分院</Label>
                  <Input
                    id="branch"
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value })
                    }
                    placeholder="例：经济管理学院（可留空）"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">系所</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="校区或院系名称（可留空）"
                  />
                </div>

                <div className="space-y-2">
                  <Label>入学日期 <span className="text-destructive">*</span></Label>
                  <Popover open={enrollmentDateOpen} onOpenChange={setEnrollmentDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.enrollmentDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.enrollmentDate
                          ? formatDate(formData.enrollmentDate)
                          : "选择日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
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
                  <Label htmlFor="status">学籍状态 <span className="text-destructive">*</span></Label>
                  <Input
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    placeholder="例：在籍（注册学籍） \不在籍（毕业）"
                  />
                </div>

                <div className="space-y-2">
                  <Label>离校日期 <span className="text-destructive">*</span></Label>
                  <Popover open={graduationDateOpen} onOpenChange={setGraduationDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.graduationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.graduationDate
                          ? formatDate(formData.graduationDate)
                          : "选择日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
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

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="degreePhoto">毕业学历证件照（一般要求蓝底） <span className="text-destructive">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      id="degreePhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file);
                      }}
                    />
                    {formData.degreePhoto && (
                      <img
                        src={formData.degreePhoto}
                        alt="毕业照片预览"
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  生成报告
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <LoadingDialog
        open={showLoadingDialog}
        message="正在生成学籍验证报告..."
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
                  生成学籍在线验证报告PDF需要消耗 <span className="font-semibold text-destructive">30个PDF积分</span>
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
                className="flex-1 h-11 text-base bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md"
              >
                确认生成
              </Button>
            </div>
            
            {/* 购买积分按钮 - 独立一行 */}
            <Button
              onClick={handlePurchasePdfCredits}
              variant="outline"
              className="w-full h-11 text-base border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-600 transition-all duration-200 shadow-sm"
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
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
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

export default StudentStatusDialog;
