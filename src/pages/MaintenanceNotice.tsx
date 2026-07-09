import { useNavigate } from "react-router-dom";
import { ChevronLeft, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MaintenanceNotice = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">温馨提示</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-8">
          {/* Icon with Animation */}
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/50 dark:ring-slate-800/50">
              <AlertCircle className="w-14 h-14 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              本周报告库存已经用尽
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto rounded-full"></div>
          </div>

          {/* Main Message Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            {/* Message Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 text-lg">📢</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                    积分卡密<span style={{ color: '#25b887' }} className="font-semibold">每周限量发售</span>！
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 leading-relaxed">
                    本周的报告库存已经用尽，敬请谅解！
                  </p>
                </div>
              </div>
            </div>

            {/* Time Info Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-t border-gray-100 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">重新发卡时间</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">下周一 0:00</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-[52px] leading-relaxed">
                如有需要，请届时关注更新！
              </p>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                  建议设置提醒，准时抢购卡密，避免错过哦~
                </p>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <Button
            className="w-full h-[52px] text-base font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
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