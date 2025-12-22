import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// 管理员登录
export const adminLogin = async (username: string, password: string) => {
  const { data, error } = await supabase.functions.invoke('verify-admin', {
    body: { username, password },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 获取今日登录统计
export const getTodayLoginCount = async (token: string) => {
  const { data, error } = await supabase.functions.invoke('get-today-login-count', {
    body: { token },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 获取每小时登录统计
export const getHourlyLoginStats = async (token: string, params: { date: string }) => {
  const { data, error } = await supabase.functions.invoke('get-hourly-login-stats', {
    body: { token, ...params },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 获取周/月登录统计
export const getLoginStatsRange = async (token: string, params: { range: "week" | "month" }) => {
  const { data, error } = await supabase.functions.invoke('get-login-stats-range', {
    body: { token, ...params },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 获取所有用户
export const getAllUsers = async (token: string) => {
  const { data, error } = await supabase.functions.invoke('get-all-users', {
    body: { token },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 更新用户登录次数
export const updateUserLogins = async (token: string, params: { username: string; addLogins: number }) => {
  const { data, error } = await supabase.functions.invoke('update-user-logins', {
    body: { token, ...params },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 减少用户登录次数
export const decreaseUserLogins = async (token: string, params: { username: string; decreaseLogins: number }) => {
  const { data, error } = await supabase.functions.invoke('decrease-user-logins', {
    body: { token, ...params },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 重置用户登录次数
export const resetUserLogins = async (token: string, params: { username: string }) => {
  const { data, error } = await supabase.functions.invoke('reset-user-logins', {
    body: { token, ...params },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 增加PDF积分
export const increasePdfLimit = async (token: string, params: { username: string; increaseAmount: number }) => {
  const { data, error } = await supabase.functions.invoke('update-pdf-limit', {
    body: { token, ...params },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 减少PDF积分
export const decreasePdfLimit = async (token: string, params: { username: string; decreaseAmount: number }) => {
  const { data, error } = await supabase.functions.invoke('decrease-pdf-limit', {
    body: { token, ...params },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 重置PDF积分
export const resetPdfLimit = async (token: string, params: { username: string }) => {
  const { data, error } = await supabase.functions.invoke('reset-pdf-limit', {
    body: { token, ...params },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 充值卡管理
export const manageCards = async (token: string, params: {
  action: 'list' | 'create';
  type?: string;
  values?: number;
  count?: number;
}) => {
  const { data, error } = await supabase.functions.invoke('manage-cards', {
    body: { token, ...params },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 获取系统日志
export const getSystemLogs = async (token: string, params?: { limit?: number; search?: string }) => {
  const { data, error } = await supabase.functions.invoke('get-system-logs', {
    body: { token, ...params },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 添加系统日志
export const addSystemLog = async (level: string, message: string, source?: string, details?: string) => {
  const { data, error } = await supabase.functions.invoke('add-system-log', {
    body: { level, message, source, details },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
