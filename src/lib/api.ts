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
  const response = await fetch(`${API_BASE_URL}/auth`, options);

  const data = await response.json();
  
  return data;
};

// 注册API
export const registerUser = async (username: string, password: string): Promise<LoginResponse> => {
  const options = createSignedRequestOptions('POST', '/api/register', { username, password });
  const response = await fetch(`${API_BASE_URL}/register`, options);

  const data = await response.json();
  
  return data;
};

// 获取用户数据API
export const getUserData = async (userId: string): Promise<UserData> => {
  const options = createSignedRequestOptions('POST', '/api/get-user-data', { userId });
  const response = await fetch(`${API_BASE_URL}/get-user-data`, options);

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
  const response = await fetch(`${API_BASE_URL}/update-data`, options);

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
  
  const response = await fetch(`${API_BASE_URL}/change-password`, {
    ...options,
    headers
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '修改密码失败');
  }

  return data;
};

// 减少 PDF 积分 API
export const decreasePdfLimit = async (username: string, decreaseAmount: number) => {
  const options = createSignedRequestOptions('POST', '/api/decrease-pdf-limit', { username, decreaseAmount });
  const response = await fetch(`${API_BASE_URL}/decrease-pdf-limit`, options);

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
  const response = await fetch(`${API_BASE_URL}/query-user-logins-pdf`, options);

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
  const response = await fetch(`${API_BASE_URL}/get-messages`, options);

  const data = await response.json();
  
  return data;
};

// 添加留言 API
export interface AddMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const addMessage = async (content: string): Promise<AddMessageResponse> => {
  const options = createSignedRequestOptions('POST', '/api/add-message', { content });
  const response = await fetch(`${API_BASE_URL}/add-message`, options);

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
  const response = await fetch(`${API_BASE_URL}/get-messages`, options);

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
  const response = await fetch(`${API_BASE_URL}/get-messages`, options);

  const data = await response.json();
  
  return data;
};
