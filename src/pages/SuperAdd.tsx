import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, UserPlus } from "lucide-react";

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
  const [selectedUserId, setSelectedUserId] = useState("");
  const [addLogins, setAddLogins] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isVerified) {
      fetchUsers();
    }
  }, [isVerified]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, remaining_logins')
        .order('username');

      if (error) throw error;
      setUsers(data || []);
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
    if (!selectedUserId || !addLogins) {
      toast({
        variant: "destructive",
        title: "请填写完整信息",
        description: "请选择用户并输入要增加的次数",
      });
      return;
    }

    const loginsToAdd = parseInt(addLogins);
    if (isNaN(loginsToAdd) || loginsToAdd <= 0) {
      toast({
        variant: "destructive",
        title: "输入错误",
        description: "请输入有效的正整数",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-user-logins', {
        body: { userId: selectedUserId, addLogins: loginsToAdd },
      });

      if (error) throw error;

      toast({
        title: "更新成功",
        description: `已为用户增加 ${loginsToAdd} 次登录次数`,
      });

      // 刷新用户列表
      await fetchUsers();
      setSelectedUserId("");
      setAddLogins("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "更新失败",
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

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              <CardTitle>用户登录次数管理</CardTitle>
            </div>
            <CardDescription>为用户增加登录次数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="user-select">选择用户</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="请选择用户" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username} (当前剩余: {user.remaining_logins})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUser && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">用户名:</div>
                  <div className="font-medium">{selectedUser.username}</div>
                  <div className="text-muted-foreground">当前剩余次数:</div>
                  <div className="font-medium">{selectedUser.remaining_logins}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="add-logins">增加次数</Label>
              <Input
                id="add-logins"
                type="number"
                min="1"
                placeholder="输入要增加的登录次数"
                value={addLogins}
                onChange={(e) => setAddLogins(e.target.value)}
              />
              {selectedUser && addLogins && parseInt(addLogins) > 0 && (
                <p className="text-sm text-muted-foreground">
                  更新后将变为: {selectedUser.remaining_logins + parseInt(addLogins)}
                </p>
              )}
            </div>

            <Button 
              onClick={handleAddLogins} 
              disabled={isLoading || !selectedUserId || !addLogins}
              className="w-full"
            >
              {isLoading ? "处理中..." : "确认增加"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdd;
