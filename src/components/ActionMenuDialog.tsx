import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface ActionMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onAdd: () => void;
  onDelete: () => void;
  recordType: "student-status" | "education" | "degree" | "exam";
  showEdit?: boolean;
  showDelete?: boolean;
}

const getTypeName = (type: string) => {
  switch (type) {
    case "student-status":
      return "学籍信息";
    case "education":
      return "学历信息";
    case "degree":
      return "学位信息";
    case "exam":
      return "考研信息";
    default:
      return "信息";
  }
};

const ActionMenuDialog = ({
  open,
  onOpenChange,
  onEdit,
  onAdd,
  onDelete,
  recordType,
  showEdit = true,
  showDelete = true,
}: ActionMenuDialogProps) => {
  const typeName = getTypeName(recordType);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">选择操作</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            请选择要对该{typeName}进行的操作
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          {showEdit && (
            <Button
              onClick={() => {
                onEdit();
                onOpenChange(false);
              }}
              variant="outline"
              className="w-full justify-start gap-3 h-12"
            >
              <Edit2 className="w-5 h-5" />
              <span>编辑信息</span>
            </Button>
          )}
          
          <Button
            onClick={() => {
              onAdd();
              onOpenChange(false);
            }}
            variant="outline"
            className="w-full justify-start gap-3 h-12"
          >
            <Plus className="w-5 h-5" />
            <span>添加新{typeName}</span>
          </Button>
          
          {showDelete && (
            <Button
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
              variant="outline"
              className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-5 h-5" />
              <span>删除此条</span>
            </Button>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="w-full">取消</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ActionMenuDialog;
