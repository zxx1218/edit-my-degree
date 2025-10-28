import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FieldEditDialog from "@/components/FieldEditDialog";
import { updateData } from "@/lib/api";

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

  const [data, setData] = useState<ExamData>({
    name: "",
    school: "",
    year: "",
    photo: "",
    examLocation: "",
    registrationNumber: "",
    examUnit: "",
    department: "",
    major: "",
    researchDirection: "",
    examType: "",
    specialProgram: "",
    politicsName: "",
    politicsScore: "",
    foreignLanguageName: "",
    foreignLanguageScore: "",
    businessCourse1Name: "",
    businessCourse1Score: "",
    businessCourse2Name: "",
    businessCourse2Score: "",
    totalScore: "",
    admissionUnit: "",
    admissionMajor: "",
    note: "",
  });

  // 从数据库加载数据
  useEffect(() => {
    const loadData = async () => {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser || !id) return;
      const userId = JSON.parse(currentUser).id;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ userId }),
          }
        );

        const result = await response.json();
        const record = result.exam?.find((r: any) => r.id === id);
        
        if (record) {
          setData({
            name: record.name || "",
            school: record.school || "",
            year: record.year || "",
            photo: record.photo || "",
            examLocation: record.exam_location || "",
            registrationNumber: record.registration_number || "",
            examUnit: record.exam_unit || "",
            department: record.department || "",
            major: record.major || "",
            researchDirection: record.research_direction || "",
            examType: record.exam_type || "",
            specialProgram: record.special_program || "",
            politicsName: record.politics_name || "",
            politicsScore: record.politics_score || "",
            foreignLanguageName: record.foreign_language_name || "",
            foreignLanguageScore: record.foreign_language_score || "",
            businessCourse1Name: record.business_course1_name || "",
            businessCourse1Score: record.business_course1_score || "",
            businessCourse2Name: record.business_course2_name || "",
            businessCourse2Score: record.business_course2_score || "",
            totalScore: record.total_score || "",
            admissionUnit: record.admission_unit || "",
            admissionMajor: record.admission_major || "",
            note: record.note || "",
          });
        }
      } catch (error) {
        toast({
          title: "加载失败",
          description: "无法加载数据",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [id, toast]);
  const [editingField, setEditingField] = useState<{ field: keyof ExamData; label: string } | null>(null);

  const handleFieldClick = (field: keyof ExamData, label: string) => {
    setEditingField({ field, label });
  };

  const handleFieldSave = async (field: keyof ExamData, newValue: string) => {
    setData({ ...data, [field]: newValue });
    
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser || !id) return;
    const userId = JSON.parse(currentUser).id;
    
    try {
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      await updateData('exam', 'update', userId, { [dbField]: newValue }, id);
      
      toast({
        title: "保存成功",
        description: "信息已更新并同步到数据库",
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoData = reader.result as string;
        setData({ ...data, photo: photoData });
        
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser || !id) return;
        const userId = JSON.parse(currentUser).id;
        
        try {
          await updateData('exam', 'update', userId, { photo: photoData }, id);
          
          toast({
            title: "上传成功",
            description: "照片已更新并同步到数据库",
          });
        } catch (error) {
          toast({
            title: "上传失败",
            description: "请稍后重试",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium">考研信息</h1>
          <div className="w-10"></div>
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
              <div
                onClick={() => handleFieldClick("name", "姓名")}
                className="text-white text-xl font-medium cursor-pointer hover:opacity-80"
              >
                {data.name}
              </div>
            </div>
          </div>

          {/* School */}
          <div className="text-white">
            <div
              onClick={() => handleFieldClick("school", "学校名称")}
              className="text-2xl font-bold mb-3 cursor-pointer hover:opacity-80"
            >
              {data.school}
            </div>
          </div>

          {/* Year */}
          <div className="text-white">
            <div
              onClick={() => handleFieldClick("year", "年份")}
              className="text-xl cursor-pointer hover:opacity-80"
            >
              {data.year}
            </div>
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
              <span
                onClick={() => handleFieldClick(field, label)}
                className="flex-1 text-sm cursor-pointer hover:text-primary max-w-md"
              >
                {value}
              </span>
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
                <span
                  onClick={() => handleFieldClick(field, label)}
                  className="flex-1 text-sm cursor-pointer hover:text-primary max-w-md"
                >
                  {value}
                </span>
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
                <span
                  onClick={() => handleFieldClick(field, label)}
                  className="flex-1 text-sm cursor-pointer hover:text-primary max-w-md"
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="pt-4 pb-8">
          <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <span className="font-medium">说明：</span>
            <span
              onClick={() => handleFieldClick("note", "说明")}
              className="cursor-pointer hover:text-primary"
            >
              {data.note}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      {editingField && (
        <FieldEditDialog
          open={true}
          onOpenChange={(open) => !open && setEditingField(null)}
          label={editingField.label}
          value={data[editingField.field]}
          onSave={(newValue) => handleFieldSave(editingField.field, newValue)}
        />
      )}
    </div>
  );
};

export default ExamDetail;
