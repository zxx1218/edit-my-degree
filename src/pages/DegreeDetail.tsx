import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import FieldEditDialog from "@/components/FieldEditDialog";
import { updateData, getUserData } from "@/lib/api";

interface DegreeData {
  name: string;
  gender: string;
  birthDate: string;
  school: string;
  degreeType: string;
  degreeLevel: string;
  degreeDate: string;
  major: string;
  certificateNumber: string;
  photo: string;
}

const DegreeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const photoRef = useRef<HTMLInputElement>(null);

  // 默认值
  const defaultData: DegreeData = {
    name: "浆果儿",
    gender: "女",
    birthDate: "2002年12月17日",
    school: "清华大学",
    degreeType: "经济学学士学位",
    degreeLevel: "学士",
    degreeDate: "2025年06月30日",
    major: "经济与金融",
    certificateNumber: "1000256789012345678",
    photo: "",
  };

  const [data, setData] = useState<DegreeData>(defaultData);

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
          gender: detailRecord.gender || defaultData.gender,
          birthDate: detailRecord.birth_date || defaultData.birthDate,
          school: detailRecord.school || defaultData.school,
          degreeType: detailRecord.degree_type || defaultData.degreeType,
          degreeLevel: detailRecord.degree_level || defaultData.degreeLevel,
          degreeDate: detailRecord.degree_date || defaultData.degreeDate,
          major: detailRecord.major || defaultData.major,
          certificateNumber: detailRecord.certificate_number || defaultData.certificateNumber,
          photo: detailRecord.photo || defaultData.photo,
        });
        return;
      }

      // 如果没有传递 detailRecord，则从数据库加载

      try {
        const result = await getUserData(userId);
        const record = result.degree?.find((r: any) => r.id === id);

        if (record) {
          setData({
            name: record.name || defaultData.name,
            gender: record.gender || defaultData.gender,
            birthDate: record.birth_date || defaultData.birthDate,
            school: record.school || defaultData.school,
            degreeType: record.degree_type || defaultData.degreeType,
            degreeLevel: record.degree_level || defaultData.degreeLevel,
            degreeDate: record.degree_date || defaultData.degreeDate,
            major: record.major || defaultData.major,
            certificateNumber: record.certificate_number || defaultData.certificateNumber,
            photo: record.photo || defaultData.photo,
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
  const [editingField, setEditingField] = useState<{ field: keyof DegreeData; label: string } | null>(null);

  const handleFieldClick = (field: keyof DegreeData, label: string) => {
    setEditingField({ field, label });
  };

  const handleFieldSave = async (field: keyof DegreeData, newValue: string) => {
    setData({ ...data, [field]: newValue });

    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser || !id) return;
    const userId = JSON.parse(currentUser).id;

    try {
      const dbField = field
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");
      await updateData("degree", "update", userId, { [dbField]: newValue }, id);

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

        const currentUser = localStorage.getItem("currentUser");
        if (!currentUser || !id) return;
        const userId = JSON.parse(currentUser).id;

        try {
          await updateData("degree", "update", userId, { photo: photoData }, id);

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
          <h1 className="text-base font-medium">学位</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white min-h-screen">
        {/* Student Info Card */}
        <div className="bg-gradient-to-b from-[rgb(56,80,218)] to-[rgb(86,126,231)] rounded-[5px] p-5 text-white mb-6 relative shadow-[0px_4px_4px_3px_rgba(98,191,207,0.2)]">
          <div className="flex items-start gap-4 mb-5">
            {/* Photo */}
            <div className="text-center">
              <input type="file" ref={photoRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <div
                className="w-[60px] h-[80px] bg-white/20 rounded-[8px] mb-2 cursor-pointer hover:bg-white/30 transition-colors flex items-center justify-center overflow-hidden"
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
                className="text-xl mb-2 cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("name", "姓名")}
              >
                {data.name}
              </h2>
              <div className="flex items-center gap-3 text-sm">
                <span className="cursor-pointer hover:opacity-80" onClick={() => handleFieldClick("gender", "性别")}>
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
              <span className="cursor-pointer hover:opacity-80" onClick={() => handleFieldClick("major", "学科/专业")}>
                {data.major}
              </span>
              <span className="text-white/60" style={{ height: '1rem', borderLeft: '1px solid rgba(255, 255, 255, 0.6)' }}></span>
              <span
                className="cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("degreeType", "学位类型")}
              >
                {data.degreeType}
              </span>
            </div>
          </div>
        </div>

        {/* Detail Info */}
        <div className="space-y-3">
          {[
            { field: "degreeDate", label: "获学位日期", value: data.degreeDate },
            { field: "major", label: "学科/专业", value: data.major },
            { field: "certificateNumber", label: "学位证书编号", value: data.certificateNumber },
          ].map(({ field, label, value }) => (
            <div key={field} className="flex items-center gap-4 py-1 text-sm">
              <span className="text-muted-foreground text-right w-32 flex-shrink-0">{label}</span>
              <span
                className="font-medium cursor-pointer hover:text-primary flex-1"
                onClick={() => handleFieldClick(field as keyof DegreeData, label)}
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

export default DegreeDetail;
