import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import FieldEditDialog from "@/components/FieldEditDialog";
import { updateData, getUserData } from "@/lib/api";

interface EducationData {
  name: string;
  gender: string;
  birthDate: string;
  school: string;
  major: string;
  studyType: string;
  degreeLevel: string;
  enrollmentDate: string;
  graduationDate: string;
  educationType: string;
  duration: string;
  graduationStatus: string;
  principalName: string;
  certificateNumber: string;
  photo: string;
}

const EducationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const photoRef = useRef<HTMLInputElement>(null);

  // 默认值
  const defaultData: EducationData = {
    name: "张三",
    gender: "男",
    birthDate: "1995-06-15",
    school: "示例大学",
    major: "计算机科学与技术",
    studyType: "普通全日制",
    degreeLevel: "本科",
    enrollmentDate: "2020-09-01",
    graduationDate: "2024-06-30",
    educationType: "普通高等教育",
    duration: "4年",
    graduationStatus: "毕业",
    principalName: "李校长",
    certificateNumber: "123456789012345678",
    photo: "",
  };

  const [data, setData] = useState<EducationData>(defaultData);

  // 从数据库加载数据
  useEffect(() => {
    const loadData = async () => {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser || !id) return;
      const userId = JSON.parse(currentUser).id;

      try {
        const result = await getUserData(userId);
        const record = result.education?.find((r: any) => r.id === id);
        
        if (record) {
          setData({
            name: record.name || defaultData.name,
            gender: record.gender || defaultData.gender,
            birthDate: record.birth_date || defaultData.birthDate,
            school: record.school || defaultData.school,
            major: record.major || defaultData.major,
            studyType: record.study_type || defaultData.studyType,
            degreeLevel: record.degree_level || defaultData.degreeLevel,
            enrollmentDate: record.enrollment_date || defaultData.enrollmentDate,
            graduationDate: record.graduation_date || defaultData.graduationDate,
            educationType: record.education_type || defaultData.educationType,
            duration: record.duration || defaultData.duration,
            graduationStatus: record.graduation_status || defaultData.graduationStatus,
            principalName: record.principal_name || defaultData.principalName,
            certificateNumber: record.certificate_number || defaultData.certificateNumber,
            photo: record.photo || defaultData.photo,
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
  const [editingField, setEditingField] = useState<{ field: keyof EducationData; label: string } | null>(null);

  const handleFieldClick = (field: keyof EducationData, label: string) => {
    setEditingField({ field, label });
  };

  const handleFieldSave = async (field: keyof EducationData, newValue: string) => {
    setData({ ...data, [field]: newValue });
    
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser || !id) return;
    const userId = JSON.parse(currentUser).id;
    
    try {
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      await updateData('education', 'update', userId, { [dbField]: newValue }, id);
      
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoData = reader.result as string;
        setData({ ...data, photo: photoData });
        
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser || !id) return;
        const userId = JSON.parse(currentUser).id;
        
        try {
          await updateData('education', 'update', userId, { photo: photoData }, id);
          
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
          <h1 className="text-lg font-medium">高等学历</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white min-h-screen">
        {/* Student Info Card */}
        <div className="bg-gradient-to-br from-[#5DADE2] to-[#3498DB] rounded-2xl p-6 text-white mb-6 relative">
          <div className="flex items-start gap-4 mb-6">
            {/* Photo */}
            <div className="text-center">
              <input
                type="file"
                ref={photoRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <div
                className="w-20 h-24 bg-white/20 rounded-lg mb-2 cursor-pointer hover:bg-white/30 transition-colors flex items-center justify-center overflow-hidden"
                onClick={() => photoRef.current?.click()}
              >
                {data.photo ? (
                  <img src={data.photo} alt="照片" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-white/60" />
                )}
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
              <div className="flex items-center gap-3">
                <span
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => handleFieldClick("gender", "性别")}
                >
                  {data.gender}
                </span>
                <span
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => handleFieldClick("birthDate", "出生日期")}
                >
                  {data.birthDate}
                </span>
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
              <div className="bg-white/25 backdrop-blur-sm px-4 py-1 rounded-full flex-shrink-0">
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
        <div className="space-y-3">
          {[
            { field: "enrollmentDate", label: "入学日期", value: data.enrollmentDate },
            { field: "graduationDate", label: "毕（结）业日期", value: data.graduationDate },
            { field: "educationType", label: "学历类别", value: data.educationType },
            { field: "duration", label: "学制", value: data.duration },
            { field: "graduationStatus", label: "毕（结）业", value: data.graduationStatus },
            { field: "principalName", label: "校（院）长姓名", value: data.principalName },
            { field: "certificateNumber", label: "证书编号", value: data.certificateNumber },
          ].map(({ field, label, value }) => (
            <div key={field} className="flex items-center justify-center gap-12 py-1">
              <span className="text-muted-foreground text-right w-32">{label}</span>
              <span
                className="font-medium cursor-pointer hover:text-primary flex-1 max-w-xs"
                onClick={() => handleFieldClick(field as keyof EducationData, label)}
              >
                {value || "-"}
              </span>
            </div>
          ))}
        </div>

        {/* Button */}
        <Button 
          className="w-full mt-6 h-14 text-lg bg-[#48C9B0] hover:bg-[#48C9B0]/90"
          onClick={() => navigate("/verification-report")}
        >
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

export default EducationDetail;
