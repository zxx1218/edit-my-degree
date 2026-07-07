import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Flame, CalendarIcon, RotateCcw, Loader2, Trophy } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface HeatmapDataItem {
  day: string;
  dayIndex: number;
  hour: number;
  hourLabel: string;
  loginCount: number;
  uniqueUsers: number;
}

interface HourlyStatItem {
  hour: number;
  hourLabel: string;
  totalLogins: number;
  uniqueUsers: number;
}

interface DailyStatItem {
  date: string;
  dateLabel: string;
  totalLogins: number;
  uniqueUsers: number;
}

interface RangeSummary {
  totalLogins: number;
  avgLogins: number;
  totalUniqueUsers: number;
  days: number;
}

interface TopActiveUser {
  id: string;
  username: string;
  totalLogins: number;
  activeDays: number;
  lastLogin: string;
  firstLoginInPeriod: string;
  avgLoginsPerDay: string;
}

interface StatsDashboardProps {
  // 热力图数据
  heatmapData: HeatmapDataItem[];
  isLoadingHeatmap: boolean;
  onRefreshHeatmap: () => void;
  // 登录统计图表数据
  hourlyStats: HourlyStatItem[];
  dailyStats: DailyStatItem[];
  rangeSummary: RangeSummary | null;
  isLoadingHourly: boolean;
  isLoadingRange: boolean;
  selectedDate: Date;
  statsViewMode: "day" | "week" | "month";
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: "day" | "week" | "month") => void;
  onRefreshChart: () => void;
  // Top活跃用户数据
  topUsers: TopActiveUser[];
  isLoadingTopUsers: boolean;
  topUsersPeriod: number;
  onTopUsersPeriodChange: (period: number) => void;
  onRefreshTopUsers: () => void;
}

