import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useEducation } from "@/contexts/EducationContext";

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
  const { degreeRecords, updateRecord } = useEducation();
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

  // 从context同步数据
  useEffect(() => {
    const record = degreeRecords.find(r => r.id === id);
    if (record) {
      setData(prev => ({ ...prev, ...record }));
    }
  }, [id, degreeRecords]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const handleFieldClick = (field: keyof DegreeData, value: string) => {
    setEditingField(field);
    setTempValue(value);
  };

  const handleFieldSave = (field: keyof DegreeData) => {
    const updatedData = { ...data, [field]: tempValue };
    setData(updatedData);
    setEditingField(null);
    if (id) {
      updateRecord(id, "degree", updatedData);
    }
    toast({
      title: "修改成功",
      description: "信息已更新",
    });
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedData = { ...data, photo: reader.result as string };
        setData(updatedData);
        if (id) {
          updateRecord(id, "degree", updatedData);
        }
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

      {/* Header */}
      <div className="text-center py-6 border-b">
        <button onClick={() => navigate(-1)} className="absolute left-4 top-20">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">学位</h1>
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
              <div className="flex items-center gap-3">
                {editingField === "gender" ? (
                  <Input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => handleFieldSave("gender")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFieldSave("gender");
                      if (e.key === "Escape") handleFieldCancel();
                    }}
                    className="text-base bg-white text-black w-16"
                    autoFocus
                  />
                ) : (
                  <span
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleFieldClick("gender", data.gender)}
                  >
                    {data.gender}
                  </span>
                )}
                {editingField === "birthDate" ? (
                  <Input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => handleFieldSave("birthDate")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFieldSave("birthDate");
                      if (e.key === "Escape") handleFieldCancel();
                    }}
                    className="text-base bg-white text-black"
                    autoFocus
                  />
                ) : (
                  <span
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleFieldClick("birthDate", data.birthDate)}
                  >
                    {data.birthDate}
                  </span>
                )}
              </div>
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
            {editingField === "degreeType" ? (
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleFieldSave("degreeType")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFieldSave("degreeType");
                  if (e.key === "Escape") handleFieldCancel();
                }}
                className="text-base bg-white text-black"
                autoFocus
              />
            ) : (
              <div
                className="text-base cursor-pointer hover:opacity-80"
                onClick={() => handleFieldClick("degreeType", data.degreeType)}
              >
                {data.degreeType}
              </div>
            )}
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
            { field: "degreeDate", label: "获学位日期", value: data.degreeDate },
            { field: "major", label: "学科/专业", value: data.major },
            { field: "certificateNumber", label: "学位证书编号", value: data.certificateNumber },
          ].map(({ field, label, value }) => (
            <div key={field} className="flex items-center justify-center gap-8 py-1">
              <span className="text-muted-foreground text-right w-32">{label}</span>
              {editingField === field ? (
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={() => handleFieldSave(field as keyof DegreeData)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFieldSave(field as keyof DegreeData);
                    if (e.key === "Escape") handleFieldCancel();
                  }}
                  className="font-medium flex-1 max-w-xs"
                  autoFocus
                />
              ) : (
                <span
                  className="font-medium cursor-pointer hover:text-primary flex-1 max-w-xs"
                  onClick={() => handleFieldClick(field as keyof DegreeData, value)}
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

export default DegreeDetail;
