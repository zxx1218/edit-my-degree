import { generateSignature, createSignedRequestOptions, fetchWithBlacklistCheck } from "./api";

// 设置API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// 管理员登录API
export const adminLogin = async (username: string, password: string) => {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password })
  };
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/admin-auth`, options);
  return await response.json();
};

// 获取所有用户
export const getAllUsers = async (token: string) => {
  const url = '/api/get-all-users';
  const options = createSignedRequestOptions('POST', url, {});
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-all-users`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 管理卡片
export const manageCards = async (token: string, body: any) => {
  const url = '/api/manage-cards';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-cards`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 更新用户登录次数（管理员操作）
export const updateUserLogins = async (token: string, body: any) => {
  const url = '/api/update-user-logins';
  
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/update-user-logins`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 减少用户登录次数（管理员操作）
export const decreaseUserLogins = async (token: string, body: any) => {
  const url = '/api/decrease-user-logins';
  
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/decrease-user-logins`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 重置用户登录次数
export const resetUserLogins = async (token: string, body: any) => {
  const url = '/api/reset-user-logins';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/reset-user-logins`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 增加PDF限制（管理员操作）
export const increasePdfLimit = async (token: string, body: any) => {
  const url = '/api/increase-pdf-limit';
  
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/increase-pdf-limit`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 减少PDF限制（管理员操作）
export const decreasePdfLimit = async (token: string, body: any) => {
  const url = '/api/decrease-pdf-limit';
  
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/decrease-pdf-limit`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 重置PDF限制
export const resetPdfLimit = async (token: string, body: any) => {
  const url = '/api/reset-pdf-limit';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/reset-pdf-limit`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取今日登录统计
export const getTodayLoginCount = async (token: string) => {
  const url = '/api/get-today-login-count';
  const options = createSignedRequestOptions('POST', url, {});
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-today-login-count`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取每小时登录统计
export const getHourlyLoginStats = async (token: string, body: any) => {
  const url = '/api/get-hourly-login-stats';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-hourly-login-stats`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取登录统计范围
export const getLoginStatsRange = async (token: string, body: any) => {
  const url = '/api/get-login-stats-range';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-login-stats-range`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取用户活跃度热力图
export const getUserActivityHeatmap = async (token: string) => {
  const url = '/api/get-user-activity-heatmap';
  const options = createSignedRequestOptions('POST', url, {});
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-user-activity-heatmap`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取Top活跃用户排行榜
export const getTopActiveUsers = async (token: string, body: any) => {
  const url = '/api/get-top-active-users';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-top-active-users`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取今日登录详情
export const getTodayLoginDetails = async (token: string) => {
  const url = '/api/get-today-login-details';
  const options = createSignedRequestOptions('POST', url, {});
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-today-login-details`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取今日收入统计
export const getTodayIncome = async (token: string) => {
  const url = '/api/get-today-income';
  const options = createSignedRequestOptions('POST', url, {});
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-today-income`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 修改用户密码
export const changeUserPassword = async (token: string, body: any) => {
  const url = '/api/change-password';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/change-password`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 删除用户
export const deleteUser = async (token: string, body: any) => {
  const url = '/api/delete-user';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/delete-user`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取省份登录统计
export const getProvinceLoginStats = async (token: string) => {
  const url = '/api/get-province-login-stats';
  const options = createSignedRequestOptions('POST', url, {});
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-province-login-stats`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取用户卡密使用记录
export const getUserCardHistory = async (token: string, username: string) => {
  const url = '/api/get-user-card-history';
  const options = createSignedRequestOptions('POST', url, { username });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-user-card-history`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

/**
 * 加密充值卡ID（生成SBverify值）
 * 使用浏览器原生的btoa函数进行Base64编码
 */
export function encryptCardId(cardId: string): string {
  return btoa(unescape(encodeURIComponent(cardId)));
}

/**
 * 使用充值卡进行充值（需要传递SBverify）
 */
export const useRechargeCard = async (params: {
  username: string;
  cardId: string;  // 原始充值卡ID
}) => {
  const url = '/api/manage-cards';
  
  // 加密充值卡ID
  const SBverify = encryptCardId(params.cardId);
  
  const body = {
    action: 'use',
    username: params.username,
    SBverify: SBverify  // 传递加密后的卡ID
  };
  
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-cards`, {
    ...options
  });
  
  return await response.json();
};

// IP黑名单管理API

// 获取所有未过期的IP黑名单记录
export const getIpBlacklist = async (token: string) => {
  const url = '/api/manage-ip-blacklist';
  const options = createSignedRequestOptions('POST', url, { action: 'list' });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-ip-blacklist`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 更新IP黑名单记录
export const updateIpBlacklist = async (token: string, body: any) => {
  const url = '/api/manage-ip-blacklist';
  const options = createSignedRequestOptions('POST', url, { action: 'update', ...body });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-ip-blacklist`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 删除IP黑名单记录
export const deleteIpBlacklist = async (token: string, id: string) => {
  const url = '/api/manage-ip-blacklist';
  const options = createSignedRequestOptions('POST', url, { action: 'delete', id });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-ip-blacklist`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 新增IP黑名单记录
export const addIpBlacklist = async (token: string, body: {
  ipAddress: string;
  reason: string;
  blockedUntil: string;
}) => {
  const url = '/api/manage-ip-blacklist';
  const options = createSignedRequestOptions('POST', url, { 
    action: 'add', 
    ...body 
  });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-ip-blacklist`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// PDF生成管理API

// 获取所有PDF生成记录
export const managePdfGeneration = async (token: string, body: any) => {
  const url = '/api/manage-pdf-generation';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-pdf-generation`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 删除PDF生成记录
export const deletePdfGeneration = async (token: string, id: string) => {
  return managePdfGeneration(token, { action: 'delete', id });
};

// 管理员直接登录用户（不消耗积分）
export const adminImpersonateLogin = async (token: string, username: string) => {
  const url = '/api/admin-impersonate-login';
  const options = createSignedRequestOptions('POST', url, { username });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/admin-impersonate-login`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 用户黑名单管理API

// 获取所有未过期的用户黑名单记录
export const getUserBlacklist = async (token: string) => {
  const url = '/api/manage-ip-blacklist';
  const options = createSignedRequestOptions('POST', url, { action: 'list', type: 'user' });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-ip-blacklist`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 更新用户黑名单记录
export const updateUserBlacklist = async (token: string, body: any) => {
  const url = '/api/manage-ip-blacklist';
  const options = createSignedRequestOptions('POST', url, { action: 'update', type: 'user', ...body });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-ip-blacklist`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 删除用户黑名单记录
export const deleteUserBlacklist = async (token: string, id: string) => {
  const url = '/api/manage-ip-blacklist';
  const options = createSignedRequestOptions('POST', url, { action: 'delete', type: 'user', id });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-ip-blacklist`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 新增用户黑名单记录
export const addUserBlacklist = async (token: string, body: {
  username: string;
  reason: string;
  blockedUntil: string;
}) => {
  const url = '/api/manage-ip-blacklist';
  const options = createSignedRequestOptions('POST', url, { 
    action: 'add', 
    type: 'user',
    ...body 
  });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-ip-blacklist`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取特别关注用户列表（有标签的用户）
export const getSpecialUsers = async (token: string) => {
  const url = '/api/get-special-users';
  const options = createSignedRequestOptions('POST', url, {});
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-special-users`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 更新用户标签
export const updateUserTags = async (token: string, body: {
  username: string;
  tags: string[];
}) => {
  const url = '/api/update-user-tags';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/update-user-tags`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取通知历史记录
export const getNotificationHistory = async (token: string, params: {
  page?: number;
  pageSize?: number;
  channel?: 'all' | 'bark' | 'email';
  status?: 'all' | 'success' | 'failed';
  searchQuery?: string;
}) => {
  const url = '/api/get-notification-history';
  const options = createSignedRequestOptions('POST', url, { 
    action: 'list',
    ...params 
  });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-notification-history`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 删除单条通知历史
export const deleteNotificationHistory = async (token: string, id: string) => {
  const url = '/api/delete-notification-history';
  const options = createSignedRequestOptions('POST', url, { id });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/delete-notification-history`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 清空所有通知历史
export const clearNotificationHistory = async (token: string) => {
  const url = '/api/clear-notification-history';
  const options = createSignedRequestOptions('POST', url, {});
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/clear-notification-history`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取密码修改统计
export const getPasswordChangeStats = async (token: string, params: {
  page?: number;
  pageSize?: number;
}) => {
  const url = '/api/get-password-change-stats';
  const options = createSignedRequestOptions('POST', url, params);
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-password-change-stats`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Bark推送管理API

// 获取Bark配置
export const getBarkConfig = async (token: string) => {
  const url = '/api/manage-bark';
  const options = createSignedRequestOptions('POST', url, { action: 'getConfig' });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-bark`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 发送Bark测试推送
export const sendBarkTest = async (token: string, body: {
  title: string;
  body: string;
  targetDeviceKey?: string;
  level?: string;
  sound?: string;
  group?: string;
}) => {
  const url = '/api/manage-bark';
  const options = createSignedRequestOptions('POST', url, { action: 'sendTest', ...body });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-bark`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 发送自定义Bark推送
export const sendBarkCustom = async (token: string, body: {
  title: string;
  body: string;
  level?: string;
  sound?: string;
  group?: string;
  icon?: string;
  url?: string;
}) => {
  const url = '/api/manage-bark';
  const options = createSignedRequestOptions('POST', url, { action: 'sendCustom', ...body });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-bark`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 获取Bark推送历史
export const getBarkHistory = async (token: string, params: {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
}) => {
  const url = '/api/manage-bark';
  const options = createSignedRequestOptions('POST', url, { action: 'getBarkHistory', ...params });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/manage-bark`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

