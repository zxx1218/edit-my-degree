import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KeyRound, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getPasswordChangeStats } from "@/lib/adminApi";
import { useToast } from "@/hooks/use-toast";

interface PasswordChangeStat {
  username: string;
  total_changes: number;
  last_changed_at: string;
}

interface PasswordChangeStatsProps {
  token: string | null;
}

const ITEMS_PER_PAGE = 20;

export const PasswordChangeStats = ({ token }: PasswordChangeStatsProps) => {
  const [stats, setStats] = useState<PasswordChangeStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const { toast } = useToast();

  // 获取密码修改统计数据
  const fetchStats = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const data = await getPasswordChangeStats(token, {
        page: currentPage,
        pageSize: ITEMS_PER_PAGE
      });
      
      if (data.success) {
        setStats(data.stats || []);
        setTotalPages(data.totalPages || 1);
        setTotalRecords(data.total || 0);
      } else {
        throw new Error(data.error || "获取密码修改统计失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "获取失败",
        description: error.message || "请重试",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 当token或页码变化时获取数据
  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token, currentPage]);

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">密码修改统计</CardTitle>
              <CardDescription>
                共 {totalRecords} 个用户修改过密码
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={fetchStats} 
            variant="outline" 
            size="sm" 
            className="border-2" 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="border-2 rounded-lg p-8 bg-muted/50 animate-pulse">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">正在加载统计数据...</p>
            </div>
          </div>
        ) : stats.length > 0 ? (
          <>
            <div className="border-2 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        用户名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        修改次数
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        最近修改时间
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.map((stat, index) => (
                      <tr
                        key={stat.username}
                        className="hover:bg-muted/30 transition-colors animate-scale-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium text-sm">{stat.username}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1">
                            <KeyRound className="h-3 w-3" />
                            <span className="font-medium">{stat.total_changes} 次</span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                          {format(new Date(stat.last_changed_at), 'yyyy-MM-dd HH:mm:ss')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  第 {currentPage} / {totalPages} 页
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-xs sm:text-sm h-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-xs sm:text-sm h-9"
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 rounded-lg">
            <KeyRound className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>暂无密码修改记录</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PasswordChangeStats;

