import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, RotateCcw, Loader2 } from "lucide-react";

interface HeatmapDataItem {
  day: string;
  dayIndex: number;
  hour: number;
  hourLabel: string;
  loginCount: number;
  uniqueUsers: number;
}

interface ActivityHeatmapProps {
  heatmapData: HeatmapDataItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

const ActivityHeatmap = ({ heatmapData, isLoading, onRefresh }: ActivityHeatmapProps) => {
  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Flame className="h-5 w-5 text-orange-500" />
              用户活跃度热力图
            </CardTitle>
            <CardDescription>展示过去7天各时段的登录密度分布</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
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
        {isLoading ? (
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
      </CardContent>
    </Card>
  );
};

export default ActivityHeatmap;
