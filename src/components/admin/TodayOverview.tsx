import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Loader2,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Monitor,
  User,
  Globe,
} from "lucide-react";

interface IncomeBreakdown {
  key: string;
  label: string;
  count: number;
  unitPrice: number;
  subtotal: number;
}

interface LoginTime {
  time: string;
  type: "normal" | "admin_impersonate" | "web_chsi";
}

interface LoginDetail {
  username: string;
  loginCount: number;
  loginTimes: LoginTime[];
}

interface TodayOverviewProps {
  // 登录统计
  todayLoginCount: number | null;
  distinctUsers: number | null;
  isLoadingLogin: boolean;
  onRefreshLogin: () => void;
  // 收入统计
  totalCards: number | null;
  totalIncome: number | null;
  breakdown: IncomeBreakdown[];
  isLoadingIncome: boolean;
  onRefreshIncome: () => void;
  // 登录详情
  loginDetails: LoginDetail[];
  isLoadingDetails: boolean;
  onRefreshDetails: () => void;
}

const TodayOverview = ({
  todayLoginCount,
  distinctUsers,
  isLoadingLogin,
  onRefreshLogin,
  totalCards,
  totalIncome,
  breakdown,
  isLoadingIncome,
  onRefreshIncome,
  loginDetails,
  isLoadingDetails,
  onRefreshDetails,
}: TodayOverviewProps) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const isLoading = isLoadingLogin || isLoadingIncome;
  const anyLoading = isLoading || isLoadingDetails;

  const handleRefreshAll = () => {
    onRefreshLogin();
    onRefreshIncome();
    if (detailsExpanded) onRefreshDetails();
  };

  return (
    <Card className="mb-6 shadow-xl border-2 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-emerald-950/30 border-indigo-200 dark:border-indigo-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-xl shadow-lg">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-slate-800 dark:text-slate-100">今日概览</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
                Today's Overview
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={handleRefreshAll}
            variant="outline"
            size="sm"
            disabled={anyLoading}
            className="border-2 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 h-10 px-4"
          >
            {anyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "刷新"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 第一行：登录统计 + 收入统计 四宫格 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 不同用户数 */}
          <div className="px-5 py-4 bg-white dark:bg-indigo-900/40 rounded-xl shadow border border-indigo-200 dark:border-indigo-700">
            {isLoadingLogin ? (
              <div className="animate-pulse">
                <div className="h-10 w-16 bg-indigo-200 dark:bg-indigo-700 rounded mb-2"></div>
                <div className="h-3 w-20 bg-indigo-100 dark:bg-indigo-800 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums mb-1">
                  {distinctUsers ?? "-"}
                </div>
                <div className="text-xs font-medium text-indigo-500 dark:text-indigo-400">不同用户数</div>
              </>
            )}
          </div>

          {/* 总登录次数 */}
          <div className="px-5 py-4 bg-white dark:bg-indigo-900/40 rounded-xl shadow border border-indigo-200 dark:border-indigo-700">
            {isLoadingLogin ? (
              <div className="animate-pulse">
                <div className="h-10 w-16 bg-indigo-200 dark:bg-indigo-700 rounded mb-2"></div>
                <div className="h-3 w-20 bg-indigo-100 dark:bg-indigo-800 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums mb-1">
                  {todayLoginCount ?? "-"}
                </div>
                <div className="text-xs font-medium text-indigo-500 dark:text-indigo-400">总登录次数</div>
              </>
            )}
          </div>

          {/* 今日收入 */}
          <div className="px-5 py-4 bg-white dark:bg-emerald-900/40 rounded-xl shadow border border-emerald-200 dark:border-emerald-700">
            {isLoadingIncome ? (
              <div className="animate-pulse">
                <div className="h-10 w-16 bg-emerald-200 dark:bg-emerald-700 rounded mb-2"></div>
                <div className="h-3 w-20 bg-emerald-100 dark:bg-emerald-800 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mb-1">
                  {totalIncome !== null ? `¥${totalIncome}` : "-"}
                </div>
                <div className="text-xs font-medium text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  今日收入(元)
                </div>
              </>
            )}
          </div>

          {/* 卡密使用数 */}
          <div className="px-5 py-4 bg-white dark:bg-amber-900/40 rounded-xl shadow border border-amber-200 dark:border-amber-700">
            {isLoadingIncome ? (
              <div className="animate-pulse">
                <div className="h-10 w-16 bg-amber-200 dark:bg-amber-700 rounded mb-2"></div>
                <div className="h-3 w-20 bg-amber-100 dark:bg-amber-800 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums mb-1">
                  {totalCards ?? "-"}
                </div>
                <div className="text-xs font-medium text-amber-500 dark:text-amber-400">卡密使用数</div>
              </>
            )}
          </div>
        </div>

        {/* 卡密明细（有数据时展示） */}
        {breakdown.length > 0 && (
          <div className="px-4 py-3 bg-white/70 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">卡密明细</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {breakdown.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg"
                >
                  <div>
                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{item.label}</span>
                    <span className="text-xs text-emerald-500 dark:text-emerald-400 ml-1.5">x{item.count}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">¥{item.subtotal}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 今日登录详情 - 可展开 */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => {
              setDetailsExpanded(!detailsExpanded);
              if (!detailsExpanded && loginDetails.length === 0) {
                onRefreshDetails();
              }
            }}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                今日登录详情
              </span>
              <Badge variant="secondary" className="text-xs h-5">
                {loginDetails.length} 个用户
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {detailsExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefreshDetails();
                  }}
                  disabled={isLoadingDetails}
                  className="h-7 px-2 text-xs"
                >
                  {isLoadingDetails ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3 w-3" />
                  )}
                </Button>
              )}
              {detailsExpanded ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </button>

          {detailsExpanded && (
            <div className="px-4 py-3 bg-white dark:bg-slate-900/50">
              {isLoadingDetails ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : loginDetails.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {loginDetails.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-800/50 dark:to-indigo-900/20 rounded-lg border border-slate-100 dark:border-slate-700"
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                            {record.username}
                          </span>
                          <Badge variant="secondary" className="text-xs h-5">
                            登录 {record.loginCount} 次
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {record.loginTimes?.map((item, timeIndex) => {
                            if (!item || typeof item !== "object") return null;
                            const timeStr = typeof item.time === "string" ? item.time : String(item.time || "");
                            const itemType = item.type || "normal";

                            return (
                              <span
                                key={timeIndex}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md"
                                style={{
                                  backgroundColor:
                                    itemType === "admin_impersonate"
                                      ? "rgba(239, 68, 68, 0.1)"
                                      : itemType === "web_chsi"
                                        ? "rgba(16, 185, 129, 0.1)"
                                        : "rgba(99, 102, 241, 0.1)",
                                  color:
                                    itemType === "admin_impersonate"
                                      ? "rgb(239, 68, 68)"
                                      : itemType === "web_chsi"
                                        ? "rgb(16, 185, 129)"
                                        : "rgb(99, 102, 241)",
                                }}
                              >
                                {itemType === "admin_impersonate" ? (
                                  <>
                                    <User className="h-3 w-3" />
                                    <span>{timeStr}</span>
                                    <span className="text-[10px] opacity-70">管理员代登</span>
                                  </>
                                ) : itemType === "web_chsi" ? (
                                  <>
                                    <Globe className="h-3 w-3" />
                                    <span>{timeStr}</span>
                                    <span className="text-[10px] opacity-70">学信网</span>
                                  </>
                                ) : (
                                  <>
                                    <Monitor className="h-3 w-3" />
                                    <span>{timeStr}</span>
                                  </>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  今日暂无登录记录
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayOverview;
