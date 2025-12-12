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
    name: "浆果儿",
    personalInfo: "女    2002年12月17日",
    gender: "女",
    birthDate: "2002年12月17日",
    school: "清华大学",
    major: "经济与金融",
    studyType: "普通全日制",
    degreeLevel: "本科",
    status: "在集（注册学籍）",
    nationality: "汉族",
    idNumber: "110101200212090000",
    enrollmentDate: "2021年09月01日",
    graduationDate: "2025年06月30日",
    duration: "4 年",
    educationType: "普通高等教育",
    branch: "经济管理学院",
    department: "经济系",
    class: "20214102",
    studentId: "2021320413",
    admissionPhoto: "",
    degreePhoto: "",
  };

  const [data, setData] = useState<StudentData>(defaultData);

  // 从数据库加载数据
  useEffect(() => {
    const loadData = async () => {
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser || !id) return;
      const userId = JSON.parse(currentUser).id;

      // 优先使用从 Index 页面传递的 detailRecord
      const detailRecord = location.state?.detailRecord;
      if (detailRecord) {
        setData({
          name: detailRecord.name || defaultData.name,
          personalInfo: detailRecord.personal_info || defaultData.personalInfo,
          gender: detailRecord.gender || defaultData.gender,
          birthDate: detailRecord.birth_date || defaultData.birthDate,
          school: detailRecord.school || defaultData.school,
          major: detailRecord.major || defaultData.major,
          studyType: detailRecord.study_type || defaultData.studyType,
          degreeLevel: detailRecord.degree_level || defaultData.degreeLevel,
          status: detailRecord.status || defaultData.status,
          nationality: detailRecord.nationality || defaultData.nationality,
          idNumber: detailRecord.id_number || defaultData.idNumber,
          enrollmentDate: detailRecord.enrollment_date || defaultData.enrollmentDate,
          graduationDate: detailRecord.graduation_date || defaultData.graduationDate,
          duration: detailRecord.duration || defaultData.duration,
          educationType: detailRecord.education_type || defaultData.educationType,
          branch: detailRecord.branch || defaultData.branch,
          department: detailRecord.department || defaultData.department,
          class: detailRecord.class || defaultData.class,
          studentId: detailRecord.student_id || defaultData.studentId,
          admissionPhoto: detailRecord.admission_photo || defaultData.admissionPhoto,
          degreePhoto: detailRecord.degree_photo || defaultData.degreePhoto,
        });
        return;
      }

      // 如果没有传递 detailRecord，则从数据库加载
      try {
        const result = await getUserData(userId);
        const record = result.studentStatus?.find((r: any) => r.id === id);

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
        console.error("Error loading data:", error);
        toast({
          title: "加载失败",
          description: "无法加载数据，使用默认值",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [id, toast, location.state]);
  const [editingField, setEditingField] = useState<{ field: keyof StudentData; label: string } | null>(null);

  const handleFieldClick = (field: keyof StudentData, label: string) => {
    setEditingField({ field, label });
  };

  const handleFieldSave = async (field: keyof StudentData, newValue: string) => {
    setData({ ...data, [field]: newValue });

    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser || !id) return;
    const userId = JSON.parse(currentUser).id;

    try {
      // Convert camelCase to snake_case for database
      const dbField = field
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");

      // Prepare update data
      let updatePayload: any = { [dbField]: newValue };

      // Special handling for personalInfo field
      if (field === "personalInfo") {
        // Parse personalInfo to extract gender and birth_date
        const parts = newValue.split(" | ");
        if (parts.length >= 2) {
          updatePayload.gender = parts[0].trim();
          updatePayload.birth_date = parts[1].trim();
        }
      }

      await updateData("student_status", "update", userId, updatePayload, id);

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

        const currentUser = localStorage.getItem("currentUser");
        if (!currentUser || !id) return;
        const userId = JSON.parse(currentUser).id;

        try {
          const dbField = type
            .replace(/([A-Z])/g, "_$1")
            .toLowerCase()
            .replace(/^_/, "");
          await updateData("student_status", "update", userId, { [dbField]: photoData }, id);

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
          <button onClick={() => navigate("/")} className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium">高等学籍</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white min-h-screen">
        {/* Student Info Card */}
        <div className="bg-gradient-to-b from-[rgb(31,174,127)] to-[rgb(61,203,145)] rounded-[5px] p-5 text-white mb-6 shadow-[0px_4px_4px_3px_rgba(98,191,207,0.2)]">
          <div className="flex items-start gap-4 mb-5">
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
                  className="w-[60px] h-[80px] bg-white/20 rounded-[8px] mb-2 cursor-pointer hover:bg-white/30 transition-colors flex items-center justify-center overflow-hidden"
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
                  className="w-[60px] h-[80px] bg-gray-300 rounded-[8px] mb-2 cursor-pointer hover:bg-gray-400 transition-colors flex items-center justify-center overflow-hidden relative"
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
                className="text-xl mb-2 cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("name", "姓名")}
              >
                {data.name}
              </h2>
              <div
                className="text-sm cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("personalInfo", "个人信息")}
              >
                {data.personalInfo.replace(/\s/g, "\u00A0")}
              </div>
            </div>
          </div>

          {/* School Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h3
                className="text-xl font-bold cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("school", "学校名称")}
              >
                {data.school}
              </h3>
              <div
                className="bg-black/20 backdrop-blur-sm px-3 py-0.5 rounded-full text-sm font-normal flex items-center gap-2 flex-shrink-0 cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("degreeLevel", "学位层次")}
              >
                {data.degreeLevel}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="cursor-pointer hover:opacity-80" onClick={() => handleFieldClick("major", "专业")}>
                {data.major}
              </span>
              <span className="text-white/60" style={{ height: '1rem', borderLeft: '1px solid rgba(255, 255, 255, 0.6)' }}></span>
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
            {
              field: "graduationDate",
              label: data.graduationDate && new Date(data.graduationDate) > new Date() ? "预计毕业日期" : "离校日期",
              value: data.graduationDate,
            },
          ].map(({ field, label, value }) => (
            <div key={field} className="text-sm flex items-center gap-4 py-1">
              <span className="text-muted-foreground text-right w-32 flex-shrink-0">{label}</span>
              <span
                className="flex-1 cursor-pointer hover:text-primary"
                onClick={() => handleFieldClick(field as keyof StudentData, label)}
              >
                {value || "-"}
              </span>
            </div>
          ))}
        </div>

        {/* Button */}
        <Button
          className="w-full mt-6 h-[53px] text-base rounded-[2px] bg-[rgb(38,184,135)] hover:bg-[rgb(38,184,135)]/90"
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

export default StudentStatusDetail;
