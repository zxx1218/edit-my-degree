/**
 * 管理员API调用示例 - 包含新的安全验证机制
 */

import { generateSignature } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// ==================== 管理员操作相关函数 ====================

/**
 * 管理员登录获取adminToken
 */
export const adminLogin = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/admin-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password })
  });
  
  return await response.json();
};

/**
 * 管理员调整用户登录次数（使用isad和adminToken）
 */
export const adminUpdateUserLogins = async (
  adminToken: string, 
  params: {
    username: string;
    addLogins: number;
  }
) => {
  const url = '/api/update-user-logins';
  const timestamp = Date.now();
  
  const body = {
    ...params,
    isad: true,              // 标识为管理员操作
    adminToken: adminToken   // 必须提供管理员Token
  };
  
  const signature = generateSignature('POST', url, body, timestamp);
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp.toString(),
      'X-Signature': signature,
      'X-App-Key': import.meta.env.VITE_APP_KEY || 'default_app_key'
    },
    body: JSON.stringify(body)
  });
  
  return await response.json();
};

/**
 * 管理员增加用户PDF积分（使用isad和adminToken）
 */
export const adminIncreasePdfLimit = async (
  adminToken: string,
  params: {
    username: string;
    increaseAmount: number;
  }
) => {
  const url = '/api/increase-pdf-limit';
  const timestamp = Date.now();
  
  const body = {
    ...params,
    isad: true,
    adminToken: adminToken
  };
  
  const signature = generateSignature('POST', url, body, timestamp);
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp.toString(),
      'X-Signature': signature,
      'X-App-Key': import.meta.env.VITE_APP_KEY || 'default_app_key'
    },
    body: JSON.stringify(body)
  });
  
  return await response.json();
};

/**
 * 管理员减少用户PDF积分（使用isad和adminToken）
 */
export const adminDecreasePdfLimit = async (
  adminToken: string,
  params: {
    username: string;
    decreaseAmount: number;
  }
) => {
  const url = '/api/decrease-pdf-limit';
  const timestamp = Date.now();
  
  const body = {
    ...params,
    isad: true,
    adminToken: adminToken
  };
  
  const signature = generateSignature('POST', url, body, timestamp);
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp.toString(),
      'X-Signature': signature,
      'X-App-Key': import.meta.env.VITE_APP_KEY || 'default_app_key'
    },
    body: JSON.stringify(body)
  });
  
  return await response.json();
};

// ==================== 充值卡相关函数 ====================

/**
 * 加密充值卡ID（生成SBverify值）
 * 使用浏览器兼容的Base64编码
 */
export function encryptCardId(cardId: string): string {
  // 使用浏览器原生的btoa函数进行Base64编码
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
  const timestamp = Date.now();
  
  // 加密充值卡ID
  const SBverify = encryptCardId(params.cardId);
  
  const body = {
    action: 'use',
    username: params.username,
    SBverify: SBverify  // 传递加密后的卡ID
  };
  
  const signature = generateSignature('POST', url, body, timestamp);
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp.toString(),
      'X-Signature': signature,
      'X-App-Key': import.meta.env.VITE_APP_KEY || 'default_app_key'
    },
    body: JSON.stringify(body)
  });
  
  return await response.json();
};

// ==================== 使用示例 ====================

/**
 * 示例1：管理员登录后调整用户登录次数
 */
export async function exampleAdminUpdateLogins() {
  // 1. 管理员登录
  const loginResult = await adminLogin('admin', 'admin_password');
  if (!loginResult.success) {
    console.error('管理员登录失败:', loginResult.error);
    return;
  }
  
  const adminToken = loginResult.token;
  
  // 2. 调整用户登录次数
  const updateResult = await adminUpdateUserLogins(adminToken, {
    username: '张三',
    addLogins: 10
  });
  
  if (updateResult.success) {
    console.log('调整成功:', updateResult);
  } else {
    console.error('调整失败:', updateResult.error);
  }
}

/**
 * 示例2：用户使用充值卡充值
 */
export async function exampleUseRechargeCard() {
  const cardId = '550e8400-e29b-41d4-a716-446655440000'; // 从输入框或扫码获取
  
  const result = await useRechargeCard({
    username: '当前用户名',
    cardId: cardId
  });
  
  if (result.success) {
    console.log('充值成功:', result.message);
  } else {
    console.error('充值失败:', result.error);
  }
}
