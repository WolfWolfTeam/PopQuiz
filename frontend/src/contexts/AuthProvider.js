import React, { useState, useEffect } from 'react';
import AuthContext from './AuthContext';
import { setAuth, clearAuth, getAuthToken, getCurrentUser } from '../utils/auth';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getCurrentUser());
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(false);

  const login = (token, user) => {
    setAuth(token, user);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    setUser(getCurrentUser());
    setToken(getAuthToken());
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!token,
      user,
      token,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 