import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Loader2, TrendingUp } from "lucide-react";

interface IncomeBreakdown {
  key: string;
  label: string;
  count: number;
  unitPrice: number;
  subtotal: number;
}

interface TodayIncomeCardProps {
  totalCards: number | null;
  totalIncome: number | null;
  breakdown: IncomeBreakdown[];
  isLoading: boolean;
  onRefresh: () => void;
}

const TodayIncomeCard = ({ totalCards, totalIncome, breakdown, isLoading, onRefresh }: TodayIncomeCardProps) => {
  return (
    <Card className="mb-6 shadow-xl border-2 bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950/30 dark:to-amber-950/30 border-emerald-200 dark:border-emerald-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 dark:bg-emerald-500 rounded-lg shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-emerald-900 dark:text-emerald-100">今日已赚</CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400 mt-1">
                Today's Income
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="border-2 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 h-10 px-4"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "刷新"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="px-6 py-4 bg-white dark:bg-emerald-900/50 rounded-xl shadow-lg border-2 border-emerald-300 dark:border-emerald-600">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-12 w-20 bg-emerald-300 dark:bg-emerald-700 rounded mb-2"></div>
                <div className="h-4 w-24 bg-emerald-200 dark:bg-emerald-800 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mb-1">
                  {totalIncome !== null ? `¥${totalIncome}` : '-'}
                </div>
                <div className="text-sm font-medium text-emerald-500 dark:text-emerald-400">总收入(元)</div>
              </>
            )}
          </div>
          <div className="px-6 py-4 bg-white dark:bg-amber-900/50 rounded-xl shadow-lg border-2 border-amber-300 dark:border-amber-600">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-12 w-20 bg-amber-300 dark:bg-amber-700 rounded mb-2"></div>
                <div className="h-4 w-24 bg-amber-200 dark:bg-amber-800 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-4xl font-bold text-amber-600 dark:text-amber-400 tabular-nums mb-1">
                  {totalCards ?? '-'}
                </div>
                <div className="text-sm font-medium text-amber-500 dark:text-amber-400">卡密使用数</div>
              </>
            )}
          </div>
        </div>

        {breakdown.length > 0 && (
          <div className="px-4 py-3 bg-white dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">卡密明细</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {breakdown.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg"
                >
                  <div>
                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{item.label}</span>
                    <span className="text-xs text-emerald-500 dark:text-emerald-400 ml-2">x{item.count}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">¥{item.subtotal}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && totalCards === 0 && (
          <div className="text-center py-4 text-emerald-500 dark:text-emerald-400 text-sm">
            今日暂无卡密使用记录
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayIncomeCard;
