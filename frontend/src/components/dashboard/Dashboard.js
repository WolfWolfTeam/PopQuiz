import React, { useState, useEffect, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EventIcon from '@mui/icons-material/Event';
import QuizIcon from '@mui/icons-material/Quiz';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import axios from 'axios';
import AuthContext from '../../contexts/AuthContext';
import StatCard from './StatCard';

const Dashboard = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  
  // 状态
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLectures: 0,
    totalQuizzes: 0,
    totalResponses: 0,
    totalParticipation: 0,
    averageScore: 0
  });
  const [recentLectures, setRecentLectures] = useState([]);
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  
  // 获取仪表盘数据
  useEffect(() => {
    if (!isAuthenticated) return; // 只有认证后才请求数据
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsResponse, lecturesResponse, quizzesResponse] = await Promise.all([
          axios.get('/api/dashboard/stats'),
          axios.get('/api/dashboard/recent-lectures'),
          axios.get('/api/dashboard/active-quizzes')
        ]);
        
        setStats(statsResponse.data);
        setRecentLectures(lecturesResponse.data);
        setActiveQuizzes(quizzesResponse.data);
        
      } catch (error) {
        console.error('加载仪表盘数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [isAuthenticated]);
  
  // 根据用户角色获取仪表盘标题
  const getDashboardTitle = () => {
    if (user?.roles?.includes('ORGANIZER')) {
      return '组织者仪表盘';
    } else if (user?.roles?.includes('SPEAKER')) {
      return '演讲者仪表盘';
    } else {
      return '听众仪表盘';
    }
  };
  
  // 根据用户角色获取主要操作按钮
  const getPrimaryAction = () => {
    if (user?.roles?.includes('ORGANIZER')) {
      return (
        <Button
          component={RouterLink}
          to="/lectures/create"
          variant="contained"
          startIcon={<AddIcon />}
        >
          创建新讲座
        </Button>
      );
    } else if (user?.roles?.includes('SPEAKER')) {
      return (
        <Button
          component={RouterLink}
          to="/lectures"
          variant="contained"
          startIcon={<EventIcon />}
        >
          管理我的讲座
        </Button>
      );
    } else {
      return (
        <Button
          component={RouterLink}
          to="/lectures"
          variant="contained"
          startIcon={<EventIcon />}
        >
          浏览讲座
        </Button>
      );
    }
  };
  
  // 获取仪表盘统计卡片
  const getStatCards = () => {
    const cards = [];
    
    if (user?.roles?.includes('ORGANIZER') || user?.roles?.includes('SPEAKER')) {
      cards.push(
        <StatCard
          key="lectures"
          title="讲座数量"
          value={stats.totalLectures}
          icon={<EventIcon fontSize="large" />}
          color="#1976d2"
        />
      );
      
      cards.push(
        <StatCard
          key="quizzes"
          title="测验数量"
          value={stats.totalQuizzes}
          icon={<QuizIcon fontSize="large" />}
          color="#9c27b0"
        />
      );
      
      cards.push(
        <StatCard
          key="participants"
          title="参与人数"
          value={stats.totalParticipation}
          icon={<PeopleIcon fontSize="large" />}
          color="#2e7d32"
        />
      );
    }
    
    if (user?.roles?.includes('AUDIENCE')) {
      cards.push(
        <StatCard
          key="participation"
          title="参与讲座"
          value={stats.totalLectures}
          icon={<EventIcon fontSize="large" />}
          color="#1976d2"
        />
      );
      
      cards.push(
        <StatCard
          key="responses"
          title="已答测验"
          value={stats.totalResponses}
          icon={<QuizIcon fontSize="large" />}
          color="#9c27b0"
        />
      );
      
      cards.push(
        <StatCard
          key="averageScore"
          title="平均得分"
          value={`${stats.averageScore}%`}
          icon={<CheckCircleIcon fontSize="large" />}
          color="#2e7d32"
        />
      );
    }
    
    return cards;
  };
  
  // 讲座状态颜色
  const getLectureStatusColor = (status) => {
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
  const getLectureStatusText = (status) => {
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
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <Typography>加载中...</Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {getDashboardTitle()}
        </Typography>
        {getPrimaryAction()}
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {getStatCards().map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            {card}
          </Grid>
        ))}
      </Grid>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="最近讲座" 
              action={
                <IconButton 
                  component={RouterLink} 
                  to="/lectures" 
                  aria-label="查看全部"
                >
                  <ArrowForwardIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              {recentLectures.length > 0 ? (
                <List>
                  {recentLectures.map((lecture) => (
                    <React.Fragment key={lecture.id}>
                      <ListItem
                        button
                        component={RouterLink}
                        to={`/lectures/${lecture.id}`}
                        secondaryAction={
                          <Chip 
                            label={getLectureStatusText(lecture.status)}
                            color={getLectureStatusColor(lecture.status)}
                            size="small"
                          />
                        }
                      >
                        <ListItemText
                          primary={lecture.title}
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {lecture.speakerName}
                              </Typography>
                              <Box component="span" sx={{ display: 'block' }}>
                                <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                {formatDate(lecture.scheduledAt)}
                              </Box>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">
                    暂无讲座
                  </Typography>
                </Box>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/lectures"
                endIcon={<ArrowForwardIcon />}
              >
                查看全部
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="活跃测验" 
              action={
                <IconButton 
                  component={RouterLink} 
                  to="/quizzes" 
                  aria-label="查看全部"
                >
                  <ArrowForwardIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              {activeQuizzes.length > 0 ? (
                <List>
                  {activeQuizzes.map((quiz) => (
                    <React.Fragment key={quiz.id}>
                      <ListItem
                        button
                        component={RouterLink}
                        to={`/quiz/${quiz.id}/play`}
                        secondaryAction={
                          <Tooltip title={`剩余时间: ${quiz.remainingTimeSeconds}秒`}>
                            <Chip
                              icon={<AccessTimeIcon />}
                              label={`${quiz.remainingTimeSeconds}秒`}
                              color="primary"
                              size="small"
                            />
                          </Tooltip>
                        }
                      >
                        <ListItemText
                          primary={quiz.title}
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {quiz.lectureName}
                              </Typography>
                              <Box component="span" sx={{ display: 'block' }}>
                                <QuizIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                {quiz.questionsCount}个问题
                              </Box>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">
                    暂无活跃测验
                  </Typography>
                </Box>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/quizzes"
                endIcon={<ArrowForwardIcon />}
              >
                查看全部
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 