import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [showLoginLimitDialog, setShowLoginLimitDialog] = useState(false);
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
        // 特殊处理登录次数不足的情况
        if (result.error === "登录次数不足") {
          setShowLoginLimitDialog(true);
        } else {
          toast.error(result.error, { duration: 4000 });
        }
        setIsLoading(false);
        return;
      }

      if (result.success && result.user) {
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        toast.success(`登录成功！剩余登录次数：${result.user.remaining_logins}`, { duration: 3000 });
        login();
        navigate("/");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "网络连接失败，请检查网络后重试";
      toast.error(errorMessage, { duration: 4000 });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      toast.error("两次输入的新密码不一致", { duration: 3000 });
      return;
    }

    if (changePasswordData.newPassword.length < 6) {
      toast.error("新密码长度至少为6位", { duration: 3000 });
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
        toast.error(result.error, { duration: 3000 });
      } else if (result.success) {
        toast.success("密码修改成功", { duration: 3000 });
        setIsChangePasswordOpen(false);
        setChangePasswordData({
          username: "",
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast.error("密码修改失败，请重试", { duration: 3000 });
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
      // 生成签名所需参数
      const timestamp = Date.now().toString();
      const params = {
        action: "use",
        cardId: data.cardId.trim(),
        username: data.username.trim(),
        type,
      };
      
      // 生成签名
      const method = "POST";
      const url = "/api/manage-cards";
      const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
      const signString = `${method.toUpperCase()}${url}${sortedParams}${timestamp}`;
      
      let hash = 0;
      for (let i = 0; i < signString.length; i++) {
        const char = signString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      // 从环境变量获取密钥，如果没有则使用默认值
      const secretKey = import.meta.env.VITE_API_SECRET_KEY || "default_secret_key";
      for (let i = 0; i < secretKey.length; i++) {
        const char = secretKey.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      const signature = Math.abs(hash).toString(16);

      // 使用本地后端API替代Supabase函数调用
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
      const response = await fetch(`${API_BASE_URL}/manage-cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Timestamp": timestamp,
          "X-Signature": signature,
          "X-App-Key": import.meta.env.VITE_APP_KEY || "default_app_key"
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "充值失败", { duration: 4000 });
        return;
      }

      if (result.error) {
        toast.error(result.error, { duration: 2000 });
        return;
      }

      toast.success(result.message || "充值成功", { duration: 4000 });

      // 清空输入
      if (type === "login") {
        setLoginRechargeData({ username: "", cardId: "" });
      } else {
        setPdfRechargeData({ username: "", cardId: "" });
      }

      setIsRechargeOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "充值失败，请重试";
      toast.error(errorMessage, { duration: 4000 });
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
        
        {/* 登录次数不足对话框 */}
        <Dialog open={showLoginLimitDialog} onOpenChange={setShowLoginLimitDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>登录次数不足</DialogTitle>
              <DialogDescription>
                您的账号登录次数已用完，请购买充值卡进行续费！
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>购买登录次数充值卡后可继续使用系统</li>
                <li>已有卡密可直接在本页点击“卡密充值/续费”进行充值</li>
              </ul>
            </div>
            <DialogFooter>
              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowLoginLimitDialog(false)}
                >
                  取消
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90"
                  onClick={() => navigate("/purchase")}
                >
                  去购买
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold">模拟档案</CardTitle>
          <CardDescription className="text-base">请登录以继续使用模拟系统</CardDescription>
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
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.value = target.value.replace(/[\u4e00-\u9fa5]/g, '');
                }}
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
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.value = target.value.replace(/[\u4e00-\u9fa5]/g, '');
                }}
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
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[\u4e00-\u9fa5]/g, '');
                      }}
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
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[\u4e00-\u9fa5]/g, '');
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">新密码</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="请输入新密码（至少 6 位）"
                      value={changePasswordData.newPassword}
                      onChange={(e) =>
                        setChangePasswordData({
                          ...changePasswordData,
                          newPassword: e.target.value,
                        })
                      }
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[\u4e00-\u9fa5]/g, '');
                      }}
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
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[\u4e00-\u9fa5]/g, '');
                      }}
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
                <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-lg">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 ease-in-out font-medium data-[state=active]:scale-[1.02]"
                  >
                    🔑 登录次数充值
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pdf" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 ease-in-out font-medium data-[state=active]:scale-[1.02]"
                  >
                    📑 PDF 积分充值
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="space-y-4 pt-4 animate-fade-in">
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
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[\u4e00-\u9fa5]/g, '');
                      }}
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
                <TabsContent value="pdf" className="space-y-4 pt-4 animate-fade-in">
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
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[\u4e00-\u9fa5]/g, '');
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdf-card">PDF 积分充值卡密</Label>
                    <Input
                      id="pdf-card"
                      type="text"
                      placeholder="请输入 PDF 积分充值卡密"
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
              
              {/* 查询次数入口 */}
              <div className="mt-0 pt-0 border-border">
                <div className="text-center">
                  <button
                    onClick={() => {
                      setIsRechargeOpen(false);
                      navigate("/query-logins");
                    }}
                    className="text-blue-700 hover:text-accent transition-colors inline-flex items-center gap-1.5 hover:scale-105 transform text-sm"
                  >
                    <span>🔍</span>
                    <span>点我查询当前剩余登录次数与 PDF 积分</span>
                  </button>
                </div>
              </div>
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
              <span>卡密购买</span>
            </button>
            <span className="text-border">•</span>
            <button
              onClick={() => navigate("/video")}
              className="text-primary hover:text-accent transition-colors inline-flex items-center gap-1.5 hover:scale-105 transform"
            >
              <span>📹</span>
              <span>演示视频</span>
            </button>
          </div>

          <Alert className="mt-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-sm">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="ml-2 text-sm space-y-2">
              <div className="font-semibold text-foreground">重要提示 💡</div>
              <div className="text-muted-foreground space-y-1 leading-relaxed">
                <div>• 所有修改都请 长按！长按！长按！</div>
                <div>• 第一次使用建议电脑登录填写后再使用手机查看</div>
              </div>
            </AlertDescription>
          </Alert> 

          <div className="mt-6 text-center text-xs text-muted-foreground/70 border-t border-border/50 pt-4">
            <div>• 更新通知与售后交流QQ群：{import.meta.env.VITE_QQ_GROUP} •</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
