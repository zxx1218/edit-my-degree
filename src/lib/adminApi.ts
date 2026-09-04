import { generateSignature } from "./api";

// 设置API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * 检查响应是否为黑名单拦截，如果是则显示友好提示
 */
function checkBlacklistResponse(response: Response, data: any): boolean {
  // 检查是否是403状态码且包含黑名单相关错误信息
  if (response.status === 403 && data.error) {
    const errorMsg = data.error;
    
    // 检测黑名单相关的错误信息
    if (errorMsg.includes('封禁') || errorMsg.includes('拉黑') || errorMsg.includes('黑名单')) {
      // 创建或更新全局提示元素
      showBlacklistAlert(errorMsg);
      return true;
    }
  }
  
  return false;
}

/**
 * 显示黑名单封禁的全局提示
 */
function showBlacklistAlert(errorMessage: string) {
  // 移除已存在的提示
  const existingAlert = document.getElementById('blacklist-alert');
  if (existingAlert) {
    existingAlert.remove();
  }
  
  // 创建新的提示元素
  const alertDiv = document.createElement('div');
  alertDiv.id = 'blacklist-alert';
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border: 2px solid #ef4444;
    border-radius: 12px;
    padding: 16px 24px;
    box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
    max-width: 90%;
    width: 500px;
    animation: slideDown 0.3s ease-out;
  `;
  
  alertDiv.innerHTML = `
    <div style="display: flex; align-items: start; gap: 12px;">
      <div style="flex-shrink: 0; width: 24px; height: 24px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div style="flex: 1;">
        <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 16px; font-weight: 600;">⚠️ 访问受限</h3>
        <p style="margin: 0 0 8px 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">${errorMessage}</p>
        <p style="margin: 0; color: #991b1b; font-size: 13px; font-weight: 500;">💡 提示：由于请求过于频繁，您的IP已被临时封禁。请在15分钟后再试。</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; padding: 4px; color: #991b1b; font-size: 20px; line-height: 1;">×</button>
    </div>
  `;
  
  // 添加动画样式
  if (!document.getElementById('blacklist-alert-style')) {
    const style = document.createElement('style');
    style.id = 'blacklist-alert-style';
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(alertDiv);
  
  // 10秒后自动移除
  setTimeout(() => {
    const alert = document.getElementById('blacklist-alert');
    if (alert) {
      alert.style.opacity = '0';
      alert.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => alert.remove(), 300);
    }
  }, 10000);
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
