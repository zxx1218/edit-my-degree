import { supabase } from "@/integrations/supabase/client";

interface AdminVerifyResponse {
  success: boolean;
  error?: string;
  admin?: {
    id: string;
    username: string;
  };
}

interface AdminLoginResponse {
  success: boolean;
  error?: string;
  token?: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  [key: string]: any;
}

// 管理员登录验证
export const verifyAdmin = async (username: string, password: string): Promise<AdminVerifyResponse> => {
  const { data, error } = await supabase.functions.invoke('verify-admin', {
    body: { username, password }
  });

  if (error) {
    console.error('Admin verification error:', error);
    return { success: false, error: '验证失败，请重试' };
  }

  return data as AdminVerifyResponse;
};

// 管理员登录（返回token）
export const adminLogin = async (username: string, password: string): Promise<AdminLoginResponse> => {
  const result = await verifyAdmin(username, password);
  
  if (result.success && result.admin) {
    // 生成一个简单的token（实际项目中应该使用更安全的方式）
    const token = btoa(`${result.admin.id}:${Date.now()}`);
    return { success: true, token };
  }
  
  return { success: false, error: result.error || '登录失败' };
};

// 获取今日登录统计
export const getTodayLoginCount = async (token: string): Promise<ApiResponse> => {
  const { data, error } = await supabase.functions.invoke('get-today-login-count', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) {
    console.error('Get today login count error:', error);
    return { success: false, error: '获取登录统计失败' };
  }

  return data as ApiResponse;
};

// 获取每小时登录统计
export const getHourlyLoginStats = async (token: string, params: { date: string }): Promise<ApiResponse> => {
  const { data, error } = await supabase.functions.invoke('get-hourly-login-stats', {
    body: params,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) {
    console.error('Get hourly login stats error:', error);
    return { success: false, error: '获取每小时登录统计失败' };
  }

  return data as ApiResponse;
};

// 获取周/月登录统计
export const getLoginStatsRange = async (token: string, params: { range: 'week' | 'month' }): Promise<ApiResponse> => {
  const { data, error } = await supabase.functions.invoke('get-login-stats-range', {
    body: params,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) {
    console.error('Get login stats range error:', error);
    return { success: false, error: '获取登录统计失败' };
  }

  return data as ApiResponse;
};

// 获取所有用户
export const getAllUsers = async (token: string): Promise<ApiResponse> => {
  const { data, error } = await supabase.functions.invoke('get-all-users', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) {
    console.error('Get all users error:', error);
    return { success: false, error: '获取用户列表失败' };
  }

  return data as ApiResponse;
};

// 充值卡管理
export const manageCards = async (token: string, params: { action: string; type?: string; values?: number; count?: number }): Promise<ApiResponse> => {
  const { data, error } = await supabase.functions.invoke('manage-cards', {
    body: params,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) {
    console.error('Manage cards error:', error);
    return { success: false, error: '充值卡操作失败' };
  }

  return data as ApiResponse;
};

// 重置用户登录次数
export const resetUserLogins = async (token: string, params: { username: string }): Promise<ApiResponse> => {
  const { data, error } = await supabase.functions.invoke('reset-user-logins', {
    body: params,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) {
    console.error('Reset user logins error:', error);
    return { success: false, error: '重置登录次数失败' };
  }

  return data as ApiResponse;
};

// 增加用户登录次数
export const updateUserLogins = async (token: string, params: { username: string; addLogins: number }): Promise<ApiResponse> => {
  const { data, error } = await supabase.functions.invoke('update-user-logins', {
    body: params,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) {
    console.error('Update user logins error:', error);
    return { success: false, error: '更新登录次数失败' };
  }

  return data as ApiResponse;
};

// 减少用户登录次数
export const decreaseUserLogins = async (token: string, params: { username: string; decreaseLogins: number }): Promise<ApiResponse> => {
  const { data, error } = await supabase.functions.invoke('decrease-user-logins', {
    body: params,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) {
    console.error('Decrease user logins error:', error);
    return { success: false, error: '减少登录次数失败' };
  }

  return data as ApiResponse;
};

// 增加PDF积分
export const increasePdfLimit = async (token: string, params: { username: string; increaseAmount: number }): Promise<ApiResponse> => {
  const { data, error } = await supabase.functions.invoke('update-pdf-limit', {
    body: { ...params, action: 'increase' },
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) {
    console.error('Increase PDF limit error:', error);
    return { success: false, error: '增加PDF积分失败' };
  }

  return data as ApiResponse;
};

// 减少PDF积分
export const decreasePdfLimit = async (token: string, params: { username: string; decreaseAmount: number }): Promise<ApiResponse> => {
  const { data, error } = await supabase.functions.invoke('decrease-pdf-limit', {
    body: params,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) {
    console.error('Decrease PDF limit error:', error);
    return { success: false, error: '减少PDF积分失败' };
  }

  return data as ApiResponse;
};

// 重置PDF积分
export const resetPdfLimit = async (token: string, params: { username: string }): Promise<ApiResponse> => {
  const { data, error } = await supabase.functions.invoke('reset-pdf-limit', {
    body: params,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) {
    console.error('Reset PDF limit error:', error);
    return { success: false, error: '重置PDF积分失败' };
  }

  return data as ApiResponse;
};
