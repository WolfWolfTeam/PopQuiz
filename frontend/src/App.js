import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';
import axios from 'axios';
import WebSocketService from './services/WebSocketService';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// 布局组件
import Layout from './components/layout/Layout';

// 页面组件
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import NotFound from './components/common/NotFound';

// 讲座组件
import LectureList from './components/lecture/LectureList';
import LectureCreate from './components/lecture/LectureCreate';
import LectureDetail from './components/lecture/LectureDetail';

// 测验组件
import QuizList from './components/quiz/QuizList';
import QuizCreate from './components/quiz/QuizCreate';
import QuizPlay from './components/quiz/QuizPlay';
import QuizResults from './components/quiz/QuizResults';

// 定义主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// 设置全局axios默认值
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// 添加请求拦截器
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('axios 请求:', config.url, 'Authorization:', config.headers.Authorization);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 清除本地认证信息
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 如果不在登录页，则重定向到登录页
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * 私有路由组件
 * 需要用户认证才能访问
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>加载中...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

/**
 * 公共路由组件
 * 已认证用户会被重定向到首页
 */
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>加载中...</div>;
  }
  
  return !isAuthenticated ? children : <Navigate to="/" />;
};

/**
 * 应用主组件
 */
function AppContent() {
  const { isAuthenticated } = useAuth();
  
  // 通知状态
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 处理WebSocket通知
  useEffect(() => {
    // 当用户已认证，初始化WebSocket连接
    if (isAuthenticated) {
      WebSocketService.init();
      
      // 监听自定义通知事件
      const handleNotification = (event) => {
        const { title, body, severity = 'info' } = event.detail;
        
        setNotification({
          open: true,
          message: body || title,
          severity
        });
      };
      
      // 添加事件监听器
      window.addEventListener('userNotification', handleNotification);
      
      // 组件卸载时移除事件监听器
      return () => {
        window.removeEventListener('userNotification', handleNotification);
      };
    }
  }, [isAuthenticated]);
  
  // 处理关闭通知
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setNotification({ ...notification, open: false });
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
          {/* 公共路由 - 未登录用户可访问 */}
          <Route 
            path="/login" 
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            } 
          />
          
          {/* 私有路由 - 需要登录 */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            {/* 默认路由重定向到仪表盘 */}
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* 讲座相关路由 */}
            <Route path="lectures" element={<LectureList />} />
            <Route path="lectures/create" element={<LectureCreate />} />
            <Route path="lectures/:lectureId" element={<LectureDetail />} />
            
            {/* 测验相关路由 */}
            <Route path="lectures/:lectureId/quizzes/create" element={<QuizCreate />} />
            <Route path="quizzes" element={<QuizList />} />
            <Route path="quiz/:quizId/play" element={<QuizPlay />} />
            <Route path="quiz/:quizId/results" element={<QuizResults />} />
            
            {/* 找不到页面 */}
            <Route path="*" element={<NotFound />} />
          </Route>
      </Routes>
      
      {/* 通知提示 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

/**
 * 应用根组件
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App; 