import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import * as adminApi from "@/lib/adminApi";

interface AdminLoginProps {
  onVerify: (token: string) => void;
}

const SUPERADD_LOGIN_KEY = "superadd_login_timestamp";
const SUPERADD_TOKEN_KEY = "superadd_token";
// 从环境变量读取管理员会话时长，默认30天（2592000000毫秒）
const SUPERADD_SESSION_DURATION = parseInt(import.meta.env.VITE_SUPERADD_SESSION_DURATION || '2592000000', 10);

const AdminLogin = ({ onVerify }: AdminLoginProps) => {
  const [verifyUsername, setVerifyUsername] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");

  useEffect(() => {
    const loginTimestamp = localStorage.getItem(SUPERADD_LOGIN_KEY);
    const storedToken = localStorage.getItem(SUPERADD_TOKEN_KEY);
    if (loginTimestamp && storedToken) {
      const loginTime = parseInt(loginTimestamp, 10);
      const currentTime = Date.now();
      const timeDiff = currentTime - loginTime;

      if (timeDiff < SUPERADD_SESSION_DURATION) {
        onVerify(storedToken);
      } else {
        localStorage.removeItem(SUPERADD_LOGIN_KEY);
        localStorage.removeItem(SUPERADD_TOKEN_KEY);
      }
    }
  }, [onVerify]);

  const handleVerify = async () => {
    try {
      const data = await adminApi.adminLogin(verifyUsername, verifyPassword);
      if (data.success) {
        localStorage.setItem(SUPERADD_LOGIN_KEY, Date.now().toString());
        localStorage.setItem(SUPERADD_TOKEN_KEY, data.token);
        onVerify(data.token);
      } else {
        throw new Error(data.error || "用户名或密码错误");
      }
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-indigo-100 bg-white">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">系统验证</CardTitle>
          <CardDescription className="text-base text-gray-500">请输入管理员凭据以继续</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verify-username" className="text-gray-700">
              用户名
            </Label>
            <Input
              id="verify-username"
              type="text"
              value={verifyUsername}
              onChange={(e) => setVerifyUsername(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleVerify()}
              className="h-12 border-gray-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verify-password" className="text-gray-700">
              密码
            </Label>
            <Input
              id="verify-password"
              type="password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleVerify()}
              className="h-12 border-gray-200"
            />
          </div>
          <Button
            onClick={handleVerify}
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 border-0"
          >
            验证身份
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
