import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, UserPlus, List } from "lucide-react";

interface User {
  id: string;
  username: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, remaining_logins')
        .order('username');

      if (error) throw error;
      setUsers(data || []);
      setShowUserList(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "获取用户列表失败",
        description: error.message,
      });
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

    setIsLoading(true);
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
      setIsLoading(false);
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
              <Button onClick={fetchUsers} variant="outline" className="gap-2">
                <List className="h-4 w-4" />
                显示所有用户
              </Button>
            </div>

            {showUserList && users.length > 0 && (
              <div className="border rounded-lg p-4 max-h-60 overflow-auto bg-muted/50">
                <h3 className="font-semibold mb-3 text-sm">用户列表</h3>
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex justify-between items-center p-2 bg-background rounded hover:bg-accent transition-colors"
                    >
                      <span className="font-medium">{user.username}</span>
                      <span className="text-sm text-muted-foreground">
                        剩余登录: {user.remaining_logins} 次
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-sm">添加登录次数</h3>
              
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
            </div>

            <Button
              onClick={handleAddLogins}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "添加中..." : "确认添加"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdd;
