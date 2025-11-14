import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, UserPlus, List, Loader2, RotateCcw } from "lucide-react";

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
  const [resetUsername, setResetUsername] = useState("");
  const [isAddingLogins, setIsAddingLogins] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsFetchingUsers(true);
    try {
      console.log('Fetching users...');
      const { data, error } = await supabase.functions.invoke('get-all-users');

      console.log('Response:', data);

      if (error) {
        console.error('Error:', error);
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
      console.error('Fetch users error:', error);
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
      toast({
        title: "验证成功",
        description: "欢迎进入管理界面",
      });
    } else {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "用户名或密码错误",
      });
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
      // 查找用户
      const user = users.find(u => u.username === resetUsername);
      if (!user) {
        toast({
          variant: "destructive",
          title: "用户不存在",
          description: "请检查用户名是否正确",
        });
        return;
      }

      // 调用 edge function 重置登录次数
      const { data, error } = await supabase.functions.invoke(
        "reset-user-logins",
        {
          body: {
            userId: user.id,
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
        // 刷新用户列表
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
      // 查找用户
      const user = users.find(u => u.username === targetUsername);
      if (!user) {
        toast({
          variant: "destructive",
          title: "用户不存在",
          description: "请检查用户名是否正确",
        });
        return;
      }

      // 调用 edge function 增加登录次数
      const { data, error } = await supabase.functions.invoke(
        "update-user-logins",
        {
          body: {
            userId: user.id,
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
        // 刷新用户列表
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

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">系统验证</CardTitle>
            <CardDescription>请输入管理员凭据</CardDescription>
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
              />
            </div>
            <Button onClick={handleVerify} className="w-full">
              验证
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              <CardTitle>用户登录次数管理</CardTitle>
            </div>
            <CardDescription>为用户添加登录次数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <Button 
                onClick={fetchUsers} 
                variant="outline" 
                className="gap-2"
                disabled={isFetchingUsers}
              >
                {isFetchingUsers ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    加载中...
                  </>
                ) : (
                  <>
                    <List className="h-4 w-4" />
                    显示所有用户
                  </>
                )}
              </Button>
            </div>

            {isFetchingUsers && (
              <div className="border rounded-lg p-8 bg-muted/50 animate-fade-in">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">正在加载用户列表...</p>
                </div>
              </div>
            )}

            {showUserList && !isFetchingUsers && users.length > 0 && (
              <div className="border rounded-lg p-4 max-h-60 overflow-auto bg-muted/50 animate-fade-in">
                <h3 className="font-semibold mb-3 text-sm">用户列表 ({users.length})</h3>
                <div className="space-y-2">
                  {users.map((user, index) => (
                    <div
                      key={user.id}
                      className="flex justify-between items-center p-3 bg-background rounded hover:bg-accent transition-colors animate-scale-in gap-4"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex-1">
                        <span className="font-medium block">{user.username}</span>
                        <span className="text-xs text-muted-foreground">密码: {user.password}</span>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        剩余登录: {user.remaining_logins} 次
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showUserList && !isFetchingUsers && users.length === 0 && (
              <div className="border rounded-lg p-8 bg-muted/50 text-center animate-fade-in">
                <p className="text-sm text-muted-foreground">暂无用户数据</p>
              </div>
            )}

            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-sm">添加登录次数</h3>
              <p className="text-xs text-muted-foreground">为指定用户增加登录次数</p>
              
              <div className="space-y-2">
                <Label htmlFor="target-username">用户名</Label>
                <Input
                  id="target-username"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  placeholder="请输入用户名"
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
                />
              </div>

              <Button
                onClick={handleAddLogins}
                disabled={isAddingLogins}
                className="w-full"
              >
                {isAddingLogins ? "添加中..." : "确认添加"}
              </Button>
            </div>

            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-sm">重置登录次数</h3>
              <p className="text-xs text-muted-foreground">将指定用户的登录次数重置为 0</p>
              
              <div className="space-y-2">
                <Label htmlFor="reset-username">用户名</Label>
                <Input
                  id="reset-username"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="请输入用户名"
                />
              </div>

              <Button
                onClick={handleResetLogins}
                disabled={isResetting}
                variant="destructive"
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {isResetting ? "重置中..." : "重置为0"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdd;
