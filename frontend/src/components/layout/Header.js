import React, { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import AuthContext from '../../contexts/AuthContext';
import NotificationContext from '../../contexts/NotificationContext';

const Header = ({
  sidebarOpen,
  sidebarWidth,
  toggleSidebar,
  toggleNotifications
}) => {
  const { user, logout } = useContext(AuthContext);
  const { notifications } = useContext(NotificationContext);
  
  // 用户菜单状态
  const [anchorEl, setAnchorEl] = React.useState(null);
  const userMenuOpen = Boolean(anchorEl);
  
  // 打开用户菜单
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // 关闭用户菜单
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };
  
  // 处理登出
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };
  
  // 计算未读通知数量
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        width: { sm: `calc(100% - ${sidebarOpen ? sidebarWidth : 0}px)` },
        ml: { sm: `${sidebarOpen ? sidebarWidth : 0}px` },
        transition: (theme) => theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography
          variant="h6"
          noWrap
          component={RouterLink}
          to="/"
          sx={{ 
            flexGrow: 1,
            color: 'white',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box 
            component="img"
            src="/logo192.png"
            alt="PopQuiz Logo"
            sx={{ height: 32, mr: 1 }}
          />
          PopQuiz
        </Typography>
        
        {/* 通知按钮 */}
        <Tooltip title="通知">
          <IconButton color="inherit" onClick={toggleNotifications}>
            <Badge badgeContent={unreadNotifications} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        
        {/* 用户菜单 */}
        <Box sx={{ ml: 1 }}>
          <Tooltip title="账户设置">
            <IconButton
              onClick={handleUserMenuOpen}
              size="small"
              sx={{ ml: 1 }}
              aria-controls={userMenuOpen ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={userMenuOpen ? 'true' : undefined}
            >
              {user?.avatar ? (
                <Avatar 
                  alt={user.username} 
                  src={user.avatar} 
                  sx={{ width: 32, height: 32 }} 
                />
              ) : (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              )}
            </IconButton>
          </Tooltip>
          
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={userMenuOpen}
            onClose={handleUserMenuClose}
            MenuListProps={{
              'aria-labelledby': 'account-button',
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem 
              component={RouterLink} 
              to="/profile" 
              onClick={handleUserMenuClose}
            >
              <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
              我的资料
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              退出登录
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 