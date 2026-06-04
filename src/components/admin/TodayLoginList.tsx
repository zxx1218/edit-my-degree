import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, RotateCcw, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface LoginDetail {
  username: string;
  loginCount: number;
  loginTimes: string[];
}

interface TodayLoginListProps {
  loginDetails: LoginDetail[];
  isLoading: boolean;
  onRefresh: () => void;
}

const TodayLoginList = ({ loginDetails, isLoading, onRefresh }: TodayLoginListProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // 自动滚动效果
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || loginDetails.length === 0) return;

    let animationId: number;
    let scrollSpeed = 0.5; // 滚动速度（像素/帧）
    
    const scroll = () => {
      if (!isPaused && container) {
        container.scrollTop += scrollSpeed;
        
        // 如果滚动到底部，重置到顶部
        if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
          container.scrollTop = 0;
        }
      }
      
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [loginDetails, isPaused]);

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl">今日登录用户</CardTitle>
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
            ref={scrollContainerRef}
            className="border-2 rounded-lg max-h-80 overflow-y-auto bg-gradient-to-br from-muted/30 to-muted/50"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
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
                      <div className="font-semibold text-base">{record.username}</div>
                      <Badge variant="secondary" className="text-xs">
                        登录 {record.loginCount} 次
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {record.loginTimes.map((time, timeIndex) => (
                        <span
                          key={timeIndex}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md"
                        >
                          {time}
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