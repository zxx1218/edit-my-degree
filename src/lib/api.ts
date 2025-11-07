// 删除所有原有代码并替换为以下内容
export interface User {
  id: string;
  username: string;
  remaining_logins: number;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  error?: string;
  token?: string;
}

export interface UserData {
  studentStatus: any[];
  education: any[];
  degree: any[];
  exam: any[];
}

// 设置API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// 登录API
export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '登录失败');
  }

  return data;
};

// 注册API
export const registerUser = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  
  if (!response.ok && response.status !== 400) {
    throw new Error('网络错误');
  }

  return data;
};

// 获取用户数据API
export const getUserData = async (userId: string): Promise<UserData> => {
  const response = await fetch(`${API_BASE_URL}/get-user-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

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
  const response = await fetch(`${API_BASE_URL}/update-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ table, action, data, id, userId }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || '操作失败');
  }

  return result;
};