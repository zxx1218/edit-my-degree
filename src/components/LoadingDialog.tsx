import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";

interface LoadingDialogProps {
  open: boolean;
  message?: string;
  description?: string;
}

const loadingMessages = [
  "正在初始化PDF生成引擎...",
  "正在验证数据完整性...",
  "正在处理图片资源...",
  "正在生成PDF文档结构...",
  "正在优化文件大小...",
  "正在进行最终检查...",
  "即将完成，请稍候...",
  "即将完成，请稍候..."
];

const LoadingDialog = ({
  open,
  message = "正在生成报告",
  description = "请稍候，这可能需要 5-10 秒钟...",
}: LoadingDialogProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState("opacity-100");

  useEffect(() => {
    if (!open) {
      setCurrentMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      // 先淡出
      setFadeClass("opacity-0");
      
      setTimeout(() => {
        // 切换消息
        setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        // 再淡入
        setFadeClass("opacity-100");
      }, 300);
    }, 1500);

    return () => clearInterval(interval);
  }, [open]);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[450px] border-none shadow-2xl" hideClose>
        <DialogHeader className="sr-only">
          <DialogTitle>{message}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-6 py-8">
          {/* 旋转的加载动画 */}
          <div className="relative">
            <div className="h-24 w-24 animate-spin rounded-full border-4 border-primary/30 border-t-primary"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 animate-pulse rounded-full bg-primary/10"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-ping rounded-full bg-primary/20"></div>
            </div>
          </div>
          
          {/* 主标题 */}
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold text-foreground">{message}</p>
            
            {/* 滚动的提示文字 */}
            <div className="h-6 overflow-hidden">
              <p 
                className={`text-sm text-muted-foreground transition-opacity duration-300 ease-in-out ${fadeClass}`}
              >
                {loadingMessages[currentMessageIndex]}
              </p>
            </div>
            
            {/* 进度点动画 */}
            <div className="flex justify-center gap-1 pt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingDialog;
