import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EducationRecord {
  id: string;
  school: string;
  major: string;
  studyType: string;
  degreeLevel: string;
}

interface EditEducationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: EducationRecord;
  onSave: (record: EducationRecord) => void;
}

const EditEducationDialog = ({
  open,
  onOpenChange,
  record,
  onSave,
}: EditEducationDialogProps) => {
  const [formData, setFormData] = useState(record);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑教育信息</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="school">学校名称</Label>
            <Input
              id="school"
              value={formData.school}
              onChange={(e) =>
                setFormData({ ...formData, school: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="major">专业</Label>
            <Input
              id="major"
              value={formData.major}
              onChange={(e) =>
                setFormData({ ...formData, major: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="studyType">学习形式</Label>
            <Select
              value={formData.studyType}
              onValueChange={(value) =>
                setFormData({ ...formData, studyType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="全日制">全日制</SelectItem>
                <SelectItem value="普通全日制">普通全日制</SelectItem>
                <SelectItem value="业余">业余</SelectItem>
                <SelectItem value="函授">函授</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="degreeLevel">学位层次</Label>
            <Select
              value={formData.degreeLevel}
              onValueChange={(value) =>
                setFormData({ ...formData, degreeLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="硕士研究生">硕士研究生</SelectItem>
                <SelectItem value="本科">本科</SelectItem>
                <SelectItem value="硕士">硕士</SelectItem>
                <SelectItem value="学士">学士</SelectItem>
                <SelectItem value="博士">博士</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEducationDialog;
