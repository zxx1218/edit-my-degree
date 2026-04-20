import { useNavigate } from "react-router-dom";
import { ChevronLeft, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

const MaintenanceNotice = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium">系统提示</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Wrench className="w-12 h-12 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground">
            模块正在维护
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-base leading-relaxed">
            验证报告功能正在进行系统升级和维护，即将重新开放。
            <br />
            给您带来的不便，敬请谅解！
          </p>

          {/* Additional Info */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>预计恢复时间：待定</p>
            <p className="mt-2">如有紧急需求，请联系客服</p>
          </div>

          {/* Back Button */}
          <Button
            className="w-full mt-8 h-[53px] text-base rounded-[2px]"
            onClick={() => navigate(-1)}
          >
            返回上一页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceNotice;
