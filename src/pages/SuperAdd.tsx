import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, UserPlus, List, Loader2, RotateCcw, Search, Minus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  username: string;
  password: string;
  remaining_logins: number;
}

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
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsFetchingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-all-users');

      if (error) {
        throw error;
      }

      if (data.success) {
        setUsers(data.users || []);
        setShowUserList(true);
        toast({
          title: "加载成功",
          description: `共 ${data.users?.length || 0} 个用户`,
        });
      } else {
        throw new Error(data.error || '获取用户列表失败');
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
      const { data, error } = await supabase.functions.invoke(
        "query-user",
        {
          body: {
            username: queryUsername,
          },
        }
      );

      if (error) throw error;

      if (data.success) {
        setQueriedUser(data.user);
        toast({
          title: "查询成功",
          description: `用户 ${data.user.username} 剩余登录次数: ${data.user.remaining_logins} 次`,
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
      const { data, error } = await supabase.functions.invoke(
        "reset-user-logins",
        {
          body: {
            username: resetUsername,
          },
        }
      );

      if (error) throw error;

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
      const { data, error } = await supabase.functions.invoke(
        "update-user-logins",
        {
          body: {
            username: targetUsername,
            addLogins: loginsToAdd,
          },
        }
      );

      if (error) throw error;

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
      const { data, error } = await supabase.functions.invoke(
        "decrease-user-logins",
        {
          body: {
            username: decreaseUsername,
            decreaseLogins: loginsToDecrease,
          },
        }
      );

      if (error) throw error;

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
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
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
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
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
                  onKeyPress={(e) => e.key === 'Enter' && handleQueryUser()}
                  className="h-10"
                />
              </div>

              <Button
                onClick={handleQueryUser}
                disabled={isQuerying}
                className="w-full h-10"
                variant="default"
              >
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
                      <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{queriedUser.remaining_logins}</span>
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
                        className="flex justify-between items-center p-3 bg-background rounded-lg hover:shadow-md transition-all border animate-scale-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block truncate">{user.username}</span>
                          <span className="text-xs text-muted-foreground">密码: {user.password}</span>
                        </div>
                        <div className="ml-3 flex items-center gap-2">
                          <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full whitespace-nowrap">
                            {user.remaining_logins} 次
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 操作标签页 */}
        <Card className="shadow-lg border-2">
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
      </div>
    </div>
  );
};

export default SuperAdd;
