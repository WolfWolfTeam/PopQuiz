import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Divider,
  ListItemSecondaryAction,
  ListItemIcon
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BarChartIcon from '@mui/icons-material/BarChart';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import axios from 'axios';

/**
 * 测验列表组件
 * 用于显示讲座中的测验列表
 */
const QuizList = ({ quizzes, lectureId, isOwner }) => {
  // 菜单状态
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  
  // 打开菜单
  const handleMenuOpen = (event, quiz) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedQuiz(quiz);
  };
  
  // 关闭菜单
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedQuiz(null);
  };
  
  // 激活测验
  const handleActivateQuiz = async (quizId) => {
    handleMenuClose();
    try {
      await axios.post(`/api/quizzes/${quizId}/activate`);
      // 页面将通过WebSocket通知更新
    } catch (error) {
      console.error('激活测验失败:', error);
      alert('激活测验失败，请稍后再试');
    }
  };
  
  // 删除测验
  const handleDeleteQuiz = async (quizId) => {
    handleMenuClose();
    if (window.confirm('确定要删除此测验吗？此操作不可撤销。')) {
      try {
        await axios.delete(`/api/quizzes/${quizId}`);
        // 可以通过prop回调通知父组件更新列表
        window.location.reload(); // 临时解决方案，实际应该使用状态管理
      } catch (error) {
        console.error('删除测验失败:', error);
        alert('删除测验失败，请稍后再试');
      }
    }
  };
  
  // 获取测验状态标签
  const getStatusChip = (status) => {
    switch (status) {
      case 'DRAFT':
        return <Chip size="small" label="草稿" />;
      case 'PUBLISHED':
        return <Chip size="small" color="primary" label="已发布" />;
      case 'ACTIVE':
        return <Chip size="small" color="success" label="进行中" />;
      case 'EXPIRED':
        return <Chip size="small" color="default" label="已结束" />;
      default:
        return <Chip size="small" label={status} />;
    }
  };
  
  // 格式化时间
  const formatDateTime = (dateString) => {
    if (!dateString) return '未设置';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // 获取主要操作按钮
  const getPrimaryAction = (quiz) => {
    // 演讲者操作
    if (isOwner) {
      switch (quiz.status) {
        case 'DRAFT':
          return (
            <Button
              variant="outlined"
              size="small"
              component={RouterLink}
              to={`/quiz/${quiz.id}/edit`}
              sx={{ mr: 1 }}
            >
              编辑
            </Button>
          );
        case 'PUBLISHED':
          return (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => handleActivateQuiz(quiz.id)}
              startIcon={<PlayArrowIcon />}
              sx={{ mr: 1 }}
            >
              激活
            </Button>
          );
        case 'ACTIVE':
          return (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              component={RouterLink}
              to={`/quiz/${quiz.id}/live`}
              sx={{ mr: 1 }}
            >
              实时数据
            </Button>
          );
        case 'EXPIRED':
          return (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              component={RouterLink}
              to={`/quiz/${quiz.id}/results`}
              startIcon={<BarChartIcon />}
              sx={{ mr: 1 }}
            >
              查看结果
            </Button>
          );
        default:
          return null;
      }
    }
    
    // 听众操作
    switch (quiz.status) {
      case 'ACTIVE':
        return (
          <Button
            variant="contained"
            color="primary"
            size="small"
            component={RouterLink}
            to={`/quiz/${quiz.id}/play`}
            startIcon={<PlayArrowIcon />}
            sx={{ mr: 1 }}
          >
            参与答题
          </Button>
        );
      case 'EXPIRED':
        return (
          <Button
            variant="outlined"
            color="primary"
            size="small"
            component={RouterLink}
            to={`/quiz/${quiz.id}/results`}
            startIcon={<BarChartIcon />}
            sx={{ mr: 1 }}
          >
            查看结果
          </Button>
        );
      default:
        return null;
    }
  };
  
  // 如果没有测验
  if (!quizzes || quizzes.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          暂无测验
        </Typography>
      </Box>
    );
  }
  
  return (
    <>
      <List sx={{ width: '100%' }}>
        {quizzes.map((quiz) => (
          <React.Fragment key={quiz.id}>
            <ListItem
              disablePadding
              secondaryAction={
                isOwner && (
                  <IconButton
                    edge="end"
                    aria-label="more"
                    onClick={(e) => handleMenuOpen(e, quiz)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                )
              }
            >
              <ListItemButton
                component={RouterLink}
                to={`/quiz/${quiz.id}${quiz.status === 'ACTIVE' ? '/play' : '/details'}`}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" component="span">
                        {quiz.title}
                      </Typography>
                      <Box sx={{ ml: 1 }}>
                        {getStatusChip(quiz.status)}
                      </Box>
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography variant="body2" component="span" color="text.primary">
                        {quiz.questionCount}个问题 | 时间限制: {quiz.timeLimit}秒
                      </Typography>
                      <Box component="div" sx={{ display: 'block', mt: 0.5 }}>
                        <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
                        {quiz.status === 'ACTIVE' ? '进行中' : quiz.publishedAt ? `发布于: ${formatDateTime(quiz.publishedAt)}` : '未发布'}
                      </Box>
                    </React.Fragment>
                  }
                />
              </ListItemButton>
              <Box sx={{ mr: 2 }}>
                {getPrimaryAction(quiz)}
              </Box>
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
      
      {/* 测验操作菜单 */}
      <Menu
        id="quiz-actions-menu"
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {selectedQuiz && selectedQuiz.status === 'DRAFT' && (
          <MenuItem 
            component={RouterLink} 
            to={`/quiz/${selectedQuiz.id}/edit`}
            onClick={handleMenuClose}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="编辑测验" />
          </MenuItem>
        )}
        
        {selectedQuiz && selectedQuiz.status === 'PUBLISHED' && (
          <MenuItem onClick={() => handleActivateQuiz(selectedQuiz.id)}>
            <ListItemIcon>
              <PlayArrowIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="激活测验" />
          </MenuItem>
        )}
        
        {selectedQuiz && ['DRAFT', 'PUBLISHED'].includes(selectedQuiz.status) && (
          <MenuItem onClick={() => handleDeleteQuiz(selectedQuiz.id)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="删除测验" />
          </MenuItem>
        )}
        
        {selectedQuiz && ['ACTIVE', 'EXPIRED'].includes(selectedQuiz.status) && (
          <MenuItem 
            component={RouterLink} 
            to={`/quiz/${selectedQuiz.id}/results`}
            onClick={handleMenuClose}
          >
            <ListItemIcon>
              <BarChartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="查看结果" />
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default QuizList; 