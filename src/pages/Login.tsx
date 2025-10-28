import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 读取用户配置文件
      const response = await fetch("/users.json");
      const data = await response.json();
      
      // 查找用户
      const user = data.users.find(
        (u: any) => u.username === username && u.password === password
      );

      if (!user) {
        toast.error("用户名或密码错误");
        setIsLoading(false);
        return;
      }

      // 检查剩余登录次数
      if (user.remainingLogins <= 0) {
        toast.error("使用次数为0，请购买次数后继续使用！");
        setIsLoading(false);
        return;
      }

      // 更新剩余次数
      user.remainingLogins -= 1;
      
      // 这里需要将更新后的数据保存回json文件
      // 注意：在纯前端应用中，无法直接修改public目录下的文件
      // 实际应用中需要后端API来处理
      // 这里我们使用localStorage临时存储更新后的数据
      localStorage.setItem("usersData", JSON.stringify(data));
      
      toast.success(`登录成功！剩余登录次数：${user.remainingLogins}`);
      login();
      navigate("/");
    } catch (error) {
      toast.error("登录失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">学信档案</CardTitle>
          <CardDescription>请登录以继续使用系统</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登录中..." : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
