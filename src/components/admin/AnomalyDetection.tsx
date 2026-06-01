import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RotateCcw, Loader2 } from "lucide-react";

interface AnomalyDetection {
  anomalies: {
    frequentLogins: Array<{
      username: string;
      date: string;
      hour: string;
      loginCount: number;
    }>;
    abnormalTimeLogins: Array<{
      username: string;
      loginTime: string;
      hour: string;
      date: string;
    }>;
    dailyAnomalies: Array<{
      username: string;
      date: string;
      dailyLogins: number;
    }>;
  };
  summary: {
    totalFrequentLoginUsers: number;
    totalAbnormalTimeLogins: number;
    totalDailyAnomalyUsers: number;
    period: {
      days: number;
      startDate: string;
      endDate: string;
    };
  };
}

interface AnomalyDetectionProps {
  data: AnomalyDetection | null;
  isLoading: boolean;
  period: number;
  onPeriodChange: (period: number) => void;
  onRefresh: () => void;
}

const AnomalyDetection = ({ data, isLoading, period, onPeriodChange, onRefresh }: AnomalyDetectionProps) => {
  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              异常登录检测
            </CardTitle>
            <CardDescription>检测频繁登录、异常时间段登录等可疑行为</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={period.toString()}
              onValueChange={(value) => onPeriodChange(parseInt(value))}
            >
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="选择时间段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">近7天</SelectItem>
                <SelectItem value="30">近30天</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              刷新
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="font-semibold text-red-900 dark:text-red-100">频繁登录用户</span>
                </div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {data.summary.totalFrequentLoginUsers}
                </div>
                <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                  1小时内登录超过5次
                </div>
              </div>
              
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="font-semibold text-orange-900 dark:text-orange-100">凌晨登录次数</span>
                </div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {data.summary.totalAbnormalTimeLogins}
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  凌晨0-5点登录
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-semibold text-yellow-900 dark:text-yellow-100">单日异常用户</span>
                </div>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {data.summary.totalDailyAnomalyUsers}
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  单日登录超过20次
                </div>
              </div>
            </div>

            <Tabs defaultValue="frequent" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-10">
                <TabsTrigger value="frequent" className="text-sm">
                  频繁登录
                </TabsTrigger>
                <TabsTrigger value="abnormal" className="text-sm">
                  凌晨登录
                </TabsTrigger>
                <TabsTrigger value="daily" className="text-sm">
                  单日异常
                </TabsTrigger>
              </TabsList>

              <TabsContent value="frequent" className="mt-4">
                {data.anomalies.frequentLogins.length > 0 ? (
                  <div className="border-2 rounded-lg max-h-80 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">用户名</th>
                          <th className="px-4 py-3 text-left font-medium">日期</th>
                          <th className="px-4 py-3 text-left font-medium">时段</th>
                          <th className="px-4 py-3 text-right font-medium">登录次数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.anomalies.frequentLogins.map((record, idx) => (
                          <tr key={idx} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-3 font-medium">{record.username}</td>
                            <td className="px-4 py-3 text-muted-foreground">{record.date}</td>
                            <td className="px-4 py-3 text-muted-foreground">{record.hour}</td>
                            <td className="px-4 py-3 text-right">
                              <Badge variant="destructive">{record.loginCount} 次</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    未检测到频繁登录行为
                  </div>
                )}
              </TabsContent>

              <TabsContent value="abnormal" className="mt-4">
                {data.anomalies.abnormalTimeLogins.length > 0 ? (
                  <div className="border-2 rounded-lg max-h-80 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">用户名</th>
                          <th className="px-4 py-3 text-left font-medium">日期</th>
                          <th className="px-4 py-3 text-left font-medium">时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.anomalies.abnormalTimeLogins.slice(0, 20).map((record, idx) => (
                          <tr key={idx} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-3 font-medium">{record.username}</td>
                            <td className="px-4 py-3 text-muted-foreground">{record.date}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              <Badge variant="secondary">{record.hour}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.anomalies.abnormalTimeLogins.length > 20 && (
                      <div className="text-center py-2 text-xs text-muted-foreground border-t">
                        显示前20条，共 {data.anomalies.abnormalTimeLogins.length} 条记录
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    未检测到凌晨登录行为
                  </div>
                )}
              </TabsContent>

              <TabsContent value="daily" className="mt-4">
                {data.anomalies.dailyAnomalies.length > 0 ? (
                  <div className="border-2 rounded-lg max-h-80 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">用户名</th>
                          <th className="px-4 py-3 text-left font-medium">日期</th>
                          <th className="px-4 py-3 text-right font-medium">当日登录次数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.anomalies.dailyAnomalies.map((record, idx) => (
                          <tr key={idx} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-3 font-medium">{record.username}</td>
                            <td className="px-4 py-3 text-muted-foreground">{record.date}</td>
                            <td className="px-4 py-3 text-right">
                              <Badge variant="destructive">{record.dailyLogins} 次</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    未检测到单日登录异常
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            暂无异常检测数据
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnomalyDetection;