const StatsDashboard = ({
  heatmapData,
  isLoadingHeatmap,
  onRefreshHeatmap,
  hourlyStats,
  dailyStats,
  rangeSummary,
  isLoadingHourly,
  isLoadingRange,
  selectedDate,
  statsViewMode,
  onDateChange,
  onViewModeChange,
  onRefreshChart,
  topUsers,
  isLoadingTopUsers,
  topUsersPeriod,
  onTopUsersPeriodChange,
  onRefreshTopUsers,
}: StatsDashboardProps) => {
  const [activeTab, setActiveTab] = useState("heatmap");

  const handleRefresh = () => {
    onRefreshHeatmap();
    onRefreshChart();
    onRefreshTopUsers();
  };

  const isLoading = isLoadingHeatmap || isLoadingHourly || isLoadingRange || isLoadingTopUsers;

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="h-5 w-5 text-primary" />
              用户统计分析
            </CardTitle>
            <CardDescription>查看用户活跃度热力图和登录统计趋势</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-11 mb-6">
            <TabsTrigger value="heatmap" className="text-sm">
              <Flame className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">活跃度热力图</span>
              <span className="sm:hidden">热力图</span>
            </TabsTrigger>
            <TabsTrigger value="chart" className="text-sm">
              <BarChart3 className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">登录统计图表</span>
              <span className="sm:hidden">统计</span>
            </TabsTrigger>
            <TabsTrigger value="topusers" className="text-sm">
              <Trophy className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Top活跃用户</span>
              <span className="sm:hidden">Top</span>
            </TabsTrigger>
          </TabsList>

          {/* 热力图分栏 */}
          <TabsContent value="heatmap" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  过去7天各时段登录密度分布
                </h3>
              </div>
              
              {isLoadingHeatmap ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : heatmapData.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1">
                      <div className="text-xs font-medium text-muted-foreground"></div>
                      {Array.from({ length: 24 }, (_, hour) => (
                        <div key={hour} className="text-xs text-center text-muted-foreground py-2">
                          {hour.toString().padStart(2, '0')}
                        </div>
                      ))}
                      
                      {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map((day, dayIndex) => (
                        <div key={day} className="contents">
                          <div className="text-xs font-medium text-muted-foreground flex items-center justify-end pr-2">
                            {day}
                          </div>
                          {Array.from({ length: 24 }, (_, hour) => {
                            const dataPoint = heatmapData.find(
                              d => d.dayIndex === dayIndex && d.hour === hour
                            );
                            const value = dataPoint?.loginCount || 0;
                            
                            let bgColor = 'bg-gray-100 dark:bg-gray-800';
                            if (value > 0) bgColor = 'bg-green-200 dark:bg-green-900/30';
                            if (value > 2) bgColor = 'bg-green-300 dark:bg-green-800/50';
                            if (value > 5) bgColor = 'bg-green-400 dark:bg-green-700/60';
                            if (value > 10) bgColor = 'bg-green-500 dark:bg-green-600/70';
                            if (value > 20) bgColor = 'bg-green-600 dark:bg-green-500/80';
                            
                            return (
                              <div
                                key={`${dayIndex}-${hour}`}
                                className={`aspect-square rounded ${bgColor} hover:ring-2 hover:ring-primary transition-all cursor-pointer relative group`}
                                title={`${day} ${hour.toString().padStart(2, '0')}:00 - 登录${value}次`}
                              >
                                {value > 0 && (
                                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    {value}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
                      <span className="text-xs text-muted-foreground">登录密度:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
                        <span className="text-xs">0</span>
                        <div className="w-4 h-4 bg-green-200 dark:bg-green-900/30 rounded"></div>
                        <span className="text-xs">1-2</span>
                        <div className="w-4 h-4 bg-green-400 dark:bg-green-700/60 rounded"></div>
                        <span className="text-xs">5-10</span>
                        <div className="w-4 h-4 bg-green-600 dark:bg-green-500/80 rounded"></div>
                        <span className="text-xs">20+</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  暂无热力图数据
                </div>
              )}
            </div>
          </TabsContent>

          {/* 登录统计图表分栏 */}
          <TabsContent value="chart" className="mt-0">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={statsViewMode === "day" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onViewModeChange("day")}
                  >
                    日视图
                  </Button>
                  <Button
                    variant={statsViewMode === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onViewModeChange("week")}
                  >
                    周视图
                  </Button>
                  <Button
                    variant={statsViewMode === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onViewModeChange("month")}
                  >
                    月视图
                  </Button>
                </div>
                
                {statsViewMode === "day" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-[180px] justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "yyyy年MM月dd日", { locale: zhCN }) : "选择日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && onDateChange(date)}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="pointer-events-auto"
                        locale={zhCN}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {statsViewMode !== "day" && rangeSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">总登录次数</p>
                    <p className="text-2xl font-bold text-primary">{rangeSummary.totalLogins}</p>
                  </div>
                  <div className="bg-accent/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">独立用户数</p>
                    <p className="text-2xl font-bold text-accent">{rangeSummary.totalUniqueUsers}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">日均登录</p>
                    <p className="text-2xl font-bold">{rangeSummary.avgLogins}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">统计天数</p>
                    <p className="text-2xl font-bold">{rangeSummary.days}天</p>
                  </div>
                </div>
              )}

              {statsViewMode === "day" ? (
                isLoadingHourly ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : hourlyStats.length > 0 ? (
                  <div className="w-full h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="hourLabel"
                          tick={{ fontSize: 12 }}
                          interval={1}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number, name: string) => [
                            value,
                            name === "totalLogins" ? "登录次数" : "独立用户数",
                          ]}
                          labelFormatter={(label) => `时间: ${label}`}
                        />
                        <Legend formatter={(value) => (value === "totalLogins" ? "登录次数" : "独立用户数")} />
                        <Bar dataKey="totalLogins" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="totalLogins" />
                        <Bar dataKey="uniqueUsers" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="uniqueUsers" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    暂无登录数据
                  </div>
                )
              ) : isLoadingRange ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : dailyStats.length > 0 ? (
                <div className="w-full h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 12 }}
                        interval={statsViewMode === "month" ? 4 : 0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string) => [
                          value,
                          name === "totalLogins" ? "登录次数" : "独立用户数",
                        ]}
                        labelFormatter={(label) => `日期: ${label}`}
                      />
                      <Legend formatter={(value) => (value === "totalLogins" ? "登录次数" : "独立用户数")} />
                      <Line
                        type="monotone"
                        dataKey="totalLogins"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                        name="totalLogins"
                      />
                      <Line
                        type="monotone"
                        dataKey="uniqueUsers"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--accent))", strokeWidth: 2 }}
                        name="uniqueUsers"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  暂无登录数据
                </div>
              )}
            </div>
          </TabsContent>

          {/* Top活跃用户分栏 */}
          <TabsContent value="topusers" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  指定时间段内登录次数最多的用户
                </h3>
                <Select
                  value={topUsersPeriod.toString()}
                  onValueChange={(value) => onTopUsersPeriodChange(parseInt(value))}
                >
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder="选择时间段" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">近7天</SelectItem>
                    <SelectItem value="30">近30天</SelectItem>
                    <SelectItem value="90">近90天</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoadingTopUsers ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : topUsers.length > 0 ? (
                <div className="space-y-3">
                  {topUsers.slice(0, 3).map((user, index) => {
                    let badgeColor = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
                    let icon = null;
                    if (index === 0) {
                      badgeColor = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-2 border-yellow-300";
                      icon = "🥇";
                    } else if (index === 1) {
                      badgeColor = "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-2 border-gray-300";
                      icon = "🥈";
                    } else if (index === 2) {
                      badgeColor = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-2 border-orange-300";
                      icon = "🥉";
                    }

                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-background to-muted/20 rounded-lg border-2 hover:shadow-md transition-all"
                      >
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${badgeColor}`}>
                          {icon || `#${index + 1}`}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-lg truncate">{user.username}</div>
                          <div className="text-sm text-muted-foreground">
                            活跃天数: {user.activeDays} 天 · 日均登录: {user.avgLoginsPerDay} 次
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <div className="text-2xl font-bold text-primary">{user.totalLogins}</div>
                          <div className="text-xs text-muted-foreground">总登录次数</div>
                        </div>

                        <div className="flex-shrink-0 w-32 hidden md:block">
                          <div className="h-8 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, (user.totalLogins / (topUsers[0]?.totalLogins || 1)) * 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  暂无活跃用户数据
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StatsDashboard;
