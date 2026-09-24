import { generateSignature } from "./api";
import { toast } from "@/hooks/use-toast";

// 设置API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * 检查响应是否为黑名单拦截，如果是则显示友好提示
 */
function checkBlacklistResponse(response: Response, data: any): boolean {
  // 检查是否是403状态码且包含黑名单相关错误信息
  if (response.status === 403 && (data.error || data.message)) {
    // 优先使用message字段（包含完整的reason和封禁时间信息）
    const errorMsg = data.message || data.error;
    
    // 检测黑名单相关的错误信息
    if (errorMsg.includes('封禁') || errorMsg.includes('拉黑') || errorMsg.includes('黑名单')) {
      // 使用toast显示封禁原因
      showBlacklistAlert(errorMsg);
      return true;
    }
  }
  
  return false;
}

/**
 * 显示黑名单封禁的toast提示
 */
let lastBlacklistMessage = '';
let lastBlacklistTime = 0;
const BLACKLIST_DEBOUNCE_TIME = 3000; // 3秒内不重复显示相同消息

function showBlacklistAlert(errorMessage: string) {
  const now = Date.now();
  
  // 如果相同的消息在3秒内已经显示过，则不再显示
  if (errorMessage === lastBlacklistMessage && (now - lastBlacklistTime) < BLACKLIST_DEBOUNCE_TIME) {
    return;
  }
  
  lastBlacklistMessage = errorMessage;
  lastBlacklistTime = now;
  
  toast({
    description: errorMessage,
  });
}

/**
 * 封装fetch请求，自动处理黑名单响应
 */
async function fetchWithBlacklistCheck(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  
  // 克隆响应以便可以多次读取
  const clonedResponse = response.clone();
  
  try {
    const data = await clonedResponse.json();
    checkBlacklistResponse(response, data);
  } catch (e) {
    // 如果不是JSON响应，忽略
  }
  
  return response;
}

// 创建带签名的请求选项
function createSignedRequestOptions(method: string, url: string, body?: any) {
  const timestamp = Date.now();
  
  const signature = generateSignature(
    method,
    url,
    body || {},
    timestamp
  );
  
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp.toString(),
      'X-Signature': signature,
      'X-App-Key': import.meta.env.VITE_APP_KEY || 'default_app_key'
    },
    body: body ? JSON.stringify(body) : undefined
  };
}

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
