import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, UserPlus, Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [editedUsername, setEditedUsername] = useState("");
  const [editedPassword, setEditedPassword] = useState("");
  const [editedLogins, setEditedLogins] = useState("");
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
        .select('id, username, password, remaining_logins')
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

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setEditedUsername(user.username);
    setEditedPassword(user.password);
    setEditedLogins(user.remaining_logins.toString());
    setSearchValue(user.username);
    setSearchOpen(false);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "请选择用户",
      });
      return;
    }

    if (!editedUsername.trim()) {
      toast({
        variant: "destructive",
        title: "用户名不能为空",
      });
      return;
    }

    if (!editedPassword.trim()) {
      toast({
        variant: "destructive",
        title: "密码不能为空",
      });
      return;
    }

    const logins = parseInt(editedLogins);
    if (isNaN(logins) || logins < 0) {
      toast({
        variant: "destructive",
        title: "请输入有效的登录次数",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "update-user-info",
        {
          body: {
            userId: selectedUser.id,
            username: editedUsername,
            password: editedPassword,
            remaining_logins: logins,
          },
        }
      );

      if (error) throw error;

      if (data.success) {
        toast({
          title: "更新成功",
          description: "用户信息已成功更新",
        });
        fetchUsers();
        setSelectedUser(null);
        setSearchValue("");
        setEditedUsername("");
        setEditedPassword("");
        setEditedLogins("");
      } else {
        toast({
          variant: "destructive",
          title: "更新失败",
          description: data.error || "未知错误",
        });
      }
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

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchValue.toLowerCase())
  );

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
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              <CardTitle>用户信息管理</CardTitle>
            </div>
            <CardDescription>查看和编辑用户信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>搜索用户</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="w-full justify-between"
                  >
                    {searchValue || "输入用户名进行搜索..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="搜索用户名..."
                      value={searchValue}
                      onValueChange={setSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty>未找到匹配的用户</CommandEmpty>
                      <CommandGroup>
                        {filteredUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.username}
                            onSelect={() => handleUserSelect(user)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUser?.id === user.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {user.username} (登录次数: {user.remaining_logins})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedUser && (
              <>
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold text-sm">用户信息</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-username">用户名</Label>
                    <Input
                      id="edit-username"
                      value={editedUsername}
                      onChange={(e) => setEditedUsername(e.target.value)}
                      placeholder="用户名"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-password">密码</Label>
                    <Input
                      id="edit-password"
                      type="text"
                      value={editedPassword}
                      onChange={(e) => setEditedPassword(e.target.value)}
                      placeholder="密码"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-logins">剩余登录次数</Label>
                    <Input
                      id="edit-logins"
                      type="number"
                      min="0"
                      value={editedLogins}
                      onChange={(e) => setEditedLogins(e.target.value)}
                      placeholder="剩余登录次数"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleUpdateUser}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "更新中..." : "确认更新"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdd;
