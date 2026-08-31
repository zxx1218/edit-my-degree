import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthContextType {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  login: (sessionDuration?: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOGIN_TIMESTAMP_KEY = "auth_login_timestamp";
const SESSION_DURATION_KEY = "auth_session_duration";
// 从环境变量获取默认会话持续时间，默认为3分钟(180000毫秒)
const DEFAULT_SESSION_DURATION = import.meta.env.VITE_SESSION_DURATION 
  ? parseInt(import.meta.env.VITE_SESSION_DURATION as string, 10) 
  : 3 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showTrialDialog, setShowTrialDialog] = useState(false);
  const timerRef = useRef<number | null>(null);

  // 清除定时器
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // 设置会话过期定时器
  const setupSessionTimer = (loginTime: number, sessionDuration: number) => {
    clearTimer();
    
    const currentTime = Date.now();
    const timeDiff = currentTime - loginTime;
    const remainingTime = sessionDuration - timeDiff;

    if (remainingTime > 0) {
      // 设置定时器，在剩余时间后自动登出
      timerRef.current = setTimeout(() => {
        handleSessionExpired();
      }, remainingTime);
    } else {
      // 已经过期，立即登出
      handleSessionExpired();
    }
  };

  // 处理会话过期
  const handleSessionExpired = () => {
    // 检查是否为代登录用户
    const isImpersonated = localStorage.getItem("impersonatedByAdmin") === "true";

    // 尝试获取当前用户信息
    let userInfo: any = null;
    try {
      const currentUserStr = localStorage.getItem("currentUser");
      if (currentUserStr) {
        userInfo = JSON.parse(currentUserStr);
      }
    } catch (error) {
      // 忽略解析错误
    }

    // 检查是否为体验用户
    const isTrialUser = userInfo?.is_trial_user === true;

    if (isTrialUser) {
      // 体验用户：显示确认弹窗
      
      // 显示体验卡提示弹窗
      setShowTrialDialog(true);
    } else {
      // 非体验用户或标记为空：保持原有逻辑
      
      // 清除认证状态
      localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
      localStorage.removeItem(SESSION_DURATION_KEY);
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("impersonatedByAdmin");
      setIsAuthenticated(false);
      clearTimer();
      
      // 使用 setTimeout 确保日志能够完整输出后再跳转
      setTimeout(() => {
        if (isImpersonated) {
          window.location.href = "/superadd";
        } else {
          window.location.href = "/login";
        }
      }, 100);
    }
  };

  // 处理体验用户弹窗确认
  const handleTrialDialogConfirm = () => {
    setShowTrialDialog(false);
    
    // 检查是否为代登录用户
    const isImpersonated = localStorage.getItem("impersonatedByAdmin") === "true";

    // 清除认证状态
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
    localStorage.removeItem(SESSION_DURATION_KEY);
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("impersonatedByAdmin");
    setIsAuthenticated(false);
    clearTimer();
    
    // 跳转到相应页面
    setTimeout(() => {
      if (isImpersonated) {
        window.location.href = "/superadd";
      } else {
        window.location.href = "/login";
      }
    }, 100);
  };

  // 检查登录状态是否在指定时间内
  useEffect(() => {
    const loginTimestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
    const sessionDurationStr = localStorage.getItem(SESSION_DURATION_KEY);
    
    if (loginTimestamp && sessionDurationStr) {
      const loginTime = parseInt(loginTimestamp, 10);
      const sessionDuration = parseInt(sessionDurationStr, 10);
      const currentTime = Date.now();
      const timeDiff = currentTime - loginTime;

      if (timeDiff < sessionDuration) {
        // 在有效期内，保持登录状态并设置定时器
        setIsAuthenticated(true);
        setupSessionTimer(loginTime, sessionDuration);
      } else {
        // 超过有效期，清除时间戳和会话时长
        localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
        localStorage.removeItem(SESSION_DURATION_KEY);
      }
    }

    // 无论是否命中时间戳检查，都结束加载状态
    setIsCheckingAuth(false);

    // 组件卸载时清除定时器
    return () => {
      clearTimer();
    };
  }, []);

  const login = (sessionDuration?: number) => {
    // 登录时记录当前时间戳和会话时长
    const loginTime = Date.now();
    const duration = sessionDuration || DEFAULT_SESSION_DURATION;
    
    localStorage.setItem(LOGIN_TIMESTAMP_KEY, loginTime.toString());
    localStorage.setItem(SESSION_DURATION_KEY, duration.toString());
    setIsAuthenticated(true);
    
    // 设置会话过期定时器
    setupSessionTimer(loginTime, duration);
  };

  const logout = () => {
    // 退出时清除时间戳、会话时长和定时器
    clearTimer();
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
    localStorage.removeItem(SESSION_DURATION_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isCheckingAuth, login, logout }}>
      {children}
      
      {/* 体验用户会话过期提示弹窗 */}
      <Dialog open={showTrialDialog} onOpenChange={setShowTrialDialog}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* 顶部渐变背景 */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-6 py-8 text-center">
            <div className="text-white">
              <div className="text-5xl mb-3">⏰</div>
              <DialogTitle className="text-2xl font-bold text-white border-0 p-0 m-0">
                体验卡已到期
              </DialogTitle>
            </div>
          </div>
          
          {/* 内容区域 */}
          <div className="px-6 py-6 space-y-4 bg-gradient-to-b from-white to-gray-50">
            {/* 主要提示信息 */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4">
              <p className="text-base font-semibold text-gray-800 leading-relaxed">
                1次登录体验卡的有效操作时长为5分钟
              </p>
            </div>
            
            {/* 详细说明 */}
            <div className="space-y-3 text-sm text-gray-600">
              <p className="leading-relaxed">
                您的体验会话已经结束，如确有需要，请购买其他卡种。
              </p>
              <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <span className="text-blue-500 text-lg">💾</span>
                <p className="text-blue-700 leading-relaxed flex-1">
                  您本次修改的信息依然在您的账号内保留
                </p>
              </div>
            </div>
          </div>
          
          {/* 底部按钮区域 */}
          <DialogFooter className="px-6 pb-6 pt-2 bg-white border-t border-gray-100">
            <Button 
              onClick={handleTrialDialogConfirm}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              我知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};