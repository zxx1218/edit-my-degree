import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOGIN_TIMESTAMP_KEY = "auth_login_timestamp";
// 从环境变量获取会话持续时间，默认为10分钟(600000毫秒)
const SESSION_DURATION = import.meta.env.VITE_SESSION_DURATION 
  ? parseInt(import.meta.env.VITE_SESSION_DURATION as string, 10) 
  : 10 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 检查登录状态是否在指定时间内
  useEffect(() => {
    const loginTimestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
    if (loginTimestamp) {
      const loginTime = parseInt(loginTimestamp, 10);
      const currentTime = Date.now();
      const timeDiff = currentTime - loginTime;

      if (timeDiff < SESSION_DURATION) {
        // 在有效期内，保持登录状态
        setIsAuthenticated(true);
      } else {
        // 超过有效期，清除时间戳
        localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
      }
    }

    // 无论是否命中时间戳检查，都结束加载状态
    setIsCheckingAuth(false);
  }, []);

  const login = () => {
    // 登录时记录当前时间戳
    localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
    setIsAuthenticated(true);
  };

  const logout = () => {
    // 退出时清除时间戳
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