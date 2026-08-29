import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, RotateCcw, Loader2, Monitor, User, Globe } from "lucide-react";

interface LoginTime {
  time: string;
  type: 'normal' | 'admin_impersonate' | 'web_chsi';
}

interface LoginDetail {
  username: string;
  loginCount: number;
  loginTimes: LoginTime[];
}

interface TodayLoginListProps {
  loginDetails: LoginDetail[];
  isLoading: boolean;
  onRefresh: () => void;
}

const TodayLoginList = ({ loginDetails, isLoading, onRefresh }: TodayLoginListProps) => {

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl">今日登录情况</CardTitle>
              <CardDescription>
                实时显示今天所有登录的用户信息（共 {loginDetails.length} 个用户）
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="border-2"
          >
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
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : loginDetails.length > 0 ? (
          <div 
            className="border-2 rounded-lg max-h-80 overflow-y-auto bg-gradient-to-br from-muted/30 to-muted/50"
          >
            <div className="space-y-2 p-3">
              {loginDetails.map((record, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-gradient-to-r from-background to-muted/20 rounded-lg hover:shadow-md transition-all border border-border/50 hover:border-primary/30 animate-scale-in"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-semibold text-base">用户：{record.username}</div>
                      <Badge variant="secondary" className="text-xs">
                        登录 {record.loginCount} 次
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {record.loginTimes.map((item, timeIndex) => (
                        <span
                          key={timeIndex}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md"
                          style={{
                            backgroundColor: item.type === 'admin_impersonate' 
                              ? 'rgba(239, 68, 68, 0.1)' 
                              : item.type === 'web_chsi'
                              ? 'rgba(16, 185, 129, 0.1)'
                              : 'rgba(59, 130, 246, 0.1)',
                            color: item.type === 'admin_impersonate' 
                              ? 'rgb(239, 68, 68)' 
                              : item.type === 'web_chsi'
                              ? 'rgb(16, 185, 129)'
                              : 'rgb(59, 130, 246)'
                          }}
                        >
                          {item.type === 'admin_impersonate' ? (
                            <>
                              <User className="h-3 w-3" />
                              <span>{item.time}</span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-1">
                                管理员代登
                              </Badge>
                            </>
                          ) : item.type === 'web_chsi' ? (
                            <>
                              <Globe className="h-3 w-3" />
                              <span>{item.time}</span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-1">
                                网页版学信网
                              </Badge>
                            </>
                          ) : (
                            <>
                              <Monitor className="h-3 w-3" />
                              <span>{item.time}</span>
                            </>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            今日暂无登录记录
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayLoginList;