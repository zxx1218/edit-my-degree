import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface StudentData {
  name: string;
  personalInfo: string;
  gender: string;
  birthDate: string;
  school: string;
  major: string;
  studyType: string;
  degreeLevel: string;
  nationality: string;
  idNumber: string;
  duration: string;
  educationType: string;
  branch: string;
  department: string;
  class: string;
  studentId: string;
  enrollmentDate: string;
  status: string;
  graduationDate: string;
  admissionPhoto: string;
  degreePhoto: string;
}

const StudentStatusDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const admissionPhotoRef = useRef<HTMLInputElement>(null);
  const degreePhotoRef = useRef<HTMLInputElement>(null);

  const initialData: StudentData = location.state?.record || {
    name: "朱晓煌",
    personalInfo: "男 1999年12月18日",
    gender: "男",
    birthDate: "1999年12月18日",
    school: "湖州师范学院",
    major: "计算机技术",
    studyType: "全日制",
    degreeLevel: "硕士研究生",
    nationality: "汉族",
    idNumber: "140105199912180817",
    duration: "3年",
    educationType: "普通高等教育",
    branch: "",
    department: "",
    class: "",
    studentId: "2022388441",
    enrollmentDate: "2022年09月03日",
    status: "不在籍（毕业）",
    graduationDate: "2025年06月13日",
    admissionPhoto: "",
    degreePhoto: "",
  };

  const [data, setData] = useState<StudentData>(initialData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const handleFieldClick = (field: keyof StudentData, value: string) => {
    setEditingField(field);
    setTempValue(value);
  };

  const handleFieldSave = (field: keyof StudentData) => {
    setData({ ...data, [field]: tempValue });
    setEditingField(null);
    toast({
      title: "修改成功",
      description: "信息已更新",
    });
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleImageUpload = (type: "admissionPhoto" | "degreePhoto", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData({ ...data, [type]: reader.result as string });
        toast({
          title: "上传成功",
          description: "照片已更新",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => navigate("/")} className="p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-[#48C9B0]" />

      {/* Header */}
      <div className="text-center py-6 border-b">
        <button onClick={() => navigate(-1)} className="absolute left-4 top-20">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">高等学籍</h1>
      </div>

      {/* Content */}
      <div className="p-4 bg-white min-h-screen">
        {/* Student Info Card */}
        <div className="bg-gradient-to-br from-[hsl(var(--student-status))] to-[hsl(var(--student-status-dark))] rounded-2xl p-6 text-white mb-6 relative">
          <div className="flex items-start gap-4 mb-6">
            {/* Photos */}
            <div className="flex gap-3">
              <div className="text-center">
                <input
                  type="file"
                  ref={admissionPhotoRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload("admissionPhoto", e)}
                />
                <div
                  className="w-20 h-24 bg-white/20 rounded-lg mb-2 cursor-pointer hover:bg-white/30 transition-colors flex items-center justify-center overflow-hidden"
                  onClick={() => admissionPhotoRef.current?.click()}
                >
                  {data.admissionPhoto ? (
                    <img src={data.admissionPhoto} alt="录取照片" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-6 h-6 text-white/60" />
                  )}
                </div>
                <span className="text-xs">录取照片</span>
              </div>
              <div className="text-center">
                <input
                  type="file"
                  ref={degreePhotoRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload("degreePhoto", e)}
                />
                <div
                  className="w-20 h-24 bg-blue-400 rounded-lg mb-2 cursor-pointer hover:bg-blue-500 transition-colors flex items-center justify-center overflow-hidden"
                  onClick={() => degreePhotoRef.current?.click()}
                >
                  {data.degreePhoto ? (
                    <img src={data.degreePhoto} alt="学历照片" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-6 h-6 text-white/80" />
                  )}
                </div>
                <span className="text-xs">学历照片</span>
              </div>
            </div>

            {/* Basic Info - Name and Personal Info */}
            <div className="flex-1">
              {editingField === "name" ? (
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={() => handleFieldSave("name")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFieldSave("name");
                    if (e.key === "Escape") handleFieldCancel();
                  }}
                  className="text-2xl font-bold mb-2 bg-white text-black"
                  autoFocus
                />
              ) : (
                <h2
                  className="text-2xl font-bold mb-2 cursor-pointer hover:opacity-80"
                  onClick={() => handleFieldClick("name", data.name)}
                >
                  {data.name}
                </h2>
              )}
              {editingField === "personalInfo" ? (
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={() => handleFieldSave("personalInfo")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFieldSave("personalInfo");
                    if (e.key === "Escape") handleFieldCancel();
                  }}
                  className="text-base bg-white text-black"
                  autoFocus
                />
              ) : (
                <div
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => handleFieldClick("personalInfo", data.personalInfo)}
                >
                  {data.personalInfo}
                </div>
              )}
            </div>
          </div>

          {/* School Info */}
          <div className="space-y-2">
            {editingField === "school" ? (
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleFieldSave("school")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFieldSave("school");
                  if (e.key === "Escape") handleFieldCancel();
                }}
                className="text-2xl font-bold bg-white text-black"
                autoFocus
              />
            ) : (
              <h3
                className="text-2xl font-bold cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("school", data.school)}
              >
                {data.school}
              </h3>
            )}
            <div className="flex items-center gap-4 text-base">
              {editingField === "major" ? (
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={() => handleFieldSave("major")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFieldSave("major");
                    if (e.key === "Escape") handleFieldCancel();
                  }}
                  className="bg-white text-black"
                  autoFocus
                />
              ) : (
                <span
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => handleFieldClick("major", data.major)}
                >
                  {data.major}
                </span>
              )}
              <span className="text-white/60">|</span>
              {editingField === "studyType" ? (
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={() => handleFieldSave("studyType")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFieldSave("studyType");
                    if (e.key === "Escape") handleFieldCancel();
                  }}
                  className="bg-white text-black"
                  autoFocus
                />
              ) : (
                <span
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => handleFieldClick("studyType", data.studyType)}
                >
                  {data.studyType}
                </span>
              )}
            </div>
          </div>

          <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full">
            {editingField === "degreeLevel" ? (
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleFieldSave("degreeLevel")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFieldSave("degreeLevel");
                  if (e.key === "Escape") handleFieldCancel();
                }}
                className="text-sm font-medium bg-white text-black h-7"
                autoFocus
              />
            ) : (
              <span
                className="text-sm font-medium cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("degreeLevel", data.degreeLevel)}
              >
                {data.degreeLevel}
              </span>
            )}
          </div>
        </div>

        {/* Detail Info */}
        <div className="space-y-3">
          {[
            { field: "nationality", label: "民族", value: data.nationality },
            { field: "idNumber", label: "证件号码", value: data.idNumber },
            { field: "duration", label: "学制", value: data.duration },
            { field: "educationType", label: "学历类别", value: data.educationType },
            { field: "branch", label: "分院", value: data.branch },
            { field: "department", label: "系所", value: data.department },
            { field: "class", label: "班级", value: data.class },
            { field: "studentId", label: "学号", value: data.studentId },
            { field: "enrollmentDate", label: "入学日期", value: data.enrollmentDate },
            { field: "status", label: "学籍状态", value: data.status },
            { field: "graduationDate", label: "离校日期", value: data.graduationDate },
          ].map(({ field, label, value }) => (
            <div key={field} className="flex items-center justify-center gap-12 py-1">
              <span className="text-muted-foreground text-right w-20 text-sm">{label}</span>
              {editingField === field ? (
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={() => handleFieldSave(field as keyof StudentData)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFieldSave(field as keyof StudentData);
                    if (e.key === "Escape") handleFieldCancel();
                  }}
                  className="font-medium flex-1 max-w-xs text-sm"
                  autoFocus
                />
              ) : (
                <span
                  className="font-medium cursor-pointer hover:text-primary flex-1 max-w-xs text-sm"
                  onClick={() => handleFieldClick(field as keyof StudentData, value)}
                >
                  {value || "-"}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Button */}
        <Button className="w-full mt-6 h-14 text-lg bg-[#48C9B0] hover:bg-[#48C9B0]/90">
          查看验证报告
        </Button>
      </div>
    </div>
  );
};

export default StudentStatusDetail;
