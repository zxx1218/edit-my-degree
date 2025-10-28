import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import FieldEditDialog from "@/components/FieldEditDialog";

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

  const initialData: DegreeData = location.state?.record || {
    name: "朱晓煌",
    gender: "男",
    birthDate: "1999年12月18日",
    school: "湖州师范学院",
    degreeType: "电子信息硕士专业学位",
    degreeLevel: "硕士",
    degreeDate: "2025年06月13日",
    major: "计算机技术",
    certificateNumber: "10347320255201162",
    photo: "",
  };

  const [data, setData] = useState<DegreeData>(initialData);
  const [editingField, setEditingField] = useState<{ field: keyof DegreeData; label: string } | null>(null);

  const handleFieldClick = (field: keyof DegreeData, label: string) => {
    setEditingField({ field, label });
  };

  const handleFieldSave = (field: keyof DegreeData, newValue: string) => {
    setData({ ...data, [field]: newValue });
    toast({
      title: "修改成功",
      description: "信息已更新",
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
          <button onClick={() => navigate(-1)} className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium">学位</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white min-h-screen">
        {/* Student Info Card */}
        <div className="bg-gradient-to-br from-[#5B7FDB] to-[#4A6BCF] rounded-2xl p-6 text-white mb-6 relative">
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
            <h3
              className="text-2xl font-bold cursor-pointer hover:opacity-80"
              onClick={() => handleFieldClick("school", "学校名称")}
            >
              {data.school}
            </h3>
            <div
              className="text-base cursor-pointer hover:opacity-80"
              onClick={() => handleFieldClick("degreeType", "学位类型")}
            >
              {data.degreeType}
            </div>
          </div>

          <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full">
            <span
              className="text-sm font-medium cursor-pointer hover:opacity-80"
              onClick={() => handleFieldClick("degreeLevel", "学位层次")}
            >
              {data.degreeLevel}
            </span>
          </div>
        </div>

        {/* Detail Info */}
        <div className="space-y-3">
          {[
            { field: "degreeDate", label: "获学位日期", value: data.degreeDate },
            { field: "major", label: "学科/专业", value: data.major },
            { field: "certificateNumber", label: "学位证书编号", value: data.certificateNumber },
          ].map(({ field, label, value }) => (
            <div key={field} className="flex items-center justify-center gap-8 py-1">
              <span className="text-muted-foreground text-right w-32">{label}</span>
              <span
                className="font-medium cursor-pointer hover:text-primary flex-1 max-w-xs"
                onClick={() => handleFieldClick(field as keyof DegreeData, label)}
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

export default DegreeDetail;
