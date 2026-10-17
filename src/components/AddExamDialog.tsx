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
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface AddExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { school: string; year: string }) => void;
}

const AddExamDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: AddExamDialogProps) => {
  const [school, setSchool] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    if (open) {
      setSchool("");
      setYear(new Date().getFullYear().toString());
    }
  }, [open]);

  const handleConfirm = () => {
    if (!school.trim()) {
      toast.error("请填写读研学校名");
      return;
    }
    if (!year.trim()) {
      toast.error("请填写入学年份");
      return;
    }
    if (!/^\d{4}$/.test(year.trim())) {
      toast.error("入学年份格式不正确，请输入4位数字");
      return;
    }

    onConfirm({
      school: school.trim(),
      year: year.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加考研信息</DialogTitle>
          <DialogDescription>
            请填写您的读研学校名和入学年份
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="exam-school">读研学校名 <span className="text-destructive">*</span></Label>
            <Input
              id="exam-school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="请输入读研学校名称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam-year">入学年份 <span className="text-destructive">*</span></Label>
            <Input
              id="exam-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="例如：2024"
              maxLength={4}
            />
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

export default AddExamDialog;
