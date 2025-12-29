import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { registerUser } from "@/lib/api";

const generateMathCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operators = ["+", "-", "×"];
  const operator = operators[Math.floor(Math.random() * operators.length)];

  let answer: number;
  switch (operator) {
    case "+":
      answer = num1 + num2;
      break;
    case "-":
      answer = num1 - num2;
      break;
    case "×":
      answer = num1 * num2;
      break;
    default:
      answer = num1 + num2;
  }

  return { question: `${num1} ${operator} ${num2} = ?`, answer };
};

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState(generateMathCaptcha);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);
  const navigate = useNavigate();

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateMathCaptcha());
    setCaptchaAnswer("");
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证码校验
    if (parseInt(captchaAnswer) !== captcha.answer) {
      toast.error("验证码错误，请重新输入", { duration: 1500 });
      refreshCaptcha();
      return;
    }

    // 检查用户名是否包含中文
    const chineseRegex = /[\u4e00-\u9fa5]/;
    if (chineseRegex.test(username)) {
      toast.error("用户名不能包含中文字符", { duration: 1500 });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致", { duration: 1500 });
      return;
    }

    if (password.length < 6) {
      toast.error("密码长度至少为6位", { duration: 1500 });
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser(username, password);

      // 如果有错误信息，显示具体的错误
      if (result.error) {
        toast.error(result.error, { duration: 1500 });
        refreshCaptcha();
        return;
      }

      // 注册成功，显示提示对话框
      if (result.success && result.user) {
        setShowRegisterSuccess(true);
      }
    } catch (error) {
      // 捕获网络错误或其他未预期的错误
      const errorMessage = error instanceof Error ? error.message : "注册失败，请重试";
      toast.error(errorMessage, { duration: 1500 });
      refreshCaptcha();
      console.error("Register error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/login")} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-3xl font-bold">注册账号</CardTitle>
          </div>
          <CardDescription>创建您的模拟档案账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名（不能包含中文）"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
              <p className="text-xs text-muted-foreground">用户名至少3个字符，不能包含中文</p>
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
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">密码至少6个字符</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="captcha">验证码</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center bg-gradient-to-r from-primary/10 to-secondary/10 border border-border rounded-md px-4 py-2.5 min-w-[120px]">
                  <span className="text-lg font-bold text-primary tracking-wider select-none">{captcha.question}</span>
                </div>
                <Input
                  id="captcha"
                  type="number"
                  placeholder="答案"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  required
                  className="w-24 text-center font-medium"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={refreshCaptcha} 
                  className="flex-shrink-0 hover:bg-primary/10 transition-colors"
                  title="换一题"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">请计算上方算式并填写结果</p>
            </div>
            <div className="space-y-3 pt-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "注册中..." : "注册"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                已有账号？
                <Button type="button" variant="link" className="px-1 h-auto" onClick={() => navigate("/login")}>
                  立即登录
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showRegisterSuccess} onOpenChange={setShowRegisterSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>注册成功 🎉</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  恭喜您注册成功！您的账号当前登录次数余额为 <span className="font-semibold text-destructive">0</span>
                  ，需要充值后才能登录系统。
                </p>
                <div className="bg-muted/50 p-3 rounded-md space-y-2">
                  <p className="font-medium text-foreground">充值步骤：</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>前往购买充值卡密</li>
                    <li>返回登录页面，点击"卡密充值/续费"按钮</li>
                    <li>输入您刚注册的账号和购买到的卡密</li>
                    <li>充值成功后即可登录使用</li>
                  </ol>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRegisterSuccess(false);
                navigate("/login");
              }}
              className="w-full sm:w-auto"
            >
              返回登录
            </Button>
            <Button
              onClick={() => {
                setShowRegisterSuccess(false);
                navigate("/purchase");
              }}
              className="w-full sm:w-auto"
            >
              查看系统定价说明
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Register;
