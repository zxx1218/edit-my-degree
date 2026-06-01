import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, CalendarIcon, RotateCcw, Loader2 } from "lucide-react";
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

interface LoginStatsChartProps {
  hourlyStats: HourlyStatItem[];
  dailyStats: DailyStatItem[];
  rangeSummary: RangeSummary | null;
  isLoadingHourly: boolean;
  isLoadingRange: boolean;
  selectedDate: Date;
  statsViewMode: "day" | "week" | "month";
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: "day" | "week" | "month") => void;
  onRefresh: () => void;
}

const LoginStatsChart = ({
  hourlyStats,
  dailyStats,
  rangeSummary,
  isLoadingHourly,
  isLoadingRange,
  selectedDate,
  statsViewMode,
  onDateChange,
  onViewModeChange,
  onRefresh,
}: LoginStatsChartProps) => {
  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="h-5 w-5 text-primary" />
                登录统计图表
              </CardTitle>
              <CardDescription>
                {statsViewMode === "day"
                  ? "展示当日各时段的用户登录情况"
                  : statsViewMode === "week"
                    ? "展示过去7天的用户登录趋势"
                    : "展示过去30天的用户登录趋势"}
              </CardDescription>
            </div>
            {statsViewMode === "day" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
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
        </div>
      </CardHeader>
      <CardContent>
        {statsViewMode !== "day" && rangeSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoadingHourly || isLoadingRange}
          >
            {isLoadingHourly || isLoadingRange ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            刷新数据
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginStatsChart;
