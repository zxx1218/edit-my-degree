import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Users } from "lucide-react";
import * as adminApi from "@/lib/adminApi";
import {
  AdminLogin,
  LoginStatsCard,
  CardManager,
  UserList,
  StatsDashboard,
  MessageList,
  TodayLoginList,
  ProvinceMap,
  IpBlacklistManager,
} from "@/components/admin";

interface User {
  id: string;
  username: string;
  password: string;
  remaining_logins: number;
  pdf_limit: number;
}

interface CardItem {
  id: string;
  type: string;
  values: number;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

const SuperAdd = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [todayLoginCount, setTodayLoginCount] = useState<number | null>(null);
  const [distinctUsers, setDistinctUsers] = useState<number | null>(null);
  const [isLoadingLoginCount, setIsLoadingLoginCount] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  // PDF积分管理
  const [cards, setCards] = useState<CardItem[]>([]);
  const [isFetchingCards, setIsFetchingCards] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 每小时登录统计
  const [hourlyStats, setHourlyStats] = useState<any[]>([]);
  const [isLoadingHourlyStats, setIsLoadingHourlyStats] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // 周/月统计
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [rangeSummary, setRangeSummary] = useState<any>(null);
  const [isLoadingRangeStats, setIsLoadingRangeStats] = useState(false);
  const [statsViewMode, setStatsViewMode] = useState<"day" | "week" | "month">("day");

