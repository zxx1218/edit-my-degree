import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOGIN_TIMESTAMP_KEY = "auth_login_timestamp";
// 从环境变量获取会话持续时间，默认为3分钟(180000毫秒)
const SESSION_DURATION = import.meta.env.VITE_SESSION_DURATION 
  ? parseInt(import.meta.env.VITE_SESSION_DURATION as string, 10) 
  : 3 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const timerRef = useRef<number | null>(null);

  // 清除定时器
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // 设置会话过期定时器
  const setupSessionTimer = (loginTime: number) => {
    clearTimer();
    
    const currentTime = Date.now();
    const timeDiff = currentTime - loginTime;
    const remainingTime = SESSION_DURATION - timeDiff;

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
    console.log("会话已过期，自动登出");
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
    setIsAuthenticated(false);
    clearTimer();
    
    // 直接跳转到登录页，不显示任何提示
    window.location.href = "/login";
  };

  // 检查登录状态是否在指定时间内
  useEffect(() => {
    const loginTimestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
    if (loginTimestamp) {
      const loginTime = parseInt(loginTimestamp, 10);
      const currentTime = Date.now();
      const timeDiff = currentTime - loginTime;

      if (timeDiff < SESSION_DURATION) {
        // 在有效期内，保持登录状态并设置定时器
        setIsAuthenticated(true);
        setupSessionTimer(loginTime);
      } else {
        // 超过有效期，清除时间戳
        localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
      }
    }

    // 无论是否命中时间戳检查，都结束加载状态
    setIsCheckingAuth(false);

    // 组件卸载时清除定时器
    return () => {
      clearTimer();
    };
  }, []);

  const login = () => {
    // 登录时记录当前时间戳
    const loginTime = Date.now();
    localStorage.setItem(LOGIN_TIMESTAMP_KEY, loginTime.toString());
    setIsAuthenticated(true);
    
    // 设置会话过期定时器
    setupSessionTimer(loginTime);
  };

  const logout = () => {
    // 退出时清除时间戳和定时器
    clearTimer();
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isCheckingAuth, login, logout }}>
      {children}
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
