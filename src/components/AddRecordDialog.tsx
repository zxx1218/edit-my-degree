import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DEGREE_LEVELS, DegreeLevel, DEGREE_TYPES, DegreeType } from "@/lib/educationSort";

interface AddRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { level: DegreeLevel | DegreeType; school: string; major: string; studyType?: string }) => void;
  recordType: "student-status" | "education" | "degree";
}

const getTypeName = (type: string) => {
  switch (type) {
    case "student-status":
      return "学籍信息";
    case "education":
      return "学历信息";
    case "degree":
      return "学位信息";
    default:
      return "信息";
  }
};

const AddRecordDialog = ({
  open,
  onOpenChange,
  onConfirm,
  recordType,
}: AddRecordDialogProps) => {
  const isDegree = recordType === "degree";
  const [selectedLevel, setSelectedLevel] = useState<DegreeLevel | DegreeType>(
    isDegree ? "学士" : "本科"
  );
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [studyType, setStudyType] = useState("全日制");

  // 每次打开对话框时重置为默认值
  useEffect(() => {
    if (open) {
      setSelectedLevel(isDegree ? "学士" : "本科");
      setSchool("");
      setMajor("");
      setStudyType("全日制");
    }
  }, [open, isDegree]);

  // 根据学历层次自动填充学习形式
  useEffect(() => {
    if (isDegree) return; // 学位不需要学习形式
    
    let autoFillValue = "";
    
    if (selectedLevel === "本科" || selectedLevel === "专科") {
      autoFillValue = "普通全日制";
    } else if (selectedLevel === "博士研究生" || selectedLevel === "硕士研究生") {
      autoFillValue = "全日制";
    }
    // 其他情况（如自考本科）保持为空
    
    setStudyType(autoFillValue);
  }, [selectedLevel, isDegree]);

  const handleConfirm = () => {
    // 验证必填字段
    if (!school.trim()) {
      toast.error("请填写学校名称");
      return;
    }
    if (!major.trim()) {
      toast.error("请填写专业");
      return;
    }
    if (!isDegree && !studyType.trim()) {
      toast.error("请填写学习形式");
      return;
    }

    onConfirm({
      level: selectedLevel,
      school: school.trim(),
      major: major.trim(),
      studyType: isDegree ? undefined : studyType.trim()
    });
    onOpenChange(false);
  };
  
  const options = isDegree ? DEGREE_TYPES : DEGREE_LEVELS;
  const label = isDegree ? "学位类型" : "学历层次";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加新{getTypeName(recordType)}</DialogTitle>
          <DialogDescription>
            请填写要添加的{label}及相关信息
          </DialogDescription>
        </DialogHeader>


        <div className="space-y-4 py-4">
          {/* 学历/学位层次选择 */}
          <div className="space-y-2">
            <Label htmlFor="degree-level">{label} <span className="text-destructive">*</span></Label>
            <Select
              value={selectedLevel}
              defaultValue={selectedLevel}
              onValueChange={(value) => setSelectedLevel(value as DegreeLevel | DegreeType)}
            >
              <SelectTrigger id="degree-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 学校名称 */}
          <div className="space-y-2">
            <Label htmlFor="school">学校名称 <span className="text-destructive">*</span></Label>
            <Input
              id="school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="请输入学校名称"
            />
          </div>

          {/* 专业 */}
          <div className="space-y-2">
            <Label htmlFor="major">专业 <span className="text-destructive">*</span></Label>
            <Input
              id="major"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="请输入专业名称"
            />
          </div>

          {/* 学习形式（学位不需要） */}
          {!isDegree && (
            <div className="space-y-2">
              <Label htmlFor="studyType">学习形式 <span className="text-destructive">*</span></Label>
              <Input
                id="studyType"
                value={studyType}
                onChange={(e) => setStudyType(e.target.value)}
                placeholder="例如：全日制、非全日制"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认添加</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecordDialog;
