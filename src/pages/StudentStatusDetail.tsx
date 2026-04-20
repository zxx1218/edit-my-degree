import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import FieldEditDialog from "@/components/FieldEditDialog";
import { updateData, getUserData } from "@/lib/api";
import { compressImage } from "@/lib/utils"; // Import compressImage utility

// Long press hook
const useLongPress = (onLongPress: () => void, delay = 500) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
  };
};

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

// Long press field component for detail list items
interface LongPressFieldProps {
  field: keyof StudentData;
  label: string;
  value: string;
  onLongPress: (field: keyof StudentData, label: string) => void;
}

const LongPressField = ({ field, label, value, onLongPress }: LongPressFieldProps) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(() => {
      onLongPress(field, label);
    }, 500);
  }, [field, label, onLongPress]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <div className="text-base flex items-center gap-4 py-0.5">
      <span className="text-right w-32 flex-shrink-0" style={{ color: 'rgb(153, 152, 153)' }}>{label}</span>
      <span
        className="flex-1 select-none"
        style={{ color: 'rgb(52, 51, 51)' }}
        onMouseDown={start}
        onMouseUp={clear}
        onMouseLeave={clear}
        onTouchStart={start}
        onTouchEnd={clear}
        onTouchMove={clear}
      >
        {value}
      </span>
    </div>
  );
};

const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const normalized = dateStr.replace(/-/g, "/");
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const getGraduationLabel = (graduationDateStr: string): string => {
  const graduationDate = parseDateString(graduationDateStr);
  if (!graduationDate) {
    return "离校日期";
  }

  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return graduationDate.getTime() > todayDateOnly.getTime() ? "预计毕业日期" : "离校日期";
};

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
    status: "在籍（注册学籍）",
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

  const handleFieldClick = useCallback((field: keyof StudentData, label: string) => {
    setEditingField({ field, label });
  }, []);

  // Long press handlers for each editable field
  const nameLongPress = useLongPress(() => handleFieldClick("name", "姓名"));
  const personalInfoLongPress = useLongPress(() => handleFieldClick("personalInfo", "个人信息"));
  const schoolLongPress = useLongPress(() => handleFieldClick("school", "学校名称"));
  const majorLongPress = useLongPress(() => handleFieldClick("major", "专业"));
  const studyTypeLongPress = useLongPress(() => handleFieldClick("studyType", "学习形式"));

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
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "格式错误",
        description: "请选择有效的图片文件",
        variant: "destructive",
      });
      return;
    }

    try {
      // Log user info and file details
      const currentUser = localStorage.getItem("currentUser");
      if (currentUser) {
        const user = JSON.parse(currentUser);
        console.log(`用户 ${user.name || user.id} 正在上传${type === 'admissionPhoto' ? '录取' : '学历'}照片，文件名: ${file.name}`);
      }
      
      // Compress image if needed
      const compressedPhotoData = await compressImage(file);
      setData({ ...data, [type]: compressedPhotoData });

      const userId = JSON.parse(currentUser!).id;

      try {
        const dbField = type
          .replace(/([A-Z])/g, "_$1")
          .toLowerCase()
          .replace(/^_/, "");
        await updateData("student_status", "update", userId, { [dbField]: compressedPhotoData }, id);

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
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "处理失败",
        description: "图片处理过程中出现错误，请重试",
        variant: "destructive",
      });
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
        <div className="bg-gradient-to-b from-[rgb(31,174,127)] to-[rgb(61,203,145)] rounded-[7px] p-5 text-white mb-6 shadow-[0px_4px_4px_3px_rgba(98,191,207,0.2)]">
          <div className="flex items-start gap-4 mb-3">
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
                  className="w-[55px] h-[73px] bg-white/20 rounded-[8px] mb-1 cursor-pointer hover:bg-white/30 transition-colors flex items-center justify-center overflow-hidden"
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
                  className="w-[55px] h-[73px] bg-gray-300 rounded-[8px] mb-1 cursor-pointer hover:bg-gray-400 transition-colors flex items-center justify-center overflow-hidden relative"
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
                className="text-xl mb-2 cursor-pointer hover:opacity-80 select-none"
                {...nameLongPress}
              >
                {data.name}
              </h2>
              <div
                className="text-sm cursor-pointer hover:opacity-80 select-none"
                {...personalInfoLongPress}
              >
                {data.personalInfo.replace(/\s/g, "\u00A0")}
              </div>
            </div>
          </div>

          {/* School Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3
                className="text-[1.3rem] cursor-pointer hover:opacity-80 select-none"
                {...schoolLongPress}
              >
                {data.school}
              </h3>
              <div className="bg-black/20 backdrop-blur-sm px-2 py-0.4 rounded-full text-sm font-normal flex items-center gap-2 flex-shrink-0">
                {data.degreeLevel}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="cursor-pointer hover:opacity-80 select-none" {...majorLongPress}>
                {data.major}
              </span>
              <span
                className="text-white/60"
                style={{ height: "1rem", borderLeft: "1px solid rgba(255, 255, 255, 0.6)" }}
              ></span>
              <span
                className="cursor-pointer hover:opacity-80 select-none"
                {...studyTypeLongPress}
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
              label: getGraduationLabel(data.graduationDate),
              value: data.graduationDate,
            },
          ].map(({ field, label, value }) => (
            <LongPressField
              key={field}
              field={field as keyof StudentData}
              label={label}
              value={value || "-"}
              onLongPress={handleFieldClick}
            />
          ))}
        </div>

        {/* Button */}
        <Button
          className="w-full mt-6 h-[53px] text-base rounded-[2px] bg-[rgb(38,184,135)] hover:bg-[rgb(38,184,135)]/90"
          onClick={() => {
            const reportIsOpen = import.meta.env.VITE_REPORT_IS_OPEN !== 'false';
            navigate(reportIsOpen ? "/verification-report" : "/maintenance-notice");
          }}
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
