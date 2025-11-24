import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface LoadingDialogProps {
  open: boolean;
  message?: string;
  description?: string;
}

const LoadingDialog = ({
  open,
  message = "正在生成报告",
  description = "请稍候，这可能需要几秒钟...",
}: LoadingDialogProps) => {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[400px] border-none shadow-2xl" hideClose>
        <div className="flex flex-col items-center justify-center gap-6 py-8">
          <div className="relative">
            <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 animate-pulse rounded-full bg-primary/20"></div>
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold text-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingDialog;
