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
      <DialogContent className="sm:max-w-[450px] border-none shadow-2xl" hideClose>
        <div className="flex flex-col items-center justify-center gap-8 py-10">
          <div className="relative w-32 h-32">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary"></div>
            
            {/* Middle pulsing ring */}
            <div className="absolute inset-4 rounded-full border-2 border-primary/20"></div>
            <div className="absolute inset-4 animate-ping rounded-full border-2 border-primary/40"></div>
            
            {/* Inner glowing circle */}
            <div className="absolute inset-8 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/20 animate-pulse"></div>
              <div className="absolute h-6 w-6 rounded-full bg-primary animate-pulse"></div>
            </div>
            
            {/* Rotating dots */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary"></div>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary/60"></div>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '2s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary/30"></div>
            </div>
          </div>
          
          <div className="text-center space-y-3 max-w-sm">
            <p className="text-2xl font-bold text-foreground animate-pulse">{message}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            
            {/* Progress dots */}
            <div className="flex justify-center gap-2 pt-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingDialog;
