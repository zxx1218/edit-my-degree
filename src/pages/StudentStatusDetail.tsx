import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import FieldEditDialog from "@/components/FieldEditDialog";
import { updateData, getUserData } from "@/lib/api";

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

  // 默认值
  const defaultData: StudentData = {
    name: "张三",
    personalInfo: "男 | 1995年6月",
    gender: "男",
    birthDate: "1995-06-15",
    school: "示例大学",
    major: "计算机科学与技术",
    studyType: "普通全日制",
    degreeLevel: "本科",
    status: "在读",
    nationality: "汉族",
    idNumber: "110101199506150000",
    enrollmentDate: "2020-09-01",
    graduationDate: "2024-06-30",
    duration: "4年",
    educationType: "普通",
    branch: "信息学院",
    department: "计算机系",
    class: "2020级1班",
    studentId: "2020001001",
    admissionPhoto: "",
    degreePhoto: "",
  };

  const [data, setData] = useState<StudentData>(defaultData);

  // 从数据库加载数据
  useEffect(() => {
    const loadData = async () => {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser || !id) return;
      const userId = JSON.parse(currentUser).id;

      try {
        const result = await getUserData(userId);
        const record = result.studentStatus?.find((r: any) => r.id.toString() === id);

        if (record) {
          setData({
            name: record.name || defaultData.name,
            personalInfo: record.personal_info || defaultData.personalInfo,
            gender: record.gender || defaultData.gender,
            birthDate: record.birth_date || defaultData.birthDate,
            school: record.school || defaultData.school,
            major: record.major || defaultData.major,
            studyType: record.study_type || defaultData.studyType,
            degreeLevel: record.degree_level || defaultData.degreeLevel,
            status: record.status || defaultData.status,
            nationality: record.nationality || defaultData.nationality,
            idNumber: record.id_number || defaultData.idNumber,
            enrollmentDate: record.enrollment_date || defaultData.enrollmentDate,
            graduationDate: record.graduation_date || defaultData.graduationDate,
            duration: record.duration || defaultData.duration,
            educationType: record.education_type || defaultData.educationType,
            branch: record.branch || defaultData.branch,
            department: record.department || defaultData.department,
            class: record.class || defaultData.class,
            studentId: record.student_id || defaultData.studentId,
            admissionPhoto: record.admission_photo || defaultData.admissionPhoto,
            degreePhoto: record.degree_photo || defaultData.degreePhoto,
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "加载失败",
          description: "无法加载数据，使用默认值",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [id, toast]);
  const [editingField, setEditingField] = useState<{ field: keyof StudentData; label: string } | null>(null);

  const handleFieldClick = (field: keyof StudentData, label: string) => {
    setEditingField({ field, label });
  };

  const handleFieldSave = async (field: keyof StudentData, newValue: string) => {
    setData({ ...data, [field]: newValue });
    
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser || !id) return;
    const userId = JSON.parse(currentUser).id;
    
    try {
      // Convert camelCase to snake_case for database
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      await updateData('student_status', 'update', userId, { [dbField]: newValue }, id);
      
      toast({
        title: "修改成功",
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

  const handleImageUpload = async (type: "admissionPhoto" | "degreePhoto", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoData = reader.result as string;
        setData({ ...data, [type]: photoData });
        
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser || !id) return;
        const userId = JSON.parse(currentUser).id;
        
        try {
          const dbField = type.replace(/([A-Z])/g, '_$1').toLowerCase();
          await updateData('student_status', 'update', userId, { [dbField]: photoData }, id);
          
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
          <h1 className="text-lg font-medium">高等学籍</h1>
          <div className="w-10"></div>
        </div>
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
                  className="w-20 h-24 bg-gray-300 rounded-lg mb-2 cursor-pointer hover:bg-gray-400 transition-colors flex items-center justify-center overflow-hidden relative"
                  onClick={() => degreePhotoRef.current?.click()}
                >
                  {data.degreePhoto ? (
                    <img src={data.degreePhoto} alt="学历照片" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">?</span>
                      </div>
                    </>
                  )}
                </div>
                <span className="text-xs">学历照片</span>
              </div>
            </div>

            {/* Basic Info - Name and Personal Info */}
            <div className="flex-1">
              <h2
                className="text-2xl font-bold mb-2 cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("name", "姓名")}
              >
                {data.name}
              </h2>
              <div
                className="cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("personalInfo", "个人信息")}
              >
                {data.personalInfo}
              </div>
            </div>
          </div>

          {/* School Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h3
                className="text-2xl font-bold cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("school", "学校名称")}
              >
                {data.school}
              </h3>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full flex-shrink-0">
                <span
                  className="text-sm font-medium cursor-pointer hover:opacity-80"
                  onClick={() => handleFieldClick("degreeLevel", "学位层次")}
                >
                  {data.degreeLevel}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-base">
              <span
                className="cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("major", "专业")}
              >
                {data.major}
              </span>
              <span className="text-white/60">|</span>
              <span
                className="cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("studyType", "学习形式")}
              >
                {data.studyType}
              </span>
            </div>
          </div>
        </div>

        {/* Detail Info */}
        <div className="space-y-6">
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
            <div key={field} className="flex items-center justify-center gap-8 py-2">
              <span className="text-muted-foreground text-right w-24">{label}</span>
              <span
                className="font-medium cursor-pointer hover:text-primary flex-1 max-w-xs"
                onClick={() => handleFieldClick(field as keyof StudentData, label)}
              >
                {value || "-"}
              </span>
            </div>
          ))}
        </div>

        {/* Button */}
        <Button className="w-full mt-6 h-14 text-lg bg-[#48C9B0] hover:bg-[#48C9B0]/90">
          查看验证报告
        </Button>
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

export default StudentStatusDetail;
