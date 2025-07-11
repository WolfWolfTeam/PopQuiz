import React, { useState, useEffect, useContext } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  Menu,
  MenuItem
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CategoryIcon from '@mui/icons-material/Category';
import DateRangeIcon from '@mui/icons-material/DateRange';
import GroupIcon from '@mui/icons-material/Group';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import QuizIcon from '@mui/icons-material/Quiz';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WebSocketService from '../../services/WebSocketService';
import axios from 'axios';
import AuthContext from '../../contexts/AuthContext';
import ContentUploadForm from './ContentUploadForm';
import QuizList from '../quiz/QuizList';

// 自定义标签面板组件
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lecture-tabpanel-${index}`}
      aria-labelledby={`lecture-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LectureDetail = () => {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  // 状态
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [contents, setContents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  
  // 操作菜单状态
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  
  // 获取讲座数据
  useEffect(() => {
    const fetchLectureData = async () => {
      setLoading(true);
      
      try {
        const response = await axios.get(`/api/lectures/${lectureId}`);
        setLecture(response.data);
        
        // 获取讲座内容
        const contentsResponse = await axios.get(`/api/lectures/${lectureId}/contents`);
        setContents(contentsResponse.data);
        
        // 获取讲座测验
        const quizzesResponse = await axios.get(`/api/lectures/${lectureId}/quizzes`);
        setQuizzes(quizzesResponse.data);
        
      } catch (error) {
        console.error('获取讲座数据失败:', error);
        setError('获取讲座数据失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLectureData();
    
    // 订阅WebSocket消息
    WebSocketService.subscribeLecture(lectureId);
    
    return () => {
      // 取消订阅
      WebSocketService.unsubscribeAll();
    };
  }, [lectureId]);
  
  // 处理标签变更
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // 处理操作菜单打开
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // 处理操作菜单关闭
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // 讲座状态标签颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'UPCOMING':
        return 'info';
      case 'LIVE':
        return 'success';
      case 'ENDED':
        return 'default';
      default:
        return 'default';
    }
  };
  
  // 讲座状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'UPCOMING':
        return '即将开始';
      case 'LIVE':
        return '进行中';
      case 'ENDED':
        return '已结束';
      default:
        return status;
    }
  };
  
  // 格式化时间
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // 处理讲座开始
  const handleStartLecture = async () => {
    try {
      await axios.post(`/api/lectures/${lectureId}/start`);
      // 更新讲座状态
      setLecture({ ...lecture, status: 'LIVE' });
    } catch (error) {
      console.error('开始讲座失败:', error);
    }
  };
  
  // 处理讲座结束
  const handleEndLecture = async () => {
    try {
      await axios.post(`/api/lectures/${lectureId}/end`);
      // 更新讲座状态
      setLecture({ ...lecture, status: 'ENDED' });
    } catch (error) {
      console.error('结束讲座失败:', error);
    }
  };
  
  // 处理编辑讲座
  const handleEditLecture = () => {
    navigate(`/lectures/edit/${lectureId}`);
    handleMenuClose();
  };
  
  // 处理删除讲座
  const handleDeleteLecture = async () => {
    if (window.confirm('确定要删除此讲座吗？此操作不可撤销。')) {
      try {
        await axios.delete(`/api/lectures/${lectureId}`);
        navigate('/lectures');
      } catch (error) {
        console.error('删除讲座失败:', error);
      }
    }
    handleMenuClose();
  };
  
  // 处理内容上传
  const handleContentUploaded = (newContent) => {
    setContents([...contents, newContent]);
    setShowUploadForm(false);
  };
  
  // 检查当前用户是否为演讲者或组织者
  const isOwnerOrSpeaker = () => {
    if (!user || !lecture) return false;
    return user.id === lecture.organizerId || user.id === lecture.speakerId;
  };
  
  // 获取主要操作按钮
  const getPrimaryActionButton = () => {
    if (!lecture) return null;
    
    // 如果是演讲者或组织者
    if (isOwnerOrSpeaker()) {
      // 讲座未开始
      if (lecture.status === 'UPCOMING') {
        return (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartLecture}
          >
            开始讲座
          </Button>
        );
      }
      
      // 讲座进行中
      if (lecture.status === 'LIVE') {
        return (
          <Button
            variant="contained"
            color="error"
            onClick={handleEndLecture}
          >
            结束讲座
          </Button>
        );
      }
      
      // 讲座已结束
      return null;
    }
    
    // 如果是听众
    if (lecture.status === 'LIVE') {
      return (
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to={`/lectures/${lectureId}/join`}
          startIcon={<PlayArrowIcon />}
        >
          加入讲座
        </Button>
      );
    }
    
    return null;
  };
  
  // 判断是否可以创建测验
  const canCreateQuiz = () => {
    if (!lecture || !user) return false;
    
    // 只有演讲者或组织者可以创建测验
    if (user.id !== lecture.organizerId && user.id !== lecture.speakerId) return false;
    
    // 只有上传了内容后才能创建测验
    return contents.length > 0;
  };
  
  // 加载中
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <Typography>加载中...</Typography>
        </Box>
      </Container>
    );
  }
  
  // 错误
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" paragraph>{error}</Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/lectures')}
          >
            返回讲座列表
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // 讲座不存在
  if (!lecture) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography paragraph>讲座不存在或已被删除</Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/lectures')}
          >
            返回讲座列表
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 讲座标题和操作区 */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h4" component="h1">
              {lecture.title}
            </Typography>
            <Chip 
              label={getStatusText(lecture.status)} 
              color={getStatusColor(lecture.status)}
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            由 {lecture.speakerName} 主讲
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {getPrimaryActionButton()}
          
          {isOwnerOrSpeaker() && (
            <>
              <Tooltip title="更多操作">
                <IconButton
                  aria-label="更多操作"
                  onClick={handleMenuOpen}
                  size="large"
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
              
              <Menu
                id="lecture-actions-menu"
                anchorEl={anchorEl}
                open={menuOpen}
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
                <MenuItem onClick={handleEditLecture}>
                  <ListItemIcon>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="编辑讲座" />
                </MenuItem>
                <MenuItem onClick={handleDeleteLecture}>
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="删除讲座" />
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>
      
      {/* 讲座信息卡片 */}
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Grid container>
          <Grid item xs={12} md={8}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>讲座介绍</Typography>
              <Typography variant="body1" paragraph>
                {lecture.description}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 3, borderLeft: { md: 1 }, borderColor: { md: 'divider' } }}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <DateRangeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="开始时间" 
                    secondary={formatDateTime(lecture.scheduledAt)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AccessTimeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="预计时长" 
                    secondary={`${lecture.duration} 分钟`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CategoryIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="分类" 
                    secondary={lecture.category} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="组织者" 
                    secondary={lecture.organizerName} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <GroupIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="参与人数" 
                    secondary={lecture.participantCount || 0} 
                  />
                </ListItem>
              </List>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 内容标签页 */}
      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            aria-label="lecture tabs"
          >
            <Tab label="讲座内容" id="lecture-tab-0" aria-controls="lecture-tabpanel-0" />
            <Tab label="测验" id="lecture-tab-1" aria-controls="lecture-tabpanel-1" />
          </Tabs>
        </Box>
        
        {/* 讲座内容标签面板 */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">内容列表</Typography>
            
            {isOwnerOrSpeaker() && (
              <Button
                variant="contained"
                startIcon={<UploadFileIcon />}
                onClick={() => setShowUploadForm(true)}
              >
                上传内容
              </Button>
            )}
          </Box>
          
          {showUploadForm && (
            <Box sx={{ mb: 3 }}>
              <ContentUploadForm 
                lectureId={lectureId} 
                onUploaded={handleContentUploaded}
                onCancel={() => setShowUploadForm(false)}
              />
            </Box>
          )}
          
          {contents.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              暂无内容
            </Typography>
          ) : (
            <List>
              {contents.map((content) => (
                <React.Fragment key={content.id}>
                  <ListItem>
                    <ListItemText
                      primary={content.title || content.originalFilename}
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2">
                            {`类型: ${content.contentType} | 大小: ${Math.round(content.fileSize / 1024)} KB`}
                          </Typography>
                          <Box component="span" sx={{ display: 'block' }}>
                            上传时间: {formatDateTime(content.uploadedAt)}
                          </Box>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>
        
        {/* 测验标签面板 */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">测验列表</Typography>
            
            {canCreateQuiz() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={RouterLink}
                to={`/lectures/${lectureId}/quiz/create`}
              >
                创建测验
              </Button>
            )}
          </Box>
          
          <QuizList quizzes={quizzes} lectureId={lectureId} isOwner={isOwnerOrSpeaker()} />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default LectureDetail; 