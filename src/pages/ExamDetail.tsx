import { useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ExamData {
  name: string;
  school: string;
  year: string;
  photo: string;
  examLocation: string;
  registrationNumber: string;
  examUnit: string;
  department: string;
  major: string;
  researchDirection: string;
  examType: string;
  specialProgram: string;
  politicsName: string;
  foreignLanguageName: string;
  businessCourse1Name: string;
  businessCourse2Name: string;
  politicsScore: string;
  foreignLanguageScore: string;
  businessCourse1Score: string;
  businessCourse2Score: string;
  totalScore: string;
  admissionUnit: string;
  admissionMajor: string;
  note: string;
}

const ExamDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialData: ExamData = location.state?.record || {
    name: "朱晓煌",
    school: "湖州师范学院",
    year: "2022",
    photo: "",
    examLocation: "3306",
    registrationNumber: "330695769",
    examUnit: "10337",
    department: "无",
    major: "085400",
    researchDirection: "无",
    examType: "全国统考",
    specialProgram: "非专项计划",
    politicsName: "思想政治理论",
    foreignLanguageName: "英语（二）",
    businessCourse1Name: "数学（二）",
    businessCourse2Name: "数据结构与计算机网络",
    politicsScore: "78",
    foreignLanguageScore: "60",
    businessCourse1Score: "57",
    businessCourse2Score: "109",
    totalScore: "304.0",
    admissionUnit: "湖州师范学院",
    admissionMajor: "电子信息",
    note: "系统提供2006年以来入学的硕士研究生报名和成绩数据。",
  };

  const [data, setData] = useState<ExamData>(initialData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");

  const handleFieldClick = (field: keyof ExamData) => {
    setEditingField(field);
    setTempValue(data[field]);
  };

  const handleFieldSave = (field: keyof ExamData) => {
    setData({ ...data, [field]: tempValue });
    setEditingField(null);
    toast({
      title: "保存成功",
      description: "信息已更新",
    });
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData({ ...data, photo: reader.result as string });
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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium">考研信息</h1>
          <Button variant="ghost" size="icon" className="h-9 w-9 invisible">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Photo and Name Card */}
        <div className="bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4 mb-6">
            {/* Photo */}
            <div className="text-center">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <div
                className="w-20 h-24 bg-white/20 rounded-lg mb-2 cursor-pointer hover:bg-white/30 transition-colors flex items-center justify-center overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {data.photo ? (
                  <img src={data.photo} alt="照片" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-white/60" />
                )}
              </div>
            </div>

            {/* Name */}
            <div className="flex-1 pt-2">
              {editingField === "name" ? (
                <div className="flex gap-2">
                  <Input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="bg-white/20 text-white border-white/30 placeholder:text-white/60"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleFieldSave("name")}
                    className="bg-white text-cyan-500 hover:bg-white/90"
                  >
                    保存
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleFieldCancel}
                    className="border-white text-white hover:bg-white/10"
                  >
                    取消
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => handleFieldClick("name")}
                  className="text-white text-xl font-medium cursor-pointer hover:opacity-80"
                >
                  {data.name}
                </div>
              )}
            </div>
          </div>

          {/* School */}
          <div className="text-white">
            {editingField === "school" ? (
              <div className="flex gap-2">
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="bg-white/20 text-white border-white/30 placeholder:text-white/60"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => handleFieldSave("school")}
                  className="bg-white text-cyan-500 hover:bg-white/90"
                >
                  保存
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFieldCancel}
                  className="border-white text-white hover:bg-white/10"
                >
                  取消
                </Button>
              </div>
            ) : (
              <div
                onClick={() => handleFieldClick("school")}
                className="text-2xl font-bold mb-3 cursor-pointer hover:opacity-80"
              >
                {data.school}
              </div>
            )}
          </div>

          {/* Year */}
          <div className="text-white">
            {editingField === "year" ? (
              <div className="flex gap-2">
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="bg-white/20 text-white border-white/30 placeholder:text-white/60"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => handleFieldSave("year")}
                  className="bg-white text-cyan-500 hover:bg-white/90"
                >
                  保存
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFieldCancel}
                  className="border-white text-white hover:bg-white/10"
                >
                  取消
                </Button>
              </div>
            ) : (
              <div
                onClick={() => handleFieldClick("year")}
                className="text-xl cursor-pointer hover:opacity-80"
              >
                {data.year}
              </div>
            )}
          </div>
        </div>

        {/* Detail Info */}
        <div className="space-y-3">
          {[
            { field: "examLocation" as keyof ExamData, label: "报考点", value: data.examLocation },
            { field: "registrationNumber" as keyof ExamData, label: "报名号", value: data.registrationNumber },
            { field: "examUnit" as keyof ExamData, label: "报考单位", value: data.examUnit },
            { field: "department" as keyof ExamData, label: "报考院系所", value: data.department },
            { field: "major" as keyof ExamData, label: "报考专业", value: data.major },
            { field: "researchDirection" as keyof ExamData, label: "研究方向", value: data.researchDirection },
            { field: "examType" as keyof ExamData, label: "考试方式", value: data.examType },
            { field: "specialProgram" as keyof ExamData, label: "专项计划", value: data.specialProgram },
            { field: "politicsName" as keyof ExamData, label: "政治理论名称", value: data.politicsName },
            { field: "foreignLanguageName" as keyof ExamData, label: "外国语名称", value: data.foreignLanguageName },
            { field: "businessCourse1Name" as keyof ExamData, label: "业务课一名称", value: data.businessCourse1Name },
            { field: "businessCourse2Name" as keyof ExamData, label: "业务课二名称", value: data.businessCourse2Name },
          ].map(({ field, label, value }) => (
            <div key={field} className="flex items-center justify-center gap-12 py-1">
              <span className="text-muted-foreground text-sm min-w-[120px] text-right">
                {label}
              </span>
              {editingField === field ? (
                <div className="flex-1 flex gap-2 max-w-md">
                  <Input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleFieldSave(field)}>
                    保存
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleFieldCancel}
                  >
                    取消
                  </Button>
                </div>
              ) : (
                <span
                  onClick={() => handleFieldClick(field)}
                  className="flex-1 text-sm cursor-pointer hover:text-primary max-w-md"
                >
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Scores Section */}
        <div className="pt-4">
          <h2 className="text-lg font-semibold mb-4">成绩信息</h2>
          <div className="space-y-3">
            {[
              { field: "politicsScore" as keyof ExamData, label: "政治理论", value: data.politicsScore },
              { field: "foreignLanguageScore" as keyof ExamData, label: "外国语", value: data.foreignLanguageScore },
              { field: "businessCourse1Score" as keyof ExamData, label: "业务课一", value: data.businessCourse1Score },
              { field: "businessCourse2Score" as keyof ExamData, label: "业务课二", value: data.businessCourse2Score },
              { field: "totalScore" as keyof ExamData, label: "总分", value: data.totalScore },
            ].map(({ field, label, value }) => (
              <div key={field} className="flex items-center justify-center gap-12 py-1">
                <span className="text-muted-foreground text-sm min-w-[120px] text-right">
                  {label}
                </span>
                {editingField === field ? (
                  <div className="flex-1 flex gap-2 max-w-md">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleFieldSave(field)}>
                      保存
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleFieldCancel}
                    >
                      取消
                    </Button>
                  </div>
                ) : (
                  <span
                    onClick={() => handleFieldClick(field)}
                    className="flex-1 text-sm cursor-pointer hover:text-primary max-w-md"
                  >
                    {value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Admission Section */}
        <div className="pt-4">
          <h2 className="text-lg font-semibold mb-4">录取信息</h2>
          <div className="space-y-3">
            {[
              { field: "admissionUnit" as keyof ExamData, label: "录取单位", value: data.admissionUnit },
              { field: "admissionMajor" as keyof ExamData, label: "录取专业", value: data.admissionMajor },
            ].map(({ field, label, value }) => (
              <div key={field} className="flex items-center justify-center gap-12 py-1">
                <span className="text-muted-foreground text-sm min-w-[120px] text-right">
                  {label}
                </span>
                {editingField === field ? (
                  <div className="flex-1 flex gap-2 max-w-md">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleFieldSave(field)}>
                      保存
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleFieldCancel}
                    >
                      取消
                    </Button>
                  </div>
                ) : (
                  <span
                    onClick={() => handleFieldClick(field)}
                    className="flex-1 text-sm cursor-pointer hover:text-primary max-w-md"
                  >
                    {value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="pt-4 pb-8">
          <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <span className="font-medium">说明：</span>
            {editingField === "note" ? (
              <div className="flex gap-2 mt-2">
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  autoFocus
                />
                <Button size="sm" onClick={() => handleFieldSave("note")}>
                  保存
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFieldCancel}
                >
                  取消
                </Button>
              </div>
            ) : (
              <span
                onClick={() => handleFieldClick("note")}
                className="cursor-pointer hover:text-primary"
              >
                {data.note}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamDetail;
