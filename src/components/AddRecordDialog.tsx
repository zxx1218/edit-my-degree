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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { DEGREE_LEVELS, DegreeLevel, DEGREE_TYPES, DegreeType } from "@/lib/educationSort";

interface AddRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (level: DegreeLevel | DegreeType) => void;
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

  const handleConfirm = () => {
    onConfirm(selectedLevel);
    onOpenChange(false);
  };
  
  const options = isDegree ? DEGREE_TYPES : DEGREE_LEVELS;
  const label = isDegree ? "学位类型" : "学历层次";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>添加新{getTypeName(recordType)}</DialogTitle>
          <DialogDescription>
            请选择要添加的{label}，系统将按照正确顺序插入记录
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="degree-level">{label}</Label>
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
