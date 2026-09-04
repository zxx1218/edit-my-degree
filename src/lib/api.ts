// 删除所有原有代码并替换为以下内容
export interface User {
  id: string;
  username: string;
  remaining_logins: number;
  pdf_limit?: number;
  is_trial_user?: boolean | null; // 是否为体验版用户
}

export interface LoginResponse {
  success: boolean;
  user: User;
  error?: string;
  token?: string;
  sessionDuration?: number; // 会话时长（毫秒）
}

export interface UserData {
  studentStatus: any[];
  education: any[];
  degree: any[];
  exam: any[];
}

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

// 生成签名的辅助函数
export function generateSignature(
  method: string,
  url: string,
  params: Record<string, any>,
  timestamp: number
): string {
  // 获取密钥（在实际应用中应该更安全地存储）
  const secretKey = import.meta.env.VITE_API_SECRET_KEY || 'default_secret_key';
  
  // 将参数按字典序排序并拼接成字符串（过滤掉undefined值）
  const sortedParams = Object.keys(params)
    .filter(key => params[key] !== undefined)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // 构造待签名字符串
  const signString = `${method.toUpperCase()}${url}${sortedParams}${timestamp}`;
  
  // 使用简单哈希算法生成签名（仅作演示，生产环境中建议使用更安全的方法）
  let hash = 0;
  for (let i = 0; i < signString.length; i++) {
    const char = signString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  // 使用secretKey来影响哈希值
  for (let i = 0; i < secretKey.length; i++) {
    const char = secretKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return Math.abs(hash).toString(16);
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

// 登录API
export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
  const options = createSignedRequestOptions('POST', '/api/auth', { username, password });
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/auth`, options);

  const data = await response.json();
  
  return data;
};

// 注册API
export const registerUser = async (username: string, password: string): Promise<LoginResponse> => {
  const options = createSignedRequestOptions('POST', '/api/register', { username, password });
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/register`, options);

  const data = await response.json();
  
  return data;
};

// 获取用户数据API
export const getUserData = async (userId: string): Promise<UserData> => {
  const options = createSignedRequestOptions('POST', '/api/get-user-data', { userId });
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-user-data`, options);

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '获取数据失败');
  }

  return {
    studentStatus: data.student_status || [],
    education: data.education || [],
    degree: data.degree || [],
    exam: data.exam || []
  };
};

// 更新数据API
export const updateData = async (
  table: string,
  action: 'insert' | 'update' | 'delete',
  userId: string,
  data?: any,
  id?: string
) => {
  const options = createSignedRequestOptions('POST', '/api/update-data', { table, action, data, id, userId });
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/update-data`, options);

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || '操作失败');
  }

  return result;
};

// 修改密码API
export const changePassword = async (username: string, oldPassword: string, newPassword: string, token?: string) => {
  const options = createSignedRequestOptions('POST', '/api/change-password', { username, oldPassword, newPassword });
  
  // 如果有token，添加到请求头
  const headers: Record<string, string> = {
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/change-password`, {
    ...options,
    headers
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '修改密码失败');
  }

  return data;
};

// 忘记密码重置API - 通过用户名和卡密验证重置密码
export const resetPassword = async (username: string, cardId: string, newPassword: string, confirmPassword: string) => {
  const options = createSignedRequestOptions('POST', '/api/reset-password', { 
    username, 
    cardId, 
    newPassword, 
    confirmPassword 
  });
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/reset-password`, {
    ...options,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '密码重置失败');
  }

  return data;
};

// 减少 PDF 积分 API
export const decreasePdfLimit = async (username: string, decreaseAmount: number) => {
  const options = createSignedRequestOptions('POST', '/api/decrease-pdf-limit', { username, decreaseAmount });
  
  // 获取JWT token用于认证
  const authToken = localStorage.getItem("authToken");
  
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/decrease-pdf-limit`, {
    ...options,
    headers: {
      ...options.headers,
      ...(authToken && { "Authorization": `Bearer ${authToken}` }),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '减少 PDF 积分失败');
  }

  return data;
};

// 查询用户登录次数和 PDF 积分 API
export interface QueryUserLoginsPdfResponse {
  success: boolean;
  user: {
    id: string;
    username: string;
    remaining_logins: number;
    pdf_limit: number;
  };
  error?: string;
}

export const queryUserLoginsPdf = async (username: string, password: string): Promise<QueryUserLoginsPdfResponse> => {
  const options = createSignedRequestOptions('POST', '/api/query-user-logins-pdf', { username, password });
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/query-user-logins-pdf`, options);

  const data = await response.json();
  
  return data;
};

// 获取留言列表 API
export interface Message {
  id: string;
  username: string;
  content: string;
  reply_content?: string | null;
  replied_at?: string | null;
  priority?: number | null; // 留言优先级，数字越小越靠前，1表示置顶
  created_at: string;
}

export interface GetMessagesResponse {
  success: boolean;
  messages: Message[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
}

export const getMessages = async (page: number = 1, pageSize: number = 10): Promise<GetMessagesResponse> => {
  const options = createSignedRequestOptions('POST', '/api/get-messages', { page, pageSize });
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-messages`, options);

  const data = await response.json();
  
  // 转换后端返回格式为前端期望格式
  if (data.success && data.data) {
    return {
      success: true,
      messages: data.data,
      total: data.pagination?.total || 0,
      page: data.pagination?.page || page,
      pageSize: data.pagination?.pageSize || pageSize,
      totalPages: data.pagination?.totalPages || 0
    };
  }
  
  return data;
};

// 添加留言 API
export interface AddMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const addMessage = async (content: string, username: string): Promise<AddMessageResponse> => {
  const options = createSignedRequestOptions('POST', '/api/add-message', { content, username });
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/add-message`, options);

  const data = await response.json();
  
  return data;
};

// 回复留言 API
export interface ReplyMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const replyMessage = async (messageId: string, replyContent: string): Promise<ReplyMessageResponse> => {
  const options = createSignedRequestOptions('POST', '/api/get-messages', { action: 'replyMessage', messageId, replyContent });
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-messages`, options);

  const data = await response.json();
  
  return data;
};

// 删除留言 API
export interface DeleteMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const deleteMessage = async (messageId: string): Promise<DeleteMessageResponse> => {
  const options = createSignedRequestOptions('POST', '/api/get-messages', { action: 'deleteMessage', messageId });
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-messages`, options);

  const data = await response.json();
  
  return data;
};

// 设置留言优先级 API
export interface SetPriorityResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const setPriority = async (messageId: string, priority: number | null): Promise<SetPriorityResponse> => {
  const options = createSignedRequestOptions('POST', '/api/get-messages', { action: 'setPriority', messageId, priority });
  const response = await fetchWithBlacklistCheck(`${API_BASE_URL}/get-messages`, options);

  const data = await response.json();
  
  return data;
};
