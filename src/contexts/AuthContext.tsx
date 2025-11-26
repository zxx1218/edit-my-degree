import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOGIN_TIMESTAMP_KEY = "auth_login_timestamp";
const SESSION_DURATION = 5 * 60 * 1000; // 5分钟（毫秒）

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 检查登录状态是否在5分钟内
  useEffect(() => {
    const loginTimestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
    if (loginTimestamp) {
      const loginTime = parseInt(loginTimestamp, 10);
      const currentTime = Date.now();
      const timeDiff = currentTime - loginTime;

      if (timeDiff < SESSION_DURATION) {
        // 在5分钟内，保持登录状态
        setIsAuthenticated(true);
      } else {
        // 超过5分钟，清除时间戳
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
