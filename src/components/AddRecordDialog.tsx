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
import { DEGREE_LEVELS, DegreeLevel } from "@/lib/educationSort";

interface AddRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (degreeLevel: DegreeLevel) => void;
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
  const [selectedLevel, setSelectedLevel] = useState<DegreeLevel>("本科");

  const handleConfirm = () => {
    onConfirm(selectedLevel);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>添加新{getTypeName(recordType)}</DialogTitle>
          <DialogDescription>
            请选择要添加的学历层次，系统将按照正确顺序插入记录
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="degree-level">学历层次</Label>
            <Select
              value={selectedLevel}
              onValueChange={(value) => setSelectedLevel(value as DegreeLevel)}
            >
              <SelectTrigger id="degree-level">
                <SelectValue placeholder="请选择学历层次" />
              </SelectTrigger>
              <SelectContent>
                {DEGREE_LEVELS.map((level) => (
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
