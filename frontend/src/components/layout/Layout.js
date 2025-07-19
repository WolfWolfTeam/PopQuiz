import React, { useState, useEffect } from 'react';
import { Outlet, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  ListItemButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import AccountCircle from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { clearAuth, getCurrentUser } from '../../utils/auth';

// 侧边栏宽度
const drawerWidth = 240;

/**
 * 布局组件
 * 包含顶部导航栏和侧边栏
 */
const Layout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // 状态
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [user, setUser] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // 获取当前用户信息
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);
  
  // 监听通知事件
  useEffect(() => {
    const handleNotification = (event) => {
      const newNotification = event.detail;
      setNotifications(prev => [newNotification, ...prev]);
    };
    
    window.addEventListener('userNotification', handleNotification);
    
    return () => {
      window.removeEventListener('userNotification', handleNotification);
    };
  }, []);
  
  // 切换侧边栏
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // 打开用户菜单
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  // 关闭用户菜单
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  // 打开通知菜单
  const handleNotificationMenuOpen = (event) => {
    setNotificationMenuAnchor(event.currentTarget);
  };
  
  // 关闭通知菜单
  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchor(null);
  };
  
  // 处理登出
  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };
  
  // 处理通知点击
  const handleNotificationClick = (notification) => {
    // 如果有重定向URL，则导航到该URL
    if (notification.redirectUrl) {
      navigate(notification.redirectUrl);
    }
    
    setNotificationMenuAnchor(null);
  };
  
  // 清除所有通知
  const clearAllNotifications = () => {
    setNotifications([]);
    setNotificationMenuAnchor(null);
  };
  
  // 侧边栏菜单项
  const menuItems = [
    { 
      text: '仪表盘', 
      icon: <DashboardIcon />, 
      path: '/dashboard'
    },
    { 
      text: '讲座', 
      icon: <SchoolIcon />, 
      path: '/lectures'
    },
    { 
      text: '测验', 
      icon: <QuizIcon />, 
      path: '/quizzes'
    }
  ];
  
  // 判断菜单项是否激活
  const isMenuActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/') {
      return true;
    }
    
    return location.pathname.startsWith(path);
  };
  
  // 侧边栏内容
  const drawerContent = (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: [1]
        }}
      >
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, fontWeight: 'bold' }}
        >
          PopQuiz
        </Typography>
        {isMobile && (
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List component="nav">
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={isMenuActive(item.path)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <AppBar 
        position="fixed" 
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          ...(drawerOpen && !isMobile && { width: `calc(100% - ${drawerWidth}px)` })
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="菜单"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1 }}
          >
            PopQuiz
          </Typography>
          
          {/* 通知图标 */}
          <IconButton 
            color="inherit" 
            onClick={handleNotificationMenuOpen}
          >
            <Badge 
              badgeContent={notifications.length} 
              color="error"
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          {/* 用户菜单 */}
          <IconButton
            edge="end"
            color="inherit"
            aria-label="用户菜单"
            onClick={handleUserMenuOpen}
            sx={{ ml: 1 }}
          >
            {user && user.profileImage ? (
              <Avatar 
                alt={user.username} 
                src={user.profileImage}
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <AccountCircle />
            )}
          </IconButton>
          
          {/* 用户下拉菜单 */}
          <Menu
            anchorEl={userMenuAnchor}
            keepMounted
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
          >
            <MenuItem disabled>
              {user ? user.username : '用户'}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              登出
            </MenuItem>
          </Menu>
          
          {/* 通知下拉菜单 */}
          <Menu
            anchorEl={notificationMenuAnchor}
            keepMounted
            open={Boolean(notificationMenuAnchor)}
            onClose={handleNotificationMenuClose}
            PaperProps={{
              style: {
                maxHeight: 300,
                width: 320,
              },
            }}
          >
            {notifications.length === 0 ? (
              <MenuItem disabled>
                暂无通知
              </MenuItem>
            ) : (
              <>
                <MenuItem 
                  onClick={clearAllNotifications}
                  sx={{ color: 'text.secondary', justifyContent: 'center' }}
                >
                  清除所有通知
                </MenuItem>
                <Divider />
                {notifications.map((notification, index) => (
                  <MenuItem
                    key={index}
                    onClick={() => handleNotificationClick(notification)}
                    sx={{ 
                      whiteSpace: 'normal',
                      display: 'block', 
                      py: 1 
                    }}
                  >
                    <Typography variant="subtitle2">
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {notification.body}
                    </Typography>
                    {notification.createdAt && (
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </>
            )}
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* 侧边栏 */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* 主内容区域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          pt: 8,
          ...(drawerOpen && !isMobile && { marginLeft: `${drawerWidth}px` }),
          ...(isMobile && { width: '100%' }),
          bgcolor: (theme) => theme.palette.grey[50],
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout; 