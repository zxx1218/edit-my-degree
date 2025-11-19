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
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getUserData } from "@/lib/api";
import LoadingDialog from "./LoadingDialog";

interface StudentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StudentStatusDialog = ({
  open,
  onOpenChange,
}: StudentStatusDialogProps) => {
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
    enrollmentDate: undefined as Date | undefined,
    status: "",
    graduationDate: undefined as Date | undefined,
    admissionPhoto: "",
    degreePhoto: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [enrollmentDateOpen, setEnrollmentDateOpen] = useState(false);
  const [graduationDateOpen, setGraduationDateOpen] = useState(false);

  // 获取用户的学籍记录
  useEffect(() => {
    const fetchStudentRecords = async () => {
      if (open) {
        setIsLoading(true);
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
        }
      } else {
        setShowForm(false);
        setSelectedRecordId("");
        setIsLoading(false);
      }
    };
    fetchStudentRecords();
  }, [open]);

  // 当用户选择一条记录时，自动填充表单
  const handleRecordSelect = (recordId: string) => {
    setSelectedRecordId(recordId);
    const record = studentRecords.find((r) => r.id === recordId);
    if (record) {
      const parseDate = (dateStr: string | null) => {
        if (!dateStr) return undefined;
        const chineseMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (chineseMatch) {
          return new Date(
            parseInt(chineseMatch[1]),
            parseInt(chineseMatch[2]) - 1,
            parseInt(chineseMatch[3])
          );
        }
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
        enrollmentDate: parseDate(record.enrollment_date),
        status: record.status || "",
        graduationDate: parseDate(record.graduation_date),
        admissionPhoto: record.admission_photo || "",
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

  const handlePhotoUpload = async (
    file: File,
    field: "admissionPhoto" | "degreePhoto"
  ) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [field]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("照片上传失败:", error);
      toast.error("照片上传失败");
    }
  };

  const handleGenerate = async () => {
    // 验证必填字段
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
      !formData.branch ||
      !formData.enrollmentDate ||
      !formData.status ||
      !formData.graduationDate ||
      !formData.admissionPhoto ||
      !formData.degreePhoto
    ) {
      toast.error("请填写所有必填字段");
      return;
    }

    setIsGenerating(true);
    onOpenChange(false);
    setShowLoadingDialog(true);

    try {
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
        enrollmentDate: formatDate(formData.enrollmentDate),
        status: formData.status,
        graduationDate: formatDate(formData.graduationDate),
        admissionPhoto: formData.admissionPhoto,
        degreePhoto: formData.degreePhoto,
      };

      const { data, error } = await supabase.functions.invoke(
        "generate-studentStatus-pdf",
        {
          body: pdfData,
        }
      );

      if (error) throw error;

      // 下载PDF
      const blob = await fetch(`data:application/pdf;base64,${data.pdf}`).then(
        (res) => res.blob()
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `学籍在线验证报告_${formData.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("学籍验证报告生成成功");
    } catch (error) {
      console.error("生成学籍验证报告失败:", error);
      toast.error("生成学籍验证报告失败，请重试");
    } finally {
      setIsGenerating(false);
      setShowLoadingDialog(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>教育部学籍在线验证报告</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !showForm ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                选择一条已有的学籍记录，或手动填写信息：
              </div>
              <Select onValueChange={handleRecordSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="选择学籍记录" />
                </SelectTrigger>
                <SelectContent>
                  {studentRecords.map((record) => (
                    <SelectItem key={record.id} value={record.id}>
                      {record.school} - {record.major}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowForm(true)}
              >
                手动填写
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">性别 *</Label>
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
                  <Label htmlFor="nationality">民族 *</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) =>
                      setFormData({ ...formData, nationality: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="school">学校名称 *</Label>
                  <Input
                    id="school"
                    value={formData.school}
                    onChange={(e) =>
                      setFormData({ ...formData, school: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="degreeLevel">层次 *</Label>
                  <Input
                    id="degreeLevel"
                    value={formData.degreeLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, degreeLevel: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major">专业 *</Label>
                  <Input
                    id="major"
                    value={formData.major}
                    onChange={(e) =>
                      setFormData({ ...formData, major: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">学制 *</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="educationType">学历类别 *</Label>
                  <Input
                    id="educationType"
                    value={formData.educationType}
                    onChange={(e) =>
                      setFormData({ ...formData, educationType: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studyType">学习形式 *</Label>
                  <Input
                    id="studyType"
                    value={formData.studyType}
                    onChange={(e) =>
                      setFormData({ ...formData, studyType: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">分院系所 *</Label>
                  <Input
                    id="branch"
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>入学日期 *</Label>
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
                  <Label htmlFor="status">学籍状态 *</Label>
                  <Input
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>离校日期 *</Label>
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
                  <Label htmlFor="admissionPhoto">录取证件照（不要求底色） *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="admissionPhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file, "admissionPhoto");
                      }}
                    />
                    {formData.admissionPhoto && (
                      <img
                        src={formData.admissionPhoto}
                        alt="录取照片预览"
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="degreePhoto">毕业学历证件照（一般要求蓝底） *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="degreePhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file, "degreePhoto");
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
    </>
  );
};

export default StudentStatusDialog;
