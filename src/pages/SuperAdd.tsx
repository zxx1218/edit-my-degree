import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Shield,
  UserPlus,
  List,
  Loader2,
  RotateCcw,
  Search,
  Minus,
  CreditCard,
  LogIn,
  Users,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Copy,
  Check,
  Download,
  BarChart3,
  CalendarIcon,
  AlertTriangle,
  Trophy,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import * as adminApi from "@/lib/adminApi";

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

// 设置一次登录后72小时内无需重新验证
const SUPERADD_LOGIN_KEY = "superadd_login_timestamp";
const SUPERADD_TOKEN_KEY = "superadd_token";
const SUPERADD_SESSION_DURATION = 72 * 60 * 60 * 1000; // 72小时（毫秒）
const USERS_PER_PAGE = 10;
const CARDS_PER_PAGE = 10;

const SuperAdd = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [verifyUsername, setVerifyUsername] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [targetUsername, setTargetUsername] = useState("");
  const [addLogins, setAddLogins] = useState("");
  const [decreaseUsername, setDecreaseUsername] = useState("");
  const [decreaseLogins, setDecreaseLogins] = useState("");
  const [resetUsername, setResetUsername] = useState("");
  const [isAddingLogins, setIsAddingLogins] = useState(false);
  const [isDecreasingLogins, setIsDecreasingLogins] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [todayLoginCount, setTodayLoginCount] = useState<number | null>(null);
  const [distinctUsers, setDistinctUsers] = useState<number | null>(null);
  const [isLoadingLoginCount, setIsLoadingLoginCount] = useState(false);

  // PDF积分管理相关状态
  const [pdfUsername, setPdfUsername] = useState("");
  const [pdfAmount, setPdfAmount] = useState("");
  const [decreasePdfUsername, setDecreasePdfUsername] = useState("");
  const [decreasePdfAmount, setDecreasePdfAmount] = useState("");
  const [resetPdfUsername, setResetPdfUsername] = useState("");
  const [isAddingPdf, setIsAddingPdf] = useState(false);
  const [isDecreasingPdf, setIsDecreasingPdf] = useState(false);
  const [isResettingPdf, setIsResettingPdf] = useState(false);

  // 充值卡管理相关状态
  const [cards, setCards] = useState<CardItem[]>([]);
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [cardCurrentPage, setCardCurrentPage] = useState(1);
  const [isFetchingCards, setIsFetchingCards] = useState(false);
  const [isCreatingCards, setIsCreatingCards] = useState(false);
  const [newCardType, setNewCardType] = useState<string>("login");
  const [newCardValues, setNewCardValues] = useState("");
  const [newCardCount, setNewCardCount] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 每小时登录统计
  interface HourlyStatItem {
    hour: number;
    hourLabel: string;
    totalLogins: number;
    uniqueUsers: number;
  }
  const [hourlyStats, setHourlyStats] = useState<HourlyStatItem[]>([]);
  const [isLoadingHourlyStats, setIsLoadingHourlyStats] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // 周/月统计
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
  const [dailyStats, setDailyStats] = useState<DailyStatItem[]>([]);
  const [rangeSummary, setRangeSummary] = useState<RangeSummary | null>(null);
  const [isLoadingRangeStats, setIsLoadingRangeStats] = useState(false);
  const [statsViewMode, setStatsViewMode] = useState<"day" | "week" | "month">("day");

  // 用户活跃度热力图
  interface HeatmapDataItem {
    day: string;
    dayIndex: number;
    hour: number;
    hourLabel: string;
    loginCount: number;
    uniqueUsers: number;
  }
  const [heatmapData, setHeatmapData] = useState<HeatmapDataItem[]>([]);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);

  // Top活跃用户
  interface TopActiveUser {
    id: string;
    username: string;
    totalLogins: number;
    activeDays: number;
    lastLogin: string;
    firstLoginInPeriod: string;
    avgLoginsPerDay: string;
  }
  const [topActiveUsers, setTopActiveUsers] = useState<TopActiveUser[]>([]);
  const [isLoadingTopUsers, setIsLoadingTopUsers] = useState(false);
  const [topUsersPeriod, setTopUsersPeriod] = useState<number>(30);

  // 异常登录检测
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
  const [anomalyDetection, setAnomalyDetection] = useState<AnomalyDetection | null>(null);
  const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);
  const [anomalyPeriod, setAnomalyPeriod] = useState<number>(7);

  const { toast } = useToast();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

  // 过滤和分页逻辑
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    return users.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // 当搜索变化时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // 检查登录状态是否在72小时内
  useEffect(() => {
    const loginTimestamp = localStorage.getItem(SUPERADD_LOGIN_KEY);
    const storedToken = localStorage.getItem(SUPERADD_TOKEN_KEY);
    if (loginTimestamp && storedToken) {
      const loginTime = parseInt(loginTimestamp, 10);
      const currentTime = Date.now();
      const timeDiff = currentTime - loginTime;

      if (timeDiff < SUPERADD_SESSION_DURATION) {
        setToken(storedToken);
        setIsVerified(true);
      } else {
        localStorage.removeItem(SUPERADD_LOGIN_KEY);
        localStorage.removeItem(SUPERADD_TOKEN_KEY);
      }
    }
  }, []);

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

  // 获取周/月统计数据
  const fetchRangeStats = async (range: "week" | "month") => {
    if (!token) return;
    
    setIsLoadingRangeStats(true);
    try {
      const data = await adminApi.getLoginStatsRange(token, { range });
      if (data?.success) {
        // 确保数据格式正确
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

  // 获取用户活跃度热力图数据
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

  // 获取Top活跃用户
  const fetchTopActiveUsers = async (period?: number) => {
    if (!token) return;
    
    setIsLoadingTopUsers(true);
    try {
      const days = period || topUsersPeriod;
      const data = await adminApi.getTopActiveUsers(token, { limit: 20, days });
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

  // 获取异常登录检测数据
  const fetchAnomalyDetection = async (period?: number) => {
    if (!token) return;
    
    setIsLoadingAnomaly(true);
    try {
      const days = period || anomalyPeriod;
      const data = await adminApi.getAnomalyLoginDetection(token, { days });
      if (data.success) {
        setAnomalyDetection(data);
        setAnomalyPeriod(days);
      }
    } catch (error) {
      console.error("获取异常登录检测数据时出错:", error);
    } finally {
      setIsLoadingAnomaly(false);
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

  // 充值卡过滤和分页
  const filteredCards = useMemo(() => {
    if (!cardSearchQuery.trim()) return cards;
    return cards.filter(
      (card) =>
        card.id.toLowerCase().includes(cardSearchQuery.toLowerCase()) ||
        card.used_by?.toLowerCase().includes(cardSearchQuery.toLowerCase()),
    );
  }, [cards, cardSearchQuery]);

  const cardTotalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);

  const paginatedCards = useMemo(() => {
    const startIndex = (cardCurrentPage - 1) * CARDS_PER_PAGE;
    return filteredCards.slice(startIndex, startIndex + CARDS_PER_PAGE);
  }, [filteredCards, cardCurrentPage]);

  useEffect(() => {
    setCardCurrentPage(1);
  }, [cardSearchQuery]);

    // 登录验证成功后获取数据
  useEffect(() => {
    if (isVerified) {
      fetchTodayLoginCount();
      fetchHourlyStats();
      fetchUsers();
      fetchCards();
      fetchHeatmapData();
      fetchTopActiveUsers();
      fetchAnomalyDetection();
    }
  }, [isVerified]);

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

  const handleCreateCards = async () => {
    if (!token) return;
    
    const values = parseInt(newCardValues);
    const count = parseInt(newCardCount);
    if (!newCardType) {
      toast({ variant: "destructive", title: "请选择卡类型" });
      return;
    }
    if (isNaN(values) || values <= 0) {
      toast({ variant: "destructive", title: "请输入有效的积分数量" });
      return;
    }
    if (isNaN(count) || count <= 0 || count > 100) {
      toast({ variant: "destructive", title: "请输入有效的生成数量（1-100）" });
      return;
    }

    setIsCreatingCards(true);
    try {
      const data = await adminApi.manageCards(token, { action: "create", type: newCardType, values, count });
      if (data.success) {
        toast({ title: "创建成功", description: `已成功创建 ${data.cards.length} 张充值卡` });
        setNewCardValues("");
        setNewCardCount("");
        fetchCards();
      } else {
        throw new Error(data.error || "创建失败");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "创建失败", description: error.message });
    } finally {
      setIsCreatingCards(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      // 优先使用 navigator.clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: 使用传统的 execCommand 方法
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

  const exportCardsToCSV = (exportAll: boolean = true) => {
    const cardsToExport = exportAll ? cards : cards.filter((c) => !c.used);
    if (cardsToExport.length === 0) {
      toast({ variant: "destructive", title: "没有可导出的数据" });
      return;
    }

    const headers = ["卡密ID", "类型", "充值数量", "状态", "使用者", "使用时间", "创建时间"];
    const csvContent = [
      headers.join(","),
      ...cardsToExport.map((card) =>
        [
          card.id,
          card.type === "login" ? "登录次数" : "PDF积分",
          card.values,
          card.used ? "已使用" : "未使用",
          card.used_by || "",
          card.used_at || "",
          card.created_at || "",
        ].join(","),
      ),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `充值卡_${exportAll ? "全部" : "未使用"}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "导出成功", description: `已导出 ${cardsToExport.length} 张充值卡` });
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

  const handleVerify = async () => {
    try {
      const data = await adminApi.adminLogin(verifyUsername, verifyPassword);
      if (data.success) {
        localStorage.setItem(SUPERADD_LOGIN_KEY, Date.now().toString());
        localStorage.setItem(SUPERADD_TOKEN_KEY, data.token);
        setToken(data.token);
        setIsVerified(true);
      } else {
        toast({
          variant: "destructive",
          title: "验证失败",
          description: data.error || "用户名或密码错误",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "登录过程中发生错误",
      });
    }
  };

  const handleResetLogins = async () => {
    if (!token) return;
    
    if (!resetUsername.trim()) {
      toast({ variant: "destructive", title: "请输入用户名" });
      return;
    }
    setIsResetting(true);
    try {
      const data = await adminApi.resetUserLogins(token, { username: resetUsername });
      if (data.success) {
        toast({ title: "重置成功", description: `已将用户 ${resetUsername} 的登录次数重置为 0` });
        setResetUsername("");
        fetchUsers();
      } else {
        toast({ variant: "destructive", title: "重置失败", description: data.error || "未知错误" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "重置失败", description: error.message });
    } finally {
      setIsResetting(false);
    }
  };

  const handleAddLogins = async () => {
    if (!token) return;
    
    if (!targetUsername.trim()) {
      toast({ variant: "destructive", title: "请输入用户名" });
      return;
    }
    const loginsToAdd = parseInt(addLogins);
    if (isNaN(loginsToAdd) || loginsToAdd <= 0) {
      toast({ variant: "destructive", title: "请输入有效的登录次数", description: "登录次数必须为正整数" });
      return;
    }
    setIsAddingLogins(true);
    try {
      const data = await adminApi.updateUserLogins(token, { username: targetUsername, addLogins: loginsToAdd });
      if (data.success) {
        toast({
          title: "添加成功",
          description: `已为用户 ${targetUsername} 添加 ${loginsToAdd} 次登录，当前剩余 ${data.newLogins} 次`,
        });
        setTargetUsername("");
        setAddLogins("");
        fetchUsers();
      } else {
        toast({ variant: "destructive", title: "添加失败", description: data.error || "未知错误" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "添加失败", description: error.message });
    } finally {
      setIsAddingLogins(false);
    }
  };

  const handleDecreaseLogins = async () => {
    if (!token) return;
    
    if (!decreaseUsername.trim()) {
      toast({ variant: "destructive", title: "请输入用户名" });
      return;
    }
    const loginsToDecrease = parseInt(decreaseLogins);
    if (isNaN(loginsToDecrease) || loginsToDecrease <= 0) {
      toast({ variant: "destructive", title: "请输入有效的登录次数", description: "登录次数必须为正整数" });
      return;
    }
    setIsDecreasingLogins(true);
    try {
      const data = await adminApi.decreaseUserLogins(token, { username: decreaseUsername, decreaseLogins: loginsToDecrease });
      if (data.success) {
        toast({
          title: "减少成功",
          description: `已为用户 ${decreaseUsername} 减少 ${data.decreased} 次登录，当前剩余 ${data.newLogins} 次`,
        });
        setDecreaseUsername("");
        setDecreaseLogins("");
        fetchUsers();
      } else {
        toast({ variant: "destructive", title: "减少失败", description: data.error || "未知错误" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "减少失败", description: error.message });
    } finally {
      setIsDecreasingLogins(false);
    }
  };

  const handleAddPdfLimit = async () => {
    if (!token) return;
    
    if (!pdfUsername.trim()) {
      toast({ variant: "destructive", title: "请输入用户名" });
      return;
    }
    const amountToAdd = parseInt(pdfAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      toast({ variant: "destructive", title: "请输入有效的积分数量", description: "积分数量必须为正整数" });
      return;
    }
    setIsAddingPdf(true);
    try {
      const data = await adminApi.increasePdfLimit(token, { username: pdfUsername, increaseAmount: amountToAdd });
      if (data.success) {
        toast({
          title: "添加成功",
          description: `已为用户 ${pdfUsername} 添加 ${amountToAdd} 积分，当前剩余 ${data.newPdfLimit} 积分`,
        });
        setPdfUsername("");
        setPdfAmount("");
        fetchUsers();
      } else {
        toast({ variant: "destructive", title: "添加失败", description: data.error || "未知错误" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "添加失败", description: error.message });
    } finally {
      setIsAddingPdf(false);
    }
  };

  const handleDecreasePdfLimit = async () => {
    if (!token) return;
    
    if (!decreasePdfUsername.trim()) {
      toast({ variant: "destructive", title: "请输入用户名" });
      return;
    }
    const amountToDecrease = parseInt(decreasePdfAmount);
    if (isNaN(amountToDecrease) || amountToDecrease <= 0) {
      toast({ variant: "destructive", title: "请输入有效的积分数量", description: "积分数量必须为正整数" });
      return;
    }
    setIsDecreasingPdf(true);
    try {
      const data = await adminApi.decreasePdfLimit(token, { username: decreasePdfUsername, decreaseAmount: amountToDecrease });
      if (data.success) {
        toast({
          title: "减少成功",
          description: `已为用户 ${decreasePdfUsername} 减少 ${amountToDecrease} 积分，当前剩余 ${data.newPdfLimit} 积分`,
        });
        setDecreasePdfUsername("");
        setDecreasePdfAmount("");
        fetchUsers();
      } else {
        toast({ variant: "destructive", title: "减少失败", description: data.error || "未知错误" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "减少失败", description: error.message });
    } finally {
      setIsDecreasingPdf(false);
    }
  };

  const handleResetPdfLimit = async () => {
    if (!token) return;
    
    if (!resetPdfUsername.trim()) {
      toast({ variant: "destructive", title: "请输入用户名" });
      return;
    }
    setIsResettingPdf(true);
    try {
      const data = await adminApi.resetPdfLimit(token, { username: resetPdfUsername });
      if (data.success) {
        toast({ title: "重置成功", description: `已将用户 ${resetPdfUsername} 的PDF积分重置为 0` });
        setResetPdfUsername("");
        fetchUsers();
      } else {
        toast({ variant: "destructive", title: "重置失败", description: data.error || "未知错误" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "重置失败", description: error.message });
    } finally {
      setIsResettingPdf(false);
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border-2 border-indigo-100 bg-white">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800">系统验证</CardTitle>
            <CardDescription className="text-base text-gray-500">请输入管理员凭据以继续</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-username" className="text-gray-700">
                用户名
              </Label>
              <Input
                id="verify-username"
                type="text"
                value={verifyUsername}
                onChange={(e) => setVerifyUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                className="h-12 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-password" className="text-gray-700">
                密码
              </Label>
              <Input
                id="verify-password"
                type="password"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                className="h-12 border-gray-200"
              />
            </div>
            <Button
              onClick={handleVerify}
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 border-0"
            >
              验证身份
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
                onClick={fetchTodayLoginCount}
                variant="outline"
                size="sm"
                disabled={isLoadingLoginCount}
                className="border-2 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 h-10 px-4"
              >
                {isLoadingLoginCount ? <Loader2 className="h-4 w-4 animate-spin" /> : "刷新"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="px-6 py-4 bg-white dark:bg-indigo-900/50 rounded-xl shadow-lg border-2 border-indigo-300 dark:border-indigo-600">
                {isLoadingLoginCount ? (
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
                {isLoadingLoginCount ? (
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

        {/* 用户积分管理 - 登录次数与PDF积分 */}
        <Card className="shadow-lg border-2 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">用户积分管理</CardTitle>
            <CardDescription>管理用户登录次数与PDF积分</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              {/* 顶层分栏：登录次数 / PDF积分 */}
              <TabsList className="grid w-full grid-cols-2 h-12 mb-6">
                <TabsTrigger value="login" className="text-base">
                  <LogIn className="mr-2 h-4 w-4" />
                  登录次数操作
                </TabsTrigger>
                <TabsTrigger value="pdf" className="text-base">
                  <CreditCard className="mr-2 h-4 w-4" />
                  PDF积分操作
                </TabsTrigger>
              </TabsList>

              {/* 登录次数操作 */}
              <TabsContent value="login">
                <Tabs defaultValue="add" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-10">
                    <TabsTrigger value="add" className="text-sm">
                      <UserPlus className="mr-1 h-3 w-3" />
                      添加次数
                    </TabsTrigger>
                    <TabsTrigger value="decrease" className="text-sm">
                      <Minus className="mr-1 h-3 w-3" />
                      减少次数
                    </TabsTrigger>
                    <TabsTrigger value="reset" className="text-sm">
                      <RotateCcw className="mr-1 h-3 w-3" />
                      重置次数
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="add" className="mt-4">
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                        添加登录次数
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">为指定用户增加登录次数</p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="target-username">用户名</Label>
                          <Input
                            id="target-username"
                            value={targetUsername}
                            onChange={(e) => setTargetUsername(e.target.value)}
                            placeholder="请输入用户名"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="add-logins">添加登录次数</Label>
                          <Input
                            id="add-logins"
                            type="number"
                            min="1"
                            value={addLogins}
                            onChange={(e) => setAddLogins(e.target.value)}
                            placeholder="请输入要添加的次数"
                            className="h-10"
                          />
                        </div>
                        <Button
                          onClick={handleAddLogins}
                          disabled={isAddingLogins}
                          className="w-full h-11 text-base bg-green-600 hover:bg-green-700"
                        >
                          {isAddingLogins ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              添加中...
                            </>
                          ) : (
                            "确认添加"
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="decrease" className="mt-4">
                    <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Minus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        减少登录次数
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">为指定用户减少登录次数</p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="decrease-username">用户名</Label>
                          <Input
                            id="decrease-username"
                            value={decreaseUsername}
                            onChange={(e) => setDecreaseUsername(e.target.value)}
                            placeholder="请输入用户名"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="decrease-logins">减少登录次数</Label>
                          <Input
                            id="decrease-logins"
                            type="number"
                            min="1"
                            value={decreaseLogins}
                            onChange={(e) => setDecreaseLogins(e.target.value)}
                            placeholder="请输入要减少的次数"
                            className="h-10"
                          />
                        </div>
                        <Button
                          onClick={handleDecreaseLogins}
                          disabled={isDecreasingLogins}
                          className="w-full h-11 text-base bg-orange-600 hover:bg-orange-700"
                        >
                          {isDecreasingLogins ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              减少中...
                            </>
                          ) : (
                            "确认减少"
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reset" className="mt-4">
                    <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-red-600 dark:text-red-400" />
                        重置登录次数
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">将指定用户的登录次数重置为 0</p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-username">用户名</Label>
                          <Input
                            id="reset-username"
                            value={resetUsername}
                            onChange={(e) => setResetUsername(e.target.value)}
                            placeholder="请输入用户名"
                            className="h-10"
                          />
                        </div>
                        <Button
                          onClick={handleResetLogins}
                          disabled={isResetting}
                          variant="destructive"
                          className="w-full h-11 text-base"
                        >
                          {isResetting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              重置中...
                            </>
                          ) : (
                            "确认重置为 0"
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* PDF积分操作 */}
              <TabsContent value="pdf">
                <Tabs defaultValue="add" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-10">
                    <TabsTrigger value="add" className="text-sm">
                      <UserPlus className="mr-1 h-3 w-3" />
                      添加积分
                    </TabsTrigger>
                    <TabsTrigger value="decrease" className="text-sm">
                      <Minus className="mr-1 h-3 w-3" />
                      减少积分
                    </TabsTrigger>
                    <TabsTrigger value="reset" className="text-sm">
                      <RotateCcw className="mr-1 h-3 w-3" />
                      重置积分
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="add" className="mt-4">
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        添加PDF积分
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">为指定用户增加PDF积分</p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="pdf-username">用户名</Label>
                          <Input
                            id="pdf-username"
                            value={pdfUsername}
                            onChange={(e) => setPdfUsername(e.target.value)}
                            placeholder="请输入用户名"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pdf-amount">添加积分数量</Label>
                          <Input
                            id="pdf-amount"
                            type="number"
                            min="1"
                            value={pdfAmount}
                            onChange={(e) => setPdfAmount(e.target.value)}
                            placeholder="请输入要添加的积分数量"
                            className="h-10"
                          />
                        </div>
                        <Button
                          onClick={handleAddPdfLimit}
                          disabled={isAddingPdf}
                          className="w-full h-11 text-base bg-purple-600 hover:bg-purple-700"
                        >
                          {isAddingPdf ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              添加中...
                            </>
                          ) : (
                            "确认添加"
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="decrease" className="mt-4">
                    <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Minus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        减少PDF积分
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">为指定用户减少PDF积分</p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="decrease-pdf-username">用户名</Label>
                          <Input
                            id="decrease-pdf-username"
                            value={decreasePdfUsername}
                            onChange={(e) => setDecreasePdfUsername(e.target.value)}
                            placeholder="请输入用户名"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="decrease-pdf-amount">减少积分数量</Label>
                          <Input
                            id="decrease-pdf-amount"
                            type="number"
                            min="1"
                            value={decreasePdfAmount}
                            onChange={(e) => setDecreasePdfAmount(e.target.value)}
                            placeholder="请输入要减少的积分数量"
                            className="h-10"
                          />
                        </div>
                        <Button
                          onClick={handleDecreasePdfLimit}
                          disabled={isDecreasingPdf}
                          className="w-full h-11 text-base bg-orange-600 hover:bg-orange-700"
                        >
                          {isDecreasingPdf ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              减少中...
                            </>
                          ) : (
                            "确认减少"
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reset" className="mt-4">
                    <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-red-600 dark:text-red-400" />
                        重置PDF积分
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">将指定用户的PDF积分重置为 0</p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-pdf-username">用户名</Label>
                          <Input
                            id="reset-pdf-username"
                            value={resetPdfUsername}
                            onChange={(e) => setResetPdfUsername(e.target.value)}
                            placeholder="请输入用户名"
                            className="h-10"
                          />
                        </div>
                        <Button
                          onClick={handleResetPdfLimit}
                          disabled={isResettingPdf}
                          variant="destructive"
                          className="w-full h-11 text-base"
                        >
                          {isResettingPdf ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              重置中...
                            </>
                          ) : (
                            "确认重置为 0"
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 充值卡管理 */}
        <Card className="shadow-lg border-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Ticket className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">充值卡管理</CardTitle>
                  <CardDescription>创建和查看充值卡</CardDescription>
                </div>
              </div>
              <Button onClick={fetchCards} variant="outline" size="sm" className="border-2" disabled={isFetchingCards}>
                {isFetchingCards ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <List className="h-4 w-4 mr-2" />
                )}
                刷新列表
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="create" className="text-base">
                  <UserPlus className="mr-2 h-4 w-4" />
                  批量创建
                </TabsTrigger>
                <TabsTrigger value="list" className="text-base">
                  <List className="mr-2 h-4 w-4" />
                  查看列表
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4 mt-6">
                <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 rounded-lg border-2 border-teal-200 dark:border-teal-800">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    批量创建充值卡
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">批量生成充值卡密（最多100张）</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-type">卡类型</Label>
                      <Select value={newCardType} onValueChange={setNewCardType}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="选择卡类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="login">登录次数充值卡</SelectItem>
                          <SelectItem value="pdf">PDF积分充值卡</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-values">充值数量（每张卡）</Label>
                      <Input
                        id="card-values"
                        type="number"
                        min="1"
                        value={newCardValues}
                        onChange={(e) => setNewCardValues(e.target.value)}
                        placeholder="请输入每张卡的充值数量"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-count">生成张数</Label>
                      <Input
                        id="card-count"
                        type="number"
                        min="1"
                        max="100"
                        value={newCardCount}
                        onChange={(e) => setNewCardCount(e.target.value)}
                        placeholder="请输入要生成的张数（1-100）"
                        className="h-10"
                      />
                    </div>
                    <Button
                      onClick={handleCreateCards}
                      disabled={isCreatingCards}
                      className="w-full h-11 text-base bg-teal-600 hover:bg-teal-700"
                    >
                      {isCreatingCards ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          创建中...
                        </>
                      ) : (
                        "确认创建"
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="list" className="space-y-4 mt-6">
                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={cardSearchQuery}
                    onChange={(e) => setCardSearchQuery(e.target.value)}
                    placeholder="搜索卡密ID或使用者..."
                    className="pl-10 h-10"
                  />
                </div>

                {/* 卡片统计 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800 text-center">
                    <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{cards.length}</div>
                    <div className="text-xs text-muted-foreground">总数</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {cards.filter((c) => !c.used).length}
                    </div>
                    <div className="text-xs text-muted-foreground">未使用</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-950/30 rounded-lg border border-gray-200 dark:border-gray-800 text-center">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {cards.filter((c) => c.used).length}
                    </div>
                    <div className="text-xs text-muted-foreground">已使用</div>
                  </div>
                </div>

                {/* 导出按钮 */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => exportCardsToCSV(true)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    导出全部CSV
                  </Button>
                  <Button
                    onClick={() => exportCardsToCSV(false)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    导出未使用CSV
                  </Button>
                </div>

                {/* 卡片列表 */}
                {isFetchingCards ? (
                  <div className="border-2 rounded-lg p-8 bg-muted/50 animate-pulse">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">正在加载充值卡列表...</p>
                    </div>
                  </div>
                ) : paginatedCards.length > 0 ? (
                  <div className="border-2 rounded-lg p-3 max-h-96 overflow-auto bg-gradient-to-br from-muted/30 to-muted/50">
                    <div className="space-y-2">
                      {paginatedCards.map((card, index) => (
                        <div
                          key={card.id}
                          className={`flex justify-between items-center p-4 rounded-lg hover:shadow-lg transition-all border-2 animate-scale-in ${
                            card.used
                              ? "bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 border-gray-300 dark:border-gray-700"
                              : "bg-gradient-to-r from-background to-muted/20 border-border/50 hover:border-teal-300"
                          }`}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm truncate">{card.id}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(card.id)}
                              >
                                {copiedId === card.id ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{card.type === "login" ? "登录次数" : "PDF积分"}</span>
                              <span>·</span>
                              <span>{card.values} 点</span>
                              {card.used && card.used_by && (
                                <>
                                  <span>·</span>
                                  <span>使用者: {card.used_by}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={card.used ? "secondary" : "default"}
                            className={card.used ? "" : "bg-teal-600"}
                          >
                            {card.used ? "已使用" : "未使用"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border-2 rounded-lg">
                    {cardSearchQuery ? "未找到匹配的充值卡" : "暂无充值卡数据"}
                  </div>
                )}

                {/* 分页控件 */}
                {cardTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      第 {cardCurrentPage} / {cardTotalPages} 页
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCardCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={cardCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCardCurrentPage((p) => Math.min(cardTotalPages, p + 1))}
                        disabled={cardCurrentPage === cardTotalPages}
                      >
                        下一页
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 用户列表（合并查询功能） */}
        <Card className="shadow-lg border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <List className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">用户列表</CardTitle>
                  <CardDescription>
                    共 {users.length} 个用户 {searchQuery && `· 搜索结果 ${filteredUsers.length} 个`}
                  </CardDescription>
                </div>
              </div>
              <Button onClick={fetchUsers} variant="outline" size="sm" className="border-2" disabled={isFetchingUsers}>
                {isFetchingUsers ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <List className="h-4 w-4 mr-2" />
                )}
                刷新列表
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索用户名..."
                className="pl-10 h-10"
              />
            </div>

            {/* 用户列表 */}
            {isFetchingUsers ? (
              <div className="border-2 rounded-lg p-8 bg-muted/50 animate-pulse">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">正在加载用户列表...</p>
                </div>
              </div>
            ) : paginatedUsers.length > 0 ? (
              <div className="border-2 rounded-lg p-3 max-h-80 overflow-auto bg-gradient-to-br from-muted/30 to-muted/50">
                <div className="space-y-2">
                  {paginatedUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className="flex justify-between items-center p-4 bg-gradient-to-r from-background to-muted/20 rounded-lg hover:shadow-lg transition-all border-2 border-border/50 hover:border-primary/30 animate-scale-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="font-bold text-lg block truncate">{user.username}</span>
                        <span className="text-xs text-muted-foreground font-mono">密码: {user.password}</span>
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <Badge variant="default" className="flex items-center gap-1.5 px-3 py-1 justify-start">
                          <LogIn className="h-3.5 w-3.5" />
                          <span className="font-medium">登录次数: {user.remaining_logins}</span>
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 justify-start">
                          <CreditCard className="h-3.5 w-3.5" />
                          <span className="font-medium">PDF积分: {user.pdf_limit}</span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border-2 rounded-lg">
                {searchQuery ? "未找到匹配的用户" : "暂无用户数据"}
              </div>
            )}

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  第 {currentPage} / {totalPages} 页
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 登录统计图表 */}
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
                        onSelect={(date) => date && setSelectedDate(date)}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="pointer-events-auto"
                        locale={zhCN}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* 视图切换按钮 */}
              <div className="flex items-center gap-2">
                <Button
                  variant={statsViewMode === "day" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatsViewMode("day")}
                >
                  日视图
                </Button>
                <Button
                  variant={statsViewMode === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatsViewMode("week")}
                >
                  周视图
                </Button>
                <Button
                  variant={statsViewMode === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatsViewMode("month")}
                >
                  月视图
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 汇总统计卡片 (周/月视图) */}
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

            {/* 图表区域 */}
            {statsViewMode === "day" ? (
              // 日视图 - 小时统计
              isLoadingHourlyStats ? (
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
            ) : // 周/月视图 - 每日统计
            isLoadingRangeStats ? (
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
                onClick={() => (statsViewMode === "day" ? fetchHourlyStats() : fetchRangeStats(statsViewMode))}
                disabled={isLoadingHourlyStats || isLoadingRangeStats}
              >
                {isLoadingHourlyStats || isLoadingRangeStats ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                刷新数据
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 用户活跃度热力图 */}
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
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHeatmapData}
                disabled={isLoadingHeatmap}
              >
                {isLoadingHeatmap ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                刷新
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingHeatmap ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : heatmapData.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* 热力图网格 */}
                  <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1">
                    {/* 表头 - 小时 */}
                    <div className="text-xs font-medium text-muted-foreground"></div>
                    {Array.from({ length: 24 }, (_, hour) => (
                      <div key={hour} className="text-xs text-center text-muted-foreground py-2">
                        {hour.toString().padStart(2, '0')}
                      </div>
                    ))}
                    
                    {/* 数据行 - 每天 */}
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
                          
                          // 根据登录次数计算颜色强度
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
                  
                  {/* 图例 */}
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

        {/* Top活跃用户排行榜 */}
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
                  value={topUsersPeriod.toString()}
                  onValueChange={(value) => fetchTopActiveUsers(parseInt(value))}
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
                  onClick={() => fetchTopActiveUsers(topUsersPeriod)}
                  disabled={isLoadingTopUsers}
                >
                  {isLoadingTopUsers ? (
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
            {isLoadingTopUsers ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : topActiveUsers.length > 0 ? (
              <div className="space-y-3">
                {topActiveUsers.map((user, index) => {
                  // 根据排名设置不同的徽章颜色
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
                      {/* 排名 */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${badgeColor}`}>
                        {icon || `#${index + 1}`}
                      </div>
                      
                      {/* 用户信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg truncate">{user.username}</div>
                        <div className="text-sm text-muted-foreground">
                          活跃天数: {user.activeDays} 天 · 日均登录: {user.avgLoginsPerDay} 次
                        </div>
                      </div>
                      
                      {/* 登录统计 */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-2xl font-bold text-primary">{user.totalLogins}</div>
                        <div className="text-xs text-muted-foreground">总登录次数</div>
                      </div>
                      
                      {/* 柱状图 */}
                      <div className="flex-shrink-0 w-32 hidden md:block">
                        <div className="h-8 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (user.totalLogins / (topActiveUsers[0]?.totalLogins || 1)) * 100)}%`
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

        {/* 异常登录检测 */}
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
                  value={anomalyPeriod.toString()}
                  onValueChange={(value) => fetchAnomalyDetection(parseInt(value))}
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
                  onClick={() => fetchAnomalyDetection(anomalyPeriod)}
                  disabled={isLoadingAnomaly}
                >
                  {isLoadingAnomaly ? (
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
            {isLoadingAnomaly ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : anomalyDetection ? (
              <div className="space-y-6">
                {/* 异常统计摘要 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <span className="font-semibold text-red-900 dark:text-red-100">频繁登录用户</span>
                    </div>
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {anomalyDetection.summary.totalFrequentLoginUsers}
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
                      {anomalyDetection.summary.totalAbnormalTimeLogins}
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
                      {anomalyDetection.summary.totalDailyAnomalyUsers}
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      单日登录超过20次
                    </div>
                  </div>
                </div>

                {/* 详细异常列表 */}
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
                    {anomalyDetection.anomalies.frequentLogins.length > 0 ? (
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
                            {anomalyDetection.anomalies.frequentLogins.map((record, idx) => (
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
                    {anomalyDetection.anomalies.abnormalTimeLogins.length > 0 ? (
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
                            {anomalyDetection.anomalies.abnormalTimeLogins.slice(0, 20).map((record, idx) => (
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
                        {anomalyDetection.anomalies.abnormalTimeLogins.length > 20 && (
                          <div className="text-center py-2 text-xs text-muted-foreground border-t">
                            显示前20条，共 {anomalyDetection.anomalies.abnormalTimeLogins.length} 条记录
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
                    {anomalyDetection.anomalies.dailyAnomalies.length > 0 ? (
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
                            {anomalyDetection.anomalies.dailyAnomalies.map((record, idx) => (
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
      </div>
    </div>
  );
};

export default SuperAdd;
