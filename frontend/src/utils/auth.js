/**
 * 认证工具函数
 * 用于JWT令牌管理
 */

// 本地存储的键名
const TOKEN_KEY = 'popquiz_auth_token';
const USER_KEY = 'popquiz_user_data';

/**
 * 设置认证令牌和用户信息
 * @param {string} token JWT令牌
 * @param {Object} userData 用户数据
 */
export const setAuth = (token, userData) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
};

/**
 * 获取认证令牌
 * @returns {string|null} JWT令牌或null
 */
export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 获取当前用户信息
 * @returns {Object|null} 用户数据或null
 */
export const getCurrentUser = () => {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch (e) {
    console.error('解析用户数据失败', e);
    return null;
  }
};

/**
 * 清除认证信息
 */
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * 检查用户是否已认证
 * @returns {boolean} 是否已认证
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;
  
  // 检查令牌是否过期
  try {
    // 解析JWT令牌
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // 转换为毫秒
    
    if (Date.now() >= expiry) {
      // 令牌已过期，清除认证信息
      clearAuth();
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('解析令牌失败', e);
    return false;
  }
};

/**
 * 获取认证请求头
 * @returns {Object} 包含Authorization头的对象
 */
export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * 获取用户角色
 * @returns {string[]} 角色数组
 */
export const getUserRoles = () => {
  const user = getCurrentUser();
  return user && user.roles ? user.roles : [];
};

/**
 * 检查用户是否具有特定角色
 * @param {string|string[]} requiredRoles 需要的角色
 * @returns {boolean} 是否具有所需角色
 */
export const hasRole = (requiredRoles) => {
  const userRoles = getUserRoles();
  if (!userRoles.length) return false;
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.some(role => userRoles.includes(role));
  }
  
  return userRoles.includes(requiredRoles);
};

/**
 * 更新用户资料
 * @param {Object} userData 更新的用户数据
 */
export const updateUserProfile = (userData) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  const updatedUser = { ...currentUser, ...userData };
  localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
}; 