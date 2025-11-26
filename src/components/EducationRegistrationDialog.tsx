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
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
// import { supabase } from "@/integrations/supabase/client";
import { getUserData } from "@/lib/api";
import LoadingDialog from "./LoadingDialog";

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

      // 调用后端API扣除PDF积分
      const pdfLimitResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/decrease-pdf-limit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: user.username,
          decreaseAmount: 30,
        }),
      });

      const pdfLimitData = await pdfLimitResponse.json();

      if (!pdfLimitResponse.ok || !pdfLimitData?.success) {
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

      // 调用后端API生成学籍验证报告PDF
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/generate-education-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
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
          }),
        }
      );
      console.log("学籍报告pdf的Response:", response);
      if (!response.ok) throw new Error("生成学籍报告PDF失败");

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      
      // Mobile-friendly download approach
      const url = window.URL.createObjectURL(blob);
      const filename = `教育部学历证书电子注册备案表_${formData.name}_${Date.now()}.pdf`;
      
      // Try modern approach first
      if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
        try {
          const file = new File([blob], filename, { type: 'application/pdf' });
          await navigator.share({
            files: [file],
            title: '学历证书电子注册备案表'
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

      toast.success("教育部学历证书电子注册备案表报告生成成功！");
    } catch (error) {
      console.error("生成报告失败:", error);
      toast.error("生成报告失败，请稍后重试");
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
                  <Label htmlFor="name">姓名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入姓名"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">性别 *</Label>
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
                <Label>出生日期 *</Label>
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
                <Label>入学日期 *</Label>
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
                <Label>毕（结）业日期 *</Label>
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
                <Label htmlFor="school">学校名称 *</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder="请输入大学的名称"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="major">专业 *</Label>
                  <Input
                    id="major"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    placeholder="例：经济与金融"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">学制 *</Label>
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
                <Label htmlFor="degreeLevel">层次 *</Label>
                <Input
                  id="degreeLevel"
                  value={formData.degreeLevel}
                  onChange={(e) => setFormData({ ...formData, degreeLevel: e.target.value })}
                  placeholder="例：本科"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="educationType">学历类别 *</Label>
                  <Input
                    id="educationType"
                    value={formData.educationType}
                    onChange={(e) => setFormData({ ...formData, educationType: e.target.value })}
                    placeholder="例：普通高等教育"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studyType">学习形式 *</Label>
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
                <Label htmlFor="graduationStatus">毕（结）业 *</Label>
                <Input
                  id="graduationStatus"
                  value={formData.graduationStatus}
                  onChange={(e) => setFormData({ ...formData, graduationStatus: e.target.value })}
                  placeholder="例：毕业 或 结业"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificateNumber">证书编号 *</Label>
                <Input
                  id="certificateNumber"
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                  placeholder="例：1234 5678 1234 5678 12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="principalName">校（院）长姓名 *</Label>
                <Input
                  id="principalName"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  placeholder="请输入校（院）长的姓名"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">蓝底证件照 *</Label>
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
        description="请稍候，这可能需要几秒钟..."
      />

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
          <AlertDialogTitle>确认生成报告</AlertDialogTitle>
          <AlertDialogDescription>
            生成学历证书电子注册备案表PDF需要消耗30个PDF下载积分，是否确认生成？
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

export default EducationRegistrationDialog;
