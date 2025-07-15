import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  getUserRoles: () => [],
  hasRole: () => false
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从localStorage恢复认证状态
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        // 设置axios默认header
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      const { token: newToken, user: userData } = response.data;
      
      // 保存到localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 更新状态
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      // 设置axios默认header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || '登录失败' 
      };
    }
  };

  const logout = () => {
    // 清除localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 清除状态
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // 清除axios默认header
    delete axios.defaults.headers.common['Authorization'];
  };

  const getUserRoles = () => {
    if (!user || !user.role) return [];
    return [user.role];
  };

  const hasRole = (role) => {
    if (!user || !user.role) return false;
    return user.role === role;
  };

  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout,
    getUserRoles,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 