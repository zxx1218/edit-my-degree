import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, RotateCcw, Loader2 } from "lucide-react";

interface TopActiveUser {
  id: string;
  username: string;
  totalLogins: number;
  activeDays: number;
  lastLogin: string;
  firstLoginInPeriod: string;
  avgLoginsPerDay: string;
}

interface TopActiveUsersProps {
  users: TopActiveUser[];
  isLoading: boolean;
  period: number;
  onPeriodChange: (period: number) => void;
  onRefresh: () => void;
}

const TopActiveUsers = ({ users, isLoading, period, onPeriodChange, onRefresh }: TopActiveUsersProps) => {
  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top活跃用户排行榜
            </CardTitle>
            <CardDescription>显示指定时间段内登录次数最多的用户</CardDescription>
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
                <SelectItem value="90">近90天</SelectItem>
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
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length > 0 ? (
          <div className="space-y-3">
            {users.map((user, index) => {
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
                          width: `${Math.min(100, (user.totalLogins / (users[0]?.totalLogins || 1)) * 100)}%`
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
      </CardContent>
    </Card>
  );
};

export default TopActiveUsers;
