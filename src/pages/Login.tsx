import React, { useState, useEffect, useRef } from "react";
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
import { Info, MessageSquare, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { loginUser, changePassword, getMessages, addMessage, type Message } from "@/lib/api";

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

  // 留言板相关状态
  const [isMessageBoardOpen, setIsMessageBoardOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageSize = 3; // 每页显示3条留言

  const navigate = useNavigate();
  const { login } = useAuth();
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // 处理用户名输入框的回车事件
  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // 如果密码为空，聚焦到密码输入框
      if (!password.trim()) {
        passwordInputRef.current?.focus();
      } else {
        // 如果密码已填写，触发登录（需要验证表单）
        handleLogin(e as any);
      }
    }
  };

  // 处理密码输入框的回车事件
  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // 密码输入框回车直接触发登录（需要验证表单）
      handleLogin(e as any);
    }
  };

  // 获取留言列表
  const fetchMessages = async (page: number) => {
    setIsLoadingMessages(true);
    try {
      const response = await getMessages(page, pageSize);
      if (response.success) {
        setMessages(response.messages);
        setCurrentPage(response.page);
        setTotalPages(response.totalPages);
        setTotalMessages(response.total);
      } else {
        toast.error(response.error || "获取留言失败");
      }
    } catch (error) {
      console.error("获取留言失败:", error);
      toast.error("获取留言失败，请稍后重试");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // 提交新留言
  const handleSubmitMessage = async () => {
    if (!newMessage.trim()) {
      toast.error("留言内容不能为空");
      return;
    }

    if (newMessage.length > 500) {
      toast.error("留言内容不能超过500个字符");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await addMessage(newMessage);
      if (response.success) {
        toast.success("留言成功");
        setNewMessage("");
        // 刷新第一页的留言
        await fetchMessages(1);
      } else {
        toast.error(response.error || "留言失败");
      }
    } catch (error) {
      console.error("留言失败:", error);
      toast.error("留言失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 打开留言板时加载数据
  useEffect(() => {
    if (isMessageBoardOpen) {
      fetchMessages(1);
    }
  }, [isMessageBoardOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证：确保用户名和密码都已填写
    if (!username.trim()) {
      toast.error("请输入用户名", { duration: 2000 });
      return;
    }
    
    if (!password.trim()) {
      toast.error("请输入密码", { duration: 2000 });
      return;
    }
    
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
        // 保存用户信息到localStorage，包含is_trial_user字段
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        toast.success(`登录成功！剩余登录次数：${result.user.remaining_logins}`, { duration: 3000 });
        // 传递后端返回的会话时长
        login(result.sessionDuration);
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
                <li>已有卡密可直接在本页点击“使用卡密”进行充值</li>
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
          <CardDescription className="text-base">请尽情创造您的虚拟人生</CardDescription>
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
                onKeyDown={handleUsernameKeyDown}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.value = target.value.replace(/[\u4e00-\u9fa5]/g, '');
                }}
                required
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  密码
                </Label>
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 hover:scale-105 transform px-2 py-1 rounded-md hover:bg-blue-50"
                >
                  <span>修改密码</span>
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
                ref={passwordInputRef}
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
                  使用卡密
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
              
              {/* 查询次数和购买卡密入口 */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="text-center">
                  <button
                    onClick={() => {
                      setIsRechargeOpen(false);
                      navigate("/purchase");
                    }}
                    className="text-green-600 hover:text-green-700 transition-colors inline-flex items-center gap-1.5 hover:scale-105 transform text-sm font-medium"
                  >
                    <span>💳</span>
                    <span>卡密购买</span>
                  </button>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => {
                      setIsRechargeOpen(false);
                      navigate("/query-logins");
                    }}
                    className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1.5 hover:scale-105 transform text-sm"
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
              onClick={() => navigate("/purchase")}
              className="text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1.5 hover:scale-105 transform font-medium"
            >
              <span>💰</span>
              <span>卡密购买</span>
            </button>
            <span className="text-border">•</span>
            <button
              onClick={() => navigate("/video")}
              className="text-violet-600 hover:text-violet-700 transition-colors inline-flex items-center gap-1.5 hover:scale-105 transform font-medium"
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
                <div>• 长按任意需修改的位置即可触发更改</div>
                <div>• 您构建的记录将永久保存在您账号内</div>
              </div>
            </AlertDescription>
          </Alert> 

          {/* QQ群信息和留言板链接 */}
          <div className="mt-6 text-center text-xs border-t border-border/50 pt-4">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-slate-600 font-medium">交流Q群：{import.meta.env.VITE_QQ_GROUP}</span>
              <span className="text-slate-400">•</span>
              <button
                onClick={() => setIsMessageBoardOpen(true)}
                className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 hover:scale-105 transform font-medium"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>用户留言板</span>
              </button>
            </div>
          </div>

          {/* 留言板弹窗 */}
          <Dialog open={isMessageBoardOpen} onOpenChange={setIsMessageBoardOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl border-0 shadow-2xl">
              <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 backdrop-blur-sm">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <div className="p-2.5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl shadow-sm">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  用户留言板
                </DialogTitle>
                <DialogDescription className="text-sm mt-2 ml-1">
                  查看其他用户的留言和反馈，也可以留下您的宝贵意见
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gradient-to-b from-muted/10 to-background/50">
                {/* 留言列表 */}
                <div className="space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">加载中...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                          <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">暂无留言，快来留下第一条吧！</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                          {/* 留言内容 */}
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {(message.username || '用户').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-sm text-foreground">{message.username || '匿名用户'}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(message.created_at).toLocaleString('zh-CN', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              </div>
                            </div>
                          </div>

                          {/* 回复内容 */}
                          {message.reply_content && (
                            <div className="px-4 pb-4 pt-3 bg-muted/30 border-t">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-green-600">管</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1">
                                      <span className="font-medium text-sm text-green-700">管理员回复</span>
                                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">官方</span>
                                    </span>
                                    {message.replied_at && (
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(message.replied_at).toLocaleString('zh-CN', {
                                          year: 'numeric',
                                          month: '2-digit',
                                          day: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-foreground break-words whitespace-pre-wrap leading-relaxed">{message.reply_content}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 分页控制 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2 py-3 bg-card rounded-lg border shadow-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchMessages(currentPage - 1)}
                      disabled={currentPage === 1 || isLoadingMessages}
                      className="gap-1.5 hover:bg-primary/5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <span className="text-sm text-muted-foreground font-medium">
                      第 {currentPage} / {totalPages} 页（共 {totalMessages} 条）
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchMessages(currentPage + 1)}
                      disabled={currentPage === totalPages || isLoadingMessages}
                      className="gap-1.5 hover:bg-primary/5"
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* 留言输入框 */}
                <div className="bg-card rounded-lg border shadow-sm p-4 space-y-3">
                  <Label htmlFor="message-input" className="text-sm font-semibold flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    发表留言
                  </Label>
                  <Textarea
                    id="message-input"
                    placeholder="写下您的留言..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="resize-none focus-visible:ring-primary/20"
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${newMessage.length >= 450 ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>
                      {newMessage.length}/500
                    </span>
                    <Button
                      onClick={handleSubmitMessage}
                      disabled={isSubmitting || !newMessage.trim()}
                      size="sm"
                      className="gap-1.5 min-w-[100px]"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          提交中...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          提交留言
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
