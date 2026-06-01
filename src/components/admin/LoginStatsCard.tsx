import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List, Loader2 } from "lucide-react";

interface LoginStatsCardProps {
  todayLoginCount: number | null;
  distinctUsers: number | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const LoginStatsCard = ({ todayLoginCount, distinctUsers, isLoading, onRefresh }: LoginStatsCardProps) => {
  return (
    <Card className="mb-6 shadow-xl border-2 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-200 dark:border-indigo-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-lg">
              <List className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-indigo-900 dark:text-indigo-100">今日系统登录统计</CardTitle>
              <CardDescription className="text-indigo-600 dark:text-indigo-400 mt-1">
                Today's Login Statistics
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="border-2 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 h-10 px-4"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "刷新"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="px-6 py-4 bg-white dark:bg-indigo-900/50 rounded-xl shadow-lg border-2 border-indigo-300 dark:border-indigo-600">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-12 w-20 bg-indigo-300 dark:bg-indigo-700 rounded mb-2"></div>
                <div className="h-4 w-24 bg-indigo-200 dark:bg-indigo-800 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums mb-1">
                  {distinctUsers ?? "-"}
                </div>
                <div className="text-sm font-medium text-indigo-500 dark:text-indigo-400">不同用户数</div>
              </>
            )}
          </div>
          <div className="px-6 py-4 bg-white dark:bg-indigo-900/50 rounded-xl shadow-lg border-2 border-indigo-300 dark:border-indigo-600">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-12 w-20 bg-indigo-300 dark:bg-indigo-700 rounded mb-2"></div>
                <div className="h-4 w-24 bg-indigo-200 dark:bg-indigo-800 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums mb-1">
                  {todayLoginCount ?? "-"}
                </div>
                <div className="text-sm font-medium text-indigo-500 dark:text-indigo-400">总登录次数</div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginStatsCard;
