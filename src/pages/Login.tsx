import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { loginUser } from "@/lib/api";

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
      const result = await loginUser(username, password);
      
      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      if (result.success && result.user) {
        // 将用户信息存储到localStorage
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        toast.success(`登录成功！剩余登录次数：${result.user.remaining_logins}`);
        login();
        navigate("/");
      }
    } catch (error) {
      toast.error("登录失败，请重试");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">学信档案</CardTitle>
          <CardDescription>请登录以继续使用学信网系统</CardDescription>
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
            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "登录中..." : "登录"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/purchase")}
              >
                购买/续费
              </Button>
            </div>
          </form>
          
          <Alert className="mt-6 border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="ml-2 text-sm space-y-1">
              <div className="font-medium">使用提示：</div>
              <div className="text-muted-foreground">1. 长按待编辑的学历卡可以修改或添加学历</div>
              <div className="text-muted-foreground">2. 所有的个人信息包括您上传的照片都会加密后进行数据持久化，退出后下次登录不会丢失</div>
            </AlertDescription>
          </Alert>

          <div className="mt-4 text-center">
            <a 
              href="http://jk.fortunefreedom.top:9090/share/5_eKT01x"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              📹 观看系统使用介绍视频
            </a>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground space-y-1">
            <div>当前版本：V2.3.2</div>
            <div>更新时间：2025.11</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
