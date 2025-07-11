import React, { useContext } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import AuthContext from '../../contexts/AuthContext';

// 导航菜单配置
const navItems = [
  { text: '仪表盘', icon: <DashboardIcon />, path: '/dashboard', roles: ['ORGANIZER', 'SPEAKER', 'AUDIENCE'] },
  { text: '我的讲座', icon: <SchoolIcon />, path: '/lectures', roles: ['ORGANIZER', 'SPEAKER', 'AUDIENCE'] },
  { text: '创建讲座', icon: <AddIcon />, path: '/lectures/create', roles: ['ORGANIZER'] },
  { text: '我的测验', icon: <QuizIcon />, path: '/quizzes', roles: ['SPEAKER', 'AUDIENCE'] },
  { text: '统计报告', icon: <BarChartIcon />, path: '/statistics', roles: ['ORGANIZER', 'SPEAKER'] },
  { text: '个人资料', icon: <PersonIcon />, path: '/profile', roles: ['ORGANIZER', 'SPEAKER', 'AUDIENCE'] }
];

const Sidebar = ({ open, width }) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  // 根据用户角色过滤菜单项
  const filteredNavItems = user ? navItems.filter(item => 
    !item.roles || item.roles.some(role => user.roles?.includes(role))
  ) : [];

  // 侧边栏内容
  const drawerContent = (
    <>
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {filteredNavItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path))}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} PopQuiz
          </Typography>
          <Typography variant="caption" color="text.secondary">
            版本 1.0.0
          </Typography>
        </Box>
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ 
        width: { sm: open ? width : 0 },
        flexShrink: { sm: 0 },
      }}
      aria-label="menu navigation"
    >
      {/* 移动端抽屉 */}
      <Drawer
        variant="temporary"
        open={open}
        ModalProps={{ keepMounted: true }} // Better mobile performance
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* 桌面端抽屉 */}
      <Drawer
        variant="persistent"
        open={open}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar; 