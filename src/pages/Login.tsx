import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { loginUser, changePassword } from "@/lib/api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    username: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 充值相关状态
  const [loginRechargeData, setLoginRechargeData] = useState({ username: "", cardId: "" });
  const [pdfRechargeData, setPdfRechargeData] = useState({ username: "", cardId: "" });
  const [isRecharging, setIsRecharging] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await loginUser(username, password);

      if (result.error) {
        toast.error(result.error, { duration: 2000 });
        setIsLoading(false);
        return;
      }

      if (result.success && result.user) {
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        toast.success(`登录成功！剩余登录次数：${result.user.remaining_logins}`, { duration: 1500 });
        login();
        navigate("/");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "网络连接失败，请检查网络后重试";
      toast.error(errorMessage, { duration: 2000 });
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
        changePasswordData.newPassword,
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
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast.error("密码修改失败，请重试", { duration: 1500 });
      console.error("Change password error:", error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRecharge = async (type: "login" | "pdf") => {
    const data = type === "login" ? loginRechargeData : pdfRechargeData;

    if (!data.username.trim()) {
      toast.error("请输入账号", { duration: 1500 });
      return;
    }

    if (!data.cardId.trim()) {
      toast.error("请输入充值卡密", { duration: 1500 });
      return;
    }

    setIsRecharging(true);

    try {
      // 使用本地后端API替代Supabase函数调用
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/manage-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'use',
          cardId: data.cardId.trim(), 
          username: data.username.trim(), 
          type 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "充值失败", { duration: 2000 });
        return;
      }

      if (result.error) {
        toast.error(result.error, { duration: 2000 });
        return;
      }

      toast.success(result.message || "充值成功", { duration: 2000 });

      // 清空输入
      if (type === "login") {
        setLoginRechargeData({ username: "", cardId: "" });
      } else {
        setPdfRechargeData({ username: "", cardId: "" });
      }

      setIsRechargeOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "充值失败，请重试";
      toast.error(errorMessage, { duration: 2000 });
      console.error("Recharge error:", error);
    } finally {
      setIsRecharging(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <Card className="w-full max-w-md shadow-2xl border-primary/10 backdrop-blur-sm bg-card/95 relative z-10 animate-fade-in">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold">学信档案</CardTitle>
          <CardDescription className="text-base">请登录以继续使用学信网系统</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                用户名
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                密码
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? "登录中..." : "登录"}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
                  onClick={() => navigate("/register")}
                >
                  注册账号
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/50 transition-all"
                  onClick={() => setIsRechargeOpen(true)}
                >
                  卡密充值/续费
                </Button>
              </div>
            </div>
          </form>

          {/* 修改密码对话框 */}
          <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
            <DialogContent>
              <form onSubmit={handleChangePassword}>
                <DialogHeader>
                  <DialogTitle>修改密码</DialogTitle>
                  <DialogDescription>请输入您的账号信息和新密码</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="change-username">用户名</Label>
                    <Input
                      id="change-username"
                      type="text"
                      placeholder="请输入用户名"
                      value={changePasswordData.username}
                      onChange={(e) =>
                        setChangePasswordData({
                          ...changePasswordData,
                          username: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setChangePasswordData({
                          ...changePasswordData,
                          oldPassword: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setChangePasswordData({
                          ...changePasswordData,
                          newPassword: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setChangePasswordData({
                          ...changePasswordData,
                          confirmPassword: e.target.value,
                        })
                      }
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

          {/* 充值对话框 */}
          <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>充值/续费</DialogTitle>
                <DialogDescription>请选择充值类型并输入相关信息</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">登录次数充值</TabsTrigger>
                  <TabsTrigger value="pdf">PDF积分充值</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">已注册账号</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="请输入已注册的账号"
                      value={loginRechargeData.username}
                      onChange={(e) =>
                        setLoginRechargeData({
                          ...loginRechargeData,
                          username: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-card">登录次数充值卡密</Label>
                    <Input
                      id="login-card"
                      type="text"
                      placeholder="请输入登录次数充值卡密"
                      value={loginRechargeData.cardId}
                      onChange={(e) =>
                        setLoginRechargeData({
                          ...loginRechargeData,
                          cardId: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button className="w-full" onClick={() => handleRecharge("login")} disabled={isRecharging}>
                    {isRecharging ? "充值中..." : "确认充值"}
                  </Button>
                </TabsContent>
                <TabsContent value="pdf" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="pdf-username">已注册账号</Label>
                    <Input
                      id="pdf-username"
                      type="text"
                      placeholder="请输入已注册的账号"
                      value={pdfRechargeData.username}
                      onChange={(e) =>
                        setPdfRechargeData({
                          ...pdfRechargeData,
                          username: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdf-card">PDF积分充值卡密</Label>
                    <Input
                      id="pdf-card"
                      type="text"
                      placeholder="请输入PDF积分充值卡密"
                      value={pdfRechargeData.cardId}
                      onChange={(e) =>
                        setPdfRechargeData({
                          ...pdfRechargeData,
                          cardId: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button className="w-full" onClick={() => handleRecharge("pdf")} disabled={isRecharging}>
                    {isRecharging ? "充值中..." : "确认充值"}
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <div className="flex justify-center gap-4 mt-4 text-sm">
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="text-primary hover:text-accent transition-colors inline-flex items-center gap-1.5 hover:scale-105 transform"
            >
              <span>🔑</span>
              <span>修改密码</span>
            </button>
            <span className="text-border">•</span>
            <button
              onClick={() => navigate("/purchase")}
              className="text-primary hover:text-accent transition-colors inline-flex items-center gap-1.5 hover:scale-105 transform"
            >
              <span>💰</span>
              <span>定价说明</span>
            </button>
            <span className="text-border">•</span>
            <button
              onClick={() => navigate("/video")}
              className="text-primary hover:text-accent transition-colors inline-flex items-center gap-1.5 hover:scale-105 transform"
            >
              <span>📹</span>
              <span>使用教程</span>
            </button>
          </div>

          <Alert className="mt-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-sm">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="ml-2 text-sm space-y-2">
              <div className="font-semibold text-foreground">使用提示 💡</div>
              <div className="text-muted-foreground space-y-1 leading-relaxed">
                <div>• 长按任意卡片区域可以添加修改或删除卡片信息</div>
                <div>• 第一次建议使用电脑登录设置好后再使用手机登录</div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="mt-6 text-center text-xs text-muted-foreground/70 border-t border-border/50 pt-4">
            <div>当前版本：V3.0.2 • 更新时间：2025.12</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;