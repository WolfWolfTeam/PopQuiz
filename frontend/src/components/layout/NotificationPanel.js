import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import QuizIcon from '@mui/icons-material/Quiz';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CommentIcon from '@mui/icons-material/Comment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationContext from '../../contexts/NotificationContext';

// 获取通知图标
const getNotificationIcon = (type) => {
  switch (type) {
    case 'QUIZ_ACTIVATED':
      return <QuizIcon color="primary" />;
    case 'QUIZ_EXPIRED':
      return <QuizIcon color="error" />;
    case 'LECTURE_STATUS_CHANGED':
      return <EventNoteIcon color="info" />;
    case 'NEW_COMMENT':
      return <CommentIcon color="secondary" />;
    case 'STATS_UPDATED':
      return <AssessmentIcon color="success" />;
    default:
      return <NotificationsOffIcon />;
  }
};

// 格式化通知时间
const formatNotificationTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const NotificationPanel = ({ open, onClose }) => {
  const { notifications, markAsRead, clearAll } = useContext(NotificationContext);
  const navigate = useNavigate();
  
  // 处理通知点击
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // 根据通知类型导航到相应页面
    switch (notification.type) {
      case 'QUIZ_ACTIVATED':
        navigate(`/quiz/${notification.quizId}/play`);
        break;
      case 'QUIZ_EXPIRED':
        navigate(`/quiz/${notification.quizId}/results`);
        break;
      case 'LECTURE_STATUS_CHANGED':
        navigate(`/lectures/${notification.lectureId}`);
        break;
      case 'NEW_COMMENT':
        navigate(`/question/${notification.questionId}`);
        break;
      case 'STATS_UPDATED':
        navigate(`/quiz/${notification.quizId}/results`);
        break;
      default:
        break;
    }
    
    onClose();
  };

  // 获取通知消息
  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'QUIZ_ACTIVATED':
        return `有新测验开始了：${notification.title}`;
      case 'QUIZ_EXPIRED':
        return '测验已结束，查看结果';
      case 'LECTURE_STATUS_CHANGED':
        return `讲座状态已更新为：${notification.status}`;
      case 'NEW_COMMENT':
        return `${notification.commenterName} 发表了新评论`;
      case 'STATS_UPDATED':
        return '测验统计信息已更新';
      case 'CONNECT_SUCCESS':
        return notification.message || '已连接到实时通知系统';
      default:
        return '收到新通知';
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        width: 320,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 320,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6">通知</Typography>
        <Box>
          <Tooltip title="清除所有通知">
            <IconButton onClick={clearAll} edge="end">
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="关闭">
            <IconButton onClick={onClose} edge="end" sx={{ ml: 1 }}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      
      {notifications.length === 0 ? (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            p: 3,
            height: '100%'
          }}
        >
          <NotificationsOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            暂无通知
          </Typography>
        </Box>
      ) : (
        <List>
          {notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem disablePadding sx={{ 
                bgcolor: notification.read ? 'transparent' : 'action.hover'
              }}>
                <ListItemButton onClick={() => handleNotificationClick(notification)}>
                  <Box sx={{ mr: 2 }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <ListItemText 
                    primary={getNotificationMessage(notification)}
                    secondary={notification.timestamp && formatNotificationTime(notification.timestamp)}
                  />
                </ListItemButton>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Drawer>
  );
};

export default NotificationPanel; 