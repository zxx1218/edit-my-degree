import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { loginUser, changePassword } from "@/lib/api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    username: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await loginUser(username, password);
      
      if (result.error) {
        toast.error(result.error, { duration: 1500 });
        setIsLoading(false);
        return;
      }

      if (result.success && result.user) {
        // 将用户信息存储到localStorage
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        toast.success(`登录成功！剩余登录次数：${result.user.remaining_logins}`, { duration: 1500 });
        login();
        navigate("/");
      }
    } catch (error) {
      toast.error("登录失败，请重试", { duration: 1500 });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      toast.error("两次输入的新密码不一致", { duration: 1500 });
      return;
    }

    if (changePasswordData.newPassword.length < 6) {
      toast.error("新密码长度至少为6位", { duration: 1500 });
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePassword(
        changePasswordData.username,
        changePasswordData.oldPassword,
        changePasswordData.newPassword
      );

      if (result.error) {
        toast.error(result.error, { duration: 1500 });
      } else if (result.success) {
        toast.success("密码修改成功", { duration: 1500 });
        setIsChangePasswordOpen(false);
        setChangePasswordData({
          username: "",
          oldPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    } catch (error) {
      toast.error("密码修改失败，请重试", { duration: 1500 });
      console.error("Change password error:", error);
    } finally {
      setIsChangingPassword(false);
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
                variant="secondary"
                className="w-full"
                onClick={() => navigate("/register")}
              >
                注册账号
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
          
          <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
            <DialogContent>
              <form onSubmit={handleChangePassword}>
                <DialogHeader>
                  <DialogTitle>修改密码</DialogTitle>
                  <DialogDescription>
                    请输入您的账号信息和新密码
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="change-username">用户名</Label>
                    <Input
                      id="change-username"
                      type="text"
                      placeholder="请输入用户名"
                      value={changePasswordData.username}
                      onChange={(e) => setChangePasswordData({
                        ...changePasswordData,
                        username: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="old-password">原密码</Label>
                    <Input
                      id="old-password"
                      type="password"
                      placeholder="请输入原密码"
                      value={changePasswordData.oldPassword}
                      onChange={(e) => setChangePasswordData({
                        ...changePasswordData,
                        oldPassword: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">新密码</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="请输入新密码（至少6位）"
                      value={changePasswordData.newPassword}
                      onChange={(e) => setChangePasswordData({
                        ...changePasswordData,
                        newPassword: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">确认新密码</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="请再次输入新密码"
                      value={changePasswordData.confirmPassword}
                      onChange={(e) => setChangePasswordData({
                        ...changePasswordData,
                        confirmPassword: e.target.value
                      })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? "修改中..." : "确认修改"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="mt-3 text-center">
            <button 
              onClick={() => setIsChangePasswordOpen(true)}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              🔑 修改密码
            </button>
          </div>
          
          <Alert className="mt-4 border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="ml-2 text-sm space-y-1">
              <div className="font-medium">使用提示：</div>
              <div className="text-muted-foreground">1. 长按待编辑的学历卡可以修改或添加学历</div>
              <div className="text-muted-foreground">2. 所有的个人信息包括您上传的照片都会加密后进行数据持久化，退出后下次登录不会丢失</div>
            </AlertDescription>
          </Alert>

          <div className="mt-3 text-center">
            <button 
              onClick={() => navigate("/video")}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              📹 观看系统使用介绍视频
            </button>
          </div>

          <div className="mt-3 text-center text-xs text-muted-foreground space-y-1">
            <div>当前版本：V2.3.2 - 代码最后更新时间：2025.11</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
