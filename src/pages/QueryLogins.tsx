import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { queryUserLoginsPdf } from "@/lib/api";

const QueryLogins = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<{
    username: string;
    remaining_logins: number;
    pdf_limit: number;
    queryTime: string;
  } | null>(null);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setQueryResult(null);

    try {
      const result = await queryUserLoginsPdf(username, password);

      if (result.error) {
        toast.error(result.error, { duration: 4000 });
        setQueryResult(null);
      } else if (result.success && result.user) {
        const currentTime = new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setQueryResult({
          username: result.user.username,
          remaining_logins: result.user.remaining_logins,
          pdf_limit: result.user.pdf_limit,
          queryTime: currentTime
        });
        toast.success("查询成功", { duration: 3000 });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "网络连接失败，请检查网络后重试";
      toast.error(errorMessage, { duration: 4000 });
      console.error("Query error:", error);
    } finally {
      setIsLoading(false);
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
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="mb-4 w-fit -ml-2 hover:bg-primary/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回登录
          </Button>
          <CardTitle className="text-3xl font-bold mt-8">查询登录次数和 PDF 积分</CardTitle>
          <CardDescription className="text-base">输入用户名和密码查询当前账户的登录次数和 PDF 积分</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleQuery} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
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
              <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
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
                {isLoading ? "查询中..." : "查询"}
              </Button>
            </div>
          </form>

          {queryResult && (
            <Alert className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-sm">
              <AlertDescription className="space-y-3">
                <div className="font-semibold text-foreground text-lg">查询结果</div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-background/50 rounded-lg p-4 border border-primary/20 shadow-sm">
                    <div className="text-sm text-muted-foreground mb-1">🔑 剩余登录次数</div>
                    <div className="text-3xl font-bold text-primary">{queryResult.remaining_logins}</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border border-accent/20 shadow-sm">
                    <div className="text-sm text-muted-foreground mb-1">📑 PDF 积分</div>
                    <div className="text-3xl font-bold text-accent">{queryResult.pdf_limit}</div>
                  </div>
                </div>
                <div className="text-xs text-red-500 pt-2 border-t border-border/50">
                  查询时间：{queryResult.queryTime}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 text-center text-xs text-muted-foreground/70 border-t border-border/50 pt-4">
            <div>提示：请妥善保管您的账号信息</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueryLogins;