  // 用户活跃度热力图
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);

  // Top活跃用户
  const [topActiveUsers, setTopActiveUsers] = useState<any[]>([]);
  const [isLoadingTopUsers, setIsLoadingTopUsers] = useState(false);
  const [topUsersPeriod, setTopUsersPeriod] = useState<number>(30);

  // 今日登录详情
  const [todayLoginDetails, setTodayLoginDetails] = useState<any[]>([]);
  const [isLoadingTodayLoginDetails, setIsLoadingTodayLoginDetails] = useState(false);

  const { toast } = useToast();

  // 数据获取函数
  const fetchTodayLoginCount = async () => {
    if (!token) return;
    
    setIsLoadingLoginCount(true);
    try {
      const data = await adminApi.getTodayLoginCount(token);
      if (data.success) {
        setTodayLoginCount(data.total_logins);
        setDistinctUsers(data.distinct_users);
      }
    } catch (error) {
      console.error("获取登录统计时出错:", error);
    } finally {
      setIsLoadingLoginCount(false);
    }
  };

  const fetchHourlyStats = async (date?: Date) => {
    if (!token) return;
    
    setIsLoadingHourlyStats(true);
    try {
      const targetDate = date || selectedDate;
      const dateString = format(targetDate, "yyyy-MM-dd");
      
      const data = await adminApi.getHourlyLoginStats(token, { date: dateString });
      if (data.success) {
        setHourlyStats(data.hourlyStats || []);
      }
    } catch (error) {
      console.error("获取每小时登录统计时出错:", error);
    } finally {
      setIsLoadingHourlyStats(false);
    }
  };

  const fetchRangeStats = async (range: "week" | "month") => {
    if (!token) return;
    
    setIsLoadingRangeStats(true);
    try {
      const data = await adminApi.getLoginStatsRange(token, { range });
      if (data?.success) {
        const dailyStatsData = Array.isArray(data.dailyStats) ? data.dailyStats : [];
        const summaryData = data.summary && typeof data.summary === 'object' ? data.summary : null;
        
        setDailyStats(dailyStatsData);
        setRangeSummary(summaryData);
      } else {
        throw new Error(data?.error || "获取周/月登录统计失败");
      }
    } catch (error: any) {
      console.error("获取周/月登录统计时出错:", error);
      toast({
        variant: "destructive",
        title: "获取统计失败",
        description: error.message || "请重试",
      });
    } finally {
      setIsLoadingRangeStats(false);
    }
  };

  const fetchHeatmapData = async () => {
    if (!token) return;
    
    setIsLoadingHeatmap(true);
    try {
      const data = await adminApi.getUserActivityHeatmap(token);
      if (data.success) {
        setHeatmapData(data.heatmap || []);
      }
    } catch (error) {
      console.error("获取用户活跃度热力图时出错:", error);
    } finally {
      setIsLoadingHeatmap(false);
    }
  };

  const fetchTopActiveUsers = async (period?: number) => {
    if (!token) return;
    
    setIsLoadingTopUsers(true);
    try {
      const days = period || topUsersPeriod;
      const data = await adminApi.getTopActiveUsers(token, { limit: 3, days });
      if (data.success) {
        setTopActiveUsers(data.users || []);
        setTopUsersPeriod(days);
      }
    } catch (error) {
      console.error("获取Top活跃用户时出错:", error);
    } finally {
      setIsLoadingTopUsers(false);
    }
  };

  // 获取今日登录详情
  const fetchTodayLoginDetails = async () => {
    if (!token) return;
    
    setIsLoadingTodayLoginDetails(true);
    try {
      const data = await adminApi.getTodayLoginDetails(token);
      if (data.success) {
        setTodayLoginDetails(data.loginDetails || []);
      }
    } catch (error) {
      console.error("获取今日登录详情时出错:", error);
    } finally {
      setIsLoadingTodayLoginDetails(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    
    setIsFetchingUsers(true);
    try {
      const data = await adminApi.getAllUsers(token);
      if (data.success) {
        setUsers(data.users || []);
      } else {
        throw new Error(data.error || "获取用户列表失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "获取用户列表失败",
        description: error.message,
      });
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const fetchCards = async () => {
    if (!token) return;
    
    setIsFetchingCards(true);
    try {
      const data = await adminApi.manageCards(token, { action: "list" });
      if (data.success) {
        setCards(data.cards || []);
      } else {
        throw new Error(data.error || "获取充值卡列表失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "获取充值卡列表失败",
        description: error.message,
      });
    } finally {
      setIsFetchingCards(false);
    }
  };

  // 处理函数
  const handleVerify = (newToken: string) => {
    setToken(newToken);
    setIsVerified(true);
  };

  const handleAddLogins = async (username: string, logins: number) => {
    if (!token) return;
    
    try {
      const data = await adminApi.updateUserLogins(token, { username, addLogins: logins });
      if (data.success) {
        toast({
          title: "添加成功",
          description: `已为用户 ${username} 添加 ${logins} 次登录，当前剩余 ${data.newLogins} 次`,
        });
        fetchUsers();
      } else {
        toast({ variant: "destructive", title: "添加失败", description: data.error || "未知错误" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "添加失败", description: error.message });
    }
  };

  const handleDecreaseLogins = async (username: string, logins: number) => {
    if (!token) return;
    
    try {
      const data = await adminApi.decreaseUserLogins(token, { username, decreaseLogins: logins });
      if (data.success) {
        toast({
          title: "减少成功",
          description: `已为用户 ${username} 减少 ${data.decreased} 次登录，当前剩余 ${data.newLogins} 次`,
        });
        fetchUsers();
      } else {
        toast({ variant: "destructive", title: "减少失败", description: data.error || "未知错误" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "减少失败", description: error.message });
    }
  };

  const handleResetLogins = async (username: string) => {
    if (!token) return;
    
    try {
      const data = await adminApi.resetUserLogins(token, { username });
      if (data.success) {
        toast({ title: "重置成功", description: `已将用户 ${username} 的登录次数重置为 0` });
        fetchUsers();
      } else {
        toast({ variant: "destructive", title: "重置失败", description: data.error || "未知错误" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "重置失败", description: error.message });
    }
  };

  const handleAddPdf = async (username: string, amount: number) => {
    if (!token) return;
    
    try {
      const data = await adminApi.increasePdfLimit(token, { username, increaseAmount: amount });
      if (data.success) {
        toast({
          title: "添加成功",
          description: `已为用户 ${username} 添加 ${amount} 积分，当前剩余 ${data.newPdfLimit} 积分`,
        });
        fetchUsers();
      } else {
        toast({ variant: "destructive", title: "添加失败", description: data.error || "未知错误" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "添加失败", description: error.message });
    }
  };

  const handleDecreasePdf = async (username: string, amount: number) => {
    if (!token) return;
    
    try {
      const data = await adminApi.decreasePdfLimit(token, { username, decreaseAmount: amount });
      if (data.success) {
        toast({
          title: "减少成功",
          description: `已为用户 ${username} 减少 ${amount} 积分，当前剩余 ${data.newPdfLimit} 积分`,
        });
        fetchUsers();
      } else {
        toast({ variant: "destructive", title: "减少失败", description: data.error || "未知错误" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "减少失败", description: error.message });
    }
  };

  const handleResetPdf = async (username: string) => {
    if (!token) return;
    
    try {
      const data = await adminApi.resetPdfLimit(token, { username });
      if (data.success) {
        toast({ title: "重置成功", description: `已将用户 ${username} 的PDF积分重置为 0` });
        fetchUsers();
      } else {
        toast({ variant: "destructive", title: "重置失败", description: data.error || "未知错误" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "重置失败", description: error.message });
    }
  };

  // 修改用户密码
  const handleChangePassword = async (username: string, newPassword: string) => {
    if (!token) return;
    
    try {
      const data = await adminApi.changeUserPassword(token, { 
        username, 
        oldPassword: '', // 管理员改密不需要原密码，后端需要调整
        newPassword 
      });
      
      if (data.success) {
        toast({ 
          title: "修改成功", 
          description: `已修改用户 ${username} 的密码` 
        });
        fetchUsers();
      } else {
        throw new Error(data.error || "修改密码失败");
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "修改失败", 
        description: error.message 
      });
      throw error;
    }
  };

  // 删除用户
  const handleDeleteUser = async (username: string) => {
    if (!token) return;
    
    try {
      const data = await adminApi.deleteUser(token, { username });
      
      if (data.success) {
        toast({ 
          title: "删除成功", 
          description: `用户 ${username} 及其所有数据已彻底删除` 
        });
        fetchUsers();
      } else {
        throw new Error(data.error || "删除用户失败");
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "删除失败", 
        description: error.message 
      });
      throw error;
    }
  };

  const handleCreateCards = async (type: string, values: number, count: number) => {
    if (!token) return;
    
    try {
      const data = await adminApi.manageCards(token, { action: "create", type, values, count });
      if (data.success) {
        toast({ title: "创建成功", description: `已成功创建 ${data.cards.length} 张充值卡` });
        fetchCards();
      } else {
        throw new Error(data.error || "创建失败");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "创建失败", description: error.message });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!successful) {
          throw new Error("execCommand copy failed");
        }
      }
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: "已复制", description: "卡密已复制到剪贴板" });
    } catch (error) {
      console.error("复制失败:", error);
      toast({ variant: "destructive", title: "复制失败", description: "请手动复制卡密" });
    }
  };

  // 当选择日期变化时重新获取数据
  useEffect(() => {
    if (isVerified && statsViewMode === "day") {
      fetchHourlyStats(selectedDate);
    }
  }, [selectedDate, statsViewMode]);

  // 当视图模式变化时获取对应数据
  useEffect(() => {
    if (isVerified) {
      if (statsViewMode === "day") {
        fetchHourlyStats(selectedDate);
      } else {
        fetchRangeStats(statsViewMode);
      }
    }
  }, [statsViewMode]);

  // 登录验证成功后获取数据
  useEffect(() => {
    if (isVerified) {
      fetchTodayLoginCount();
      fetchHourlyStats();
      fetchUsers();
      fetchCards();
      fetchHeatmapData();
      fetchTopActiveUsers();
      fetchTodayLoginDetails();
    }
  }, [isVerified]);

  if (!isVerified) {
    return <AdminLogin onVerify={handleVerify} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6">
      <div className="container max-w-6xl mx-auto py-4">
        {/* 页面标题 */}
        <div className="mb-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            用户管理系统
          </h1>
          <p className="text-muted-foreground">管理用户登录次数与PDF积分</p>
        </div>

        {/* 今日登录统计卡片 */}
        <LoginStatsCard
          todayLoginCount={todayLoginCount}
          distinctUsers={distinctUsers}
          isLoading={isLoadingLoginCount}
          onRefresh={fetchTodayLoginCount}
        />

        {/* 充值卡管理 */}
        <CardManager
          cards={cards}
          isFetchingCards={isFetchingCards}
          onFetchCards={fetchCards}
          onCreateCards={handleCreateCards}
          onCopyToClipboard={copyToClipboard}
          copiedId={copiedId}
        />

        {/* 用户列表 */}
        <UserList
          users={users}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isFetchingUsers={isFetchingUsers}
          onFetchUsers={fetchUsers}
          onChangePassword={handleChangePassword}
          onDeleteUser={handleDeleteUser}
          onAddLogins={handleAddLogins}
          onDecreaseLogins={handleDecreaseLogins}
          onResetLogins={handleResetLogins}
          onAddPdf={handleAddPdf}
          onDecreasePdf={handleDecreasePdf}
          onResetPdf={handleResetPdf}
          token={token}
        />

        {/* 留言管理 */}
        <MessageList token={token} />

        {/* 用户统计分析（热力图 + 登录统计 + Top活跃用户） */}
        <StatsDashboard
          heatmapData={heatmapData}
          isLoadingHeatmap={isLoadingHeatmap}
          onRefreshHeatmap={fetchHeatmapData}
          hourlyStats={hourlyStats}
          dailyStats={dailyStats}
          rangeSummary={rangeSummary}
          isLoadingHourly={isLoadingHourlyStats}
          isLoadingRange={isLoadingRangeStats}
          selectedDate={selectedDate}
          statsViewMode={statsViewMode}
          onDateChange={setSelectedDate}
          onViewModeChange={setStatsViewMode}
          onRefreshChart={() => {
            if (statsViewMode === "day") {
              fetchHourlyStats();
            } else {
              fetchRangeStats(statsViewMode);
            }
          }}
          topUsers={topActiveUsers}
          isLoadingTopUsers={isLoadingTopUsers}
          topUsersPeriod={topUsersPeriod}
          onTopUsersPeriodChange={fetchTopActiveUsers}
          onRefreshTopUsers={() => fetchTopActiveUsers(topUsersPeriod)}
        />

        {/* 省份登录分布地图 */}
        <ProvinceMap token={token} />

        {/* IP黑名单管理 */}
        <IpBlacklistManager token={token} />

        {/* 今日登录用户列表 */}
        <TodayLoginList
          loginDetails={todayLoginDetails}
          isLoading={isLoadingTodayLoginDetails}
          onRefresh={fetchTodayLoginDetails}
        />
      </div>
    </div>
  );
};

export default SuperAdd;
