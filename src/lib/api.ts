import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  username: string;
  remaining_logins: number;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  error?: string;
}

export interface UserData {
  studentStatus: any[];
  education: any[];
  degree: any[];
  exam: any[];
}

// 登录API
export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
  const { data, error } = await supabase.functions.invoke('auth', {
    body: { username, password },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 注册API
export const registerUser = async (username: string, password: string): Promise<LoginResponse> => {
  const { data, error } = await supabase.functions.invoke('register', {
    body: { username, password },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 获取用户数据API
export const getUserData = async (userId: string): Promise<UserData> => {
  const { data, error } = await supabase.functions.invoke('get-user-data', {
    body: { userId },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// 更新数据API
export const updateData = async (
  table: string,
  action: 'insert' | 'update' | 'delete',
  userId: string,
  data?: any,
  id?: string
) => {
  const { data: result, error } = await supabase.functions.invoke('update-data', {
    body: { table, action, data, id, userId },
  });

  if (error) {
    throw new Error(error.message);
  }

  return result;
};
