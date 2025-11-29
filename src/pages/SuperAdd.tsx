import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
// import { supabase } from "@/integrations/supabase/client";
import { Shield, UserPlus, List, Loader2, RotateCcw, Search, Minus, CreditCard, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  username: string;
  password: string;
  remaining_logins: number;
  pdf_limit: number;
}

// 设置一次登录后72小时内无需重新验证
const SUPERADD_LOGIN_KEY = "superadd_login_timestamp";
const SUPERADD_SESSION_DURATION = 72 * 60 * 60 * 1000; // 72小时（毫秒）

const SuperAdd = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [verifyUsername, setVerifyUsername] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const [targetUsername, setTargetUsername] = useState("");
  const [addLogins, setAddLogins] = useState("");
  const [decreaseUsername, setDecreaseUsername] = useState("");
  const [decreaseLogins, setDecreaseLogins] = useState("");
  const [resetUsername, setResetUsername] = useState("");
  const [isAddingLogins, setIsAddingLogins] = useState(false);
  const [isDecreasingLogins, setIsDecreasingLogins] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [queryUsername, setQueryUsername] = useState("");
  const [queriedUser, setQueriedUser] = useState<User | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
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

  const { toast } = useToast();

  // API基础URL - 根据你的环境配置进行调整
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

  // 检查登录状态是否在72小时内
  useEffect(() => {
    const loginTimestamp = localStorage.getItem(SUPERADD_LOGIN_KEY);
    if (loginTimestamp) {
      const loginTime = parseInt(loginTimestamp, 10);
      const currentTime = Date.now();
      const timeDiff = currentTime - loginTime;

      if (timeDiff < SUPERADD_SESSION_DURATION) {
        // 在72小时内，保持登录状态
        setIsVerified(true);
      } else {
        // 超过72小时，清除时间戳
        localStorage.removeItem(SUPERADD_LOGIN_KEY);
      }
    }
  }, []);
  // 获取今日登录统计
  const fetchTodayLoginCount = async () => {
    setIsLoadingLoginCount(true);
    try {
      const response = await fetch(`${API_BASE_URL}/get-today-login-count`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setTodayLoginCount(data.total_logins);
        setDistinctUsers(data.distinct_users);
      } else {
        console.error("获取登录统计失败:", data.error);
      }
    } catch (error) {
      console.error("获取登录统计时出错:", error);
    } finally {
      setIsLoadingLoginCount(false);
    }
  };

  // 登录验证成功后获取今日登录次数
  useEffect(() => {
    if (isVerified) {
      fetchTodayLoginCount();
    }
  }, [isVerified]);

  const fetchUsers = async () => {
    setIsFetchingUsers(true);
    try {
      // 替换 Supabase 调用为本地 API 调用
      const response = await fetch(`${API_BASE_URL}/get-all-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
        setShowUserList(true);
        toast({
          title: "加载成功",
          description: `共 ${data.users?.length || 0} 个用户`,
        });
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

  const handleVerify = () => {
    if (verifyUsername === "zxx" && verifyPassword === "991218aa") {
      // 登录成功时记录当前时间戳
      localStorage.setItem(SUPERADD_LOGIN_KEY, Date.now().toString());
      setIsVerified(true);
    } else {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "用户名或密码错误",
      });
    }
  };

  const handleQueryUser = async () => {
    if (!queryUsername.trim()) {
      toast({
        variant: "destructive",
        title: "请输入用户名",
      });
      return;
    }

    setIsQuerying(true);
    setQueriedUser(null);
    try {
      // 替换 Supabase 调用为本地 API 调用
      const response = await fetch(`${API_BASE_URL}/query-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: queryUsername,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQueriedUser(data.user);
        toast({
          title: "查询成功",
          description: `用户 ${data.user.username} 剩余登录次数: ${data.user.remaining_logins} 次，PDF积分: ${data.user.pdf_limit}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "查询失败",
          description: data.error || "未知错误",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "查询失败",
        description: error.message,
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleResetLogins = async () => {
    if (!resetUsername.trim()) {
      toast({
        variant: "destructive",
        title: "请输入用户名",
      });
      return;
    }

    setIsResetting(true);
    try {
      // 替换 Supabase 调用为本地 API 调用
      const response = await fetch(`${API_BASE_URL}/reset-user-logins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: resetUsername,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "重置成功",
          description: `已将用户 ${resetUsername} 的登录次数重置为 0`,
        });
        setResetUsername("");
        if (showUserList) {
          fetchUsers();
        }
      } else {
        toast({
          variant: "destructive",
          title: "重置失败",
          description: data.error || "未知错误",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "重置失败",
        description: error.message,
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleAddLogins = async () => {
    if (!targetUsername.trim()) {
      toast({
        variant: "destructive",
        title: "请输入用户名",
      });
      return;
    }

    const loginsToAdd = parseInt(addLogins);
    if (isNaN(loginsToAdd) || loginsToAdd <= 0) {
      toast({
        variant: "destructive",
        title: "请输入有效的登录次数",
        description: "登录次数必须为正整数",
      });
      return;
    }

    setIsAddingLogins(true);
    try {
      // 替换 Supabase 调用为本地 API 调用
      const response = await fetch(`${API_BASE_URL}/update-user-logins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: targetUsername,
          addLogins: loginsToAdd,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "添加成功",
          description: `已为用户 ${targetUsername} 添加 ${loginsToAdd} 次登录，当前剩余 ${data.newLogins} 次`,
        });
        setTargetUsername("");
        setAddLogins("");
        if (showUserList) {
          fetchUsers();
        }
      } else {
        toast({
          variant: "destructive",
          title: "添加失败",
          description: data.error || "未知错误",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "添加失败",
        description: error.message,
      });
    } finally {
      setIsAddingLogins(false);
    }
  };

  const handleDecreaseLogins = async () => {
    if (!decreaseUsername.trim()) {
      toast({
        variant: "destructive",
        title: "请输入用户名",
      });
      return;
    }

    const loginsToDecrease = parseInt(decreaseLogins);
    if (isNaN(loginsToDecrease) || loginsToDecrease <= 0) {
      toast({
        variant: "destructive",
        title: "请输入有效的登录次数",
        description: "登录次数必须为正整数",
      });
      return;
    }

    setIsDecreasingLogins(true);
    try {
      // 替换 Supabase 调用为本地 API 调用
      const response = await fetch(`${API_BASE_URL}/decrease-user-logins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: decreaseUsername,
          decreaseLogins: loginsToDecrease,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "减少成功",
          description: `已为用户 ${decreaseUsername} 减少 ${data.decreased} 次登录，当前剩余 ${data.newLogins} 次`,
        });
        setDecreaseUsername("");
        setDecreaseLogins("");
        if (showUserList) {
          fetchUsers();
        }
      } else {
        toast({
          variant: "destructive",
          title: "减少失败",
          description: data.error || "未知错误",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "减少失败",
        description: error.message,
      });
    } finally {
      setIsDecreasingLogins(false);
    }
  };

  const handleAddPdfLimit = async () => {
    if (!pdfUsername.trim()) {
      toast({
        variant: "destructive",
        title: "请输入用户名",
      });
      return;
    }

    const amountToAdd = parseInt(pdfAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      toast({
        variant: "destructive",
        title: "请输入有效的积分数量",
        description: "积分数量必须为正整数",
      });
      return;
    }

    setIsAddingPdf(true);
    try {
      const response = await fetch(`${API_BASE_URL}/increase-pdf-limit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: pdfUsername,
          increaseAmount: amountToAdd,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "添加成功",
          description: `已为用户 ${pdfUsername} 添加 ${amountToAdd} 积分，当前剩余 ${data.newPdfLimit} 积分`,
        });
        setPdfUsername("");
        setPdfAmount("");
        if (showUserList) {
          fetchUsers();
        }
      } else {
        toast({
          variant: "destructive",
          title: "添加失败",
          description: data.error || "未知错误",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "添加失败",
        description: error.message,
      });
    } finally {
      setIsAddingPdf(false);
    }
  };

  const handleDecreasePdfLimit = async () => {
    if (!decreasePdfUsername.trim()) {
      toast({
        variant: "destructive",
        title: "请输入用户名",
      });
      return;
    }

    const amountToDecrease = parseInt(decreasePdfAmount);
    if (isNaN(amountToDecrease) || amountToDecrease <= 0) {
      toast({
        variant: "destructive",
        title: "请输入有效的积分数量",
        description: "积分数量必须为正整数",
      });
      return;
    }

    setIsDecreasingPdf(true);
    try {
      const response = await fetch(`${API_BASE_URL}/decrease-pdf-limit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: decreasePdfUsername,
          decreaseAmount: amountToDecrease,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "减少成功",
          description: `已为用户 ${decreasePdfUsername} 减少 ${amountToDecrease} 积分，当前剩余 ${data.newPdfLimit} 积分`,
        });
        setDecreasePdfUsername("");
        setDecreasePdfAmount("");
        if (showUserList) {
          fetchUsers();
        }
      } else {
        toast({
          variant: "destructive",
          title: "减少失败",
          description: data.error || "未知错误",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "减少失败",
        description: error.message,
      });
    } finally {
      setIsDecreasingPdf(false);
    }
  };

  const handleResetPdfLimit = async () => {
    if (!resetPdfUsername.trim()) {
      toast({
        variant: "destructive",
        title: "请输入用户名",
      });
      return;
    }

    setIsResettingPdf(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reset-pdf-limit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: resetPdfUsername,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "重置成功",
          description: `已将用户 ${resetPdfUsername} 的PDF积分重置为 0`,
        });
        setResetPdfUsername("");
        if (showUserList) {
          fetchUsers();
        }
      } else {
        toast({
          variant: "destructive",
          title: "重置失败",
          description: data.error || "未知错误",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "重置失败",
        description: error.message,
      });
    } finally {
      setIsResettingPdf(false);
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md shadow-2xl border-2">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">系统验证</CardTitle>
            <CardDescription className="text-base">请输入管理员凭据以继续</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-username">用户名</Label>
              <Input
                id="verify-username"
                type="text"
                value={verifyUsername}
                onChange={(e) => setVerifyUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-password">密码</Label>
              <Input
                id="verify-password"
                type="password"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                className="h-11"
              />
            </div>
            <Button onClick={handleVerify} className="w-full h-11 text-base font-medium">
              验证身份
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="container max-w-6xl mx-auto py-6">
        <div className="mb-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-lg">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">用户登录次数管理系统</h1>
          <p className="text-muted-foreground text-lg">管理和监控用户登录次数</p>
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
              {/* 不同用户数 */}
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
              {/* 总登录次数 */}
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

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* 查询用户卡片 */}
          <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">查询用户</CardTitle>
                  <CardDescription>查询指定用户的剩余登录次数</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query-username">用户名</Label>
                <Input
                  id="query-username"
                  value={queryUsername}
                  onChange={(e) => setQueryUsername(e.target.value)}
                  placeholder="请输入用户名"
                  onKeyPress={(e) => e.key === "Enter" && handleQueryUser()}
                  className="h-10"
                />
              </div>

              <Button onClick={handleQueryUser} disabled={isQuerying} className="w-full h-10" variant="default">
                {isQuerying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    查询中...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    查询
                  </>
                )}
              </Button>

              {queriedUser && (
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg border-2 border-blue-200 dark:border-blue-800 animate-fade-in">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-blue-300 dark:border-blue-700">
                      <span className="text-sm font-medium text-muted-foreground">用户信息</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">用户名:</span>
                      <span className="font-semibold">{queriedUser.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">密码:</span>
                      <span className="font-mono font-medium">{queriedUser.password}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-300 dark:border-blue-700">
                      <span className="text-sm text-muted-foreground">剩余登录次数:</span>
                      <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                        {queriedUser.remaining_logins}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">PDF积分:</span>
                      <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                        {queriedUser.pdf_limit}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 显示所有用户卡片 */}
          <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <List className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">用户列表</CardTitle>
                  <CardDescription>查看所有用户及其登录次数</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={fetchUsers}
                variant="outline"
                className="w-full h-10 border-2"
                disabled={isFetchingUsers}
              >
                {isFetchingUsers ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    加载中...
                  </>
                ) : (
                  <>
                    <List className="mr-2 h-4 w-4" />
                    显示所有用户
                  </>
                )}
              </Button>

              {isFetchingUsers && (
                <div className="mt-4 border-2 rounded-lg p-8 bg-muted/50 animate-pulse">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">正在加载用户列表...</p>
                  </div>
                </div>
              )}

              {showUserList && !isFetchingUsers && users.length > 0 && (
                <div className="mt-4 border-2 rounded-lg p-3 max-h-80 overflow-auto bg-gradient-to-br from-muted/30 to-muted/50 animate-fade-in">
                  <div className="space-y-2">
                    {users.map((user, index) => (
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* 登录次数操作标签页 */}
        <Card className="shadow-lg border-2 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">登录次数操作</CardTitle>
            <CardDescription>添加、减少或重置用户登录次数</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="add" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="add" className="text-base">
                  <UserPlus className="mr-2 h-4 w-4" />
                  添加次数
                </TabsTrigger>
                <TabsTrigger value="decrease" className="text-base">
                  <Minus className="mr-2 h-4 w-4" />
                  减少次数
                </TabsTrigger>
                <TabsTrigger value="reset" className="text-base">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  重置次数
                </TabsTrigger>
              </TabsList>

              <TabsContent value="add" className="space-y-4 mt-6">
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

              <TabsContent value="decrease" className="space-y-4 mt-6">
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

              <TabsContent value="reset" className="space-y-4 mt-6">
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

                    <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                        ⚠️ 警告：此操作将把用户登录次数重置为 0，请谨慎操作！
                      </p>
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
                        <>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          重置为 0
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* PDF积分操作标签页 */}
        <Card className="shadow-lg border-2">
          <CardHeader>
            <CardTitle className="text-2xl">PDF积分操作</CardTitle>
            <CardDescription>添加、减少或重置用户PDF积分</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="add-pdf" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="add-pdf" className="text-base">
                  <UserPlus className="mr-2 h-4 w-4" />
                  添加积分
                </TabsTrigger>
                <TabsTrigger value="decrease-pdf" className="text-base">
                  <Minus className="mr-2 h-4 w-4" />
                  减少积分
                </TabsTrigger>
                <TabsTrigger value="reset-pdf" className="text-base">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  重置积分
                </TabsTrigger>
              </TabsList>

              <TabsContent value="add-pdf" className="space-y-4 mt-6">
                <div className="p-6 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20 rounded-lg border-2 border-cyan-200 dark:border-cyan-800">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    添加PDF积分
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">为指定用户增加PDF下载积分</p>

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
                        placeholder="请输入要添加的积分"
                        className="h-10"
                      />
                    </div>

                    <Button
                      onClick={handleAddPdfLimit}
                      disabled={isAddingPdf}
                      className="w-full h-11 text-base bg-cyan-600 hover:bg-cyan-700"
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

              <TabsContent value="decrease-pdf" className="space-y-4 mt-6">
                <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-lg border-2 border-violet-200 dark:border-violet-800">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Minus className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    减少PDF积分
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">为指定用户减少PDF下载积分</p>

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
                        placeholder="请输入要减少的积分"
                        className="h-10"
                      />
                    </div>

                    <Button
                      onClick={handleDecreasePdfLimit}
                      disabled={isDecreasingPdf}
                      className="w-full h-11 text-base bg-violet-600 hover:bg-violet-700"
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

              <TabsContent value="reset-pdf" className="space-y-4 mt-6">
                <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-lg border-2 border-pink-200 dark:border-pink-800">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-pink-600 dark:text-pink-400" />
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

                    <div className="p-4 bg-pink-100 dark:bg-pink-900/30 border border-pink-300 dark:border-pink-700 rounded-lg">
                      <p className="text-sm text-pink-800 dark:text-pink-200 font-medium">
                        ⚠️ 警告：此操作将把用户PDF积分重置为 0，请谨慎操作！
                      </p>
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
                        <>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          重置为 0
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdd;
