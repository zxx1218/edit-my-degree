import { generateSignature } from "./api";

// 设置API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

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
  
  const response = await fetch(`${API_BASE_URL}/admin-auth`, options);
  return await response.json();
};

// 获取所有用户
export const getAllUsers = async (token: string) => {
  const url = '/api/get-all-users';
  const options = createSignedRequestOptions('POST', url, {});
  
  const response = await fetch(`${API_BASE_URL}/get-all-users`, {
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
  
  const response = await fetch(`${API_BASE_URL}/manage-cards`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 更新用户登录次数
export const updateUserLogins = async (token: string, body: any) => {
  const url = '/api/update-user-logins';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetch(`${API_BASE_URL}/update-user-logins`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 减少用户登录次数
export const decreaseUserLogins = async (token: string, body: any) => {
  const url = '/api/decrease-user-logins';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetch(`${API_BASE_URL}/decrease-user-logins`, {
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
  
  const response = await fetch(`${API_BASE_URL}/reset-user-logins`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 增加PDF限制
export const increasePdfLimit = async (token: string, body: any) => {
  const url = '/api/increase-pdf-limit';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetch(`${API_BASE_URL}/increase-pdf-limit`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 减少PDF限制
export const decreasePdfLimit = async (token: string, body: any) => {
  const url = '/api/decrease-pdf-limit';
  const options = createSignedRequestOptions('POST', url, body);
  
  const response = await fetch(`${API_BASE_URL}/decrease-pdf-limit`, {
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
  
  const response = await fetch(`${API_BASE_URL}/reset-pdf-limit`, {
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
  
  const response = await fetch(`${API_BASE_URL}/get-today-login-count`, {
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
  
  const response = await fetch(`${API_BASE_URL}/get-hourly-login-stats`, {
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
  
  const response = await fetch(`${API_BASE_URL}/get-login-stats-range`, {
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
  
  const response = await fetch(`${API_BASE_URL}/get-user-activity-heatmap`, {
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
  
  const response = await fetch(`${API_BASE_URL}/get-top-active-users`, {
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
  
  const response = await fetch(`${API_BASE_URL}/get-today-login-details`, {
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
  
  const response = await fetch(`${API_BASE_URL}/change-password`, {
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
  
  const response = await fetch(`${API_BASE_URL}/delete-user`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
