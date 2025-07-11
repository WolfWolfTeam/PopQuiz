import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import WebSocketService from '../../services/WebSocketService';
import axios from 'axios';

// 注册ChartJS组件
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const QuizResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  // 状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [overallStats, setOverallStats] = useState(null);
  
  // 获取测验结果
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      
      try {
        // 获取测验信息
        const quizResponse = await axios.get(`/api/quizzes/${quizId}`);
        setQuiz(quizResponse.data);
        
        // 获取用户在此测验的结果
        const userResultsResponse = await axios.get(`/api/quizzes/${quizId}/user-results`);
        setResults(userResultsResponse.data);
        
        // 获取用户在此测验的统计信息
        const userStatsResponse = await axios.get(`/api/quizzes/${quizId}/user-stats`);
        setUserStats(userStatsResponse.data);
        
        // 获取此测验的整体统计信息
        const overallStatsResponse = await axios.get(`/api/quizzes/${quizId}/stats`);
        setOverallStats(overallStatsResponse.data);
        
      } catch (error) {
        console.error('获取测验结果失败:', error);
        
        if (error.response && error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError('获取测验结果失败，请稍后再试');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
    
    // 订阅测验统计更新
    if (WebSocketService.isConnected()) {
      WebSocketService.subscribeQuizStats(quizId);
    }
    
    return () => {
      // 取消订阅
      if (WebSocketService.isConnected()) {
        WebSocketService.unsubscribeAll();
      }
    };
  }, [quizId]);
  
  // 获取成绩等级
  const getScoreGrade = (score) => {
    if (score >= 90) return { text: '优秀', color: '#4caf50' };
    if (score >= 80) return { text: '良好', color: '#8bc34a' };
    if (score >= 70) return { text: '中等', color: '#ffeb3b' };
    if (score >= 60) return { text: '及格', color: '#ff9800' };
    return { text: '不及格', color: '#f44336' };
  };
  
  // 格式化时间
  const formatTime = (milliseconds) => {
    if (!milliseconds) return '0秒';
    
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}秒`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };
  
  // 准备正确/错误分布图数据
  const prepareCorrectWrongChartData = () => {
    if (!userStats) return null;
    
    return {
      labels: ['正确答案', '错误答案'],
      datasets: [
        {
          data: [userStats.correctAnswers, userStats.wrongAnswers],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  // 准备排名分布图数据
  const prepareScoreDistributionChartData = () => {
    if (!overallStats || !overallStats.scoreDistribution) return null;
    
    // 分数区间
    const scoreRanges = Object.keys(overallStats.scoreDistribution).sort();
    
    return {
      labels: scoreRanges.map(range => `${range}`),
      datasets: [
        {
          label: '参与人数',
          data: scoreRanges.map(range => overallStats.scoreDistribution[range]),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
  };
  
  // 加载中
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // 错误
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
            startIcon={<HomeIcon />}
          >
            返回仪表盘
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // 未找到测验或结果
  if (!quiz || !results || !userStats || !overallStats) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography paragraph>
            未找到测验结果，可能您尚未参加此测验
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
            startIcon={<HomeIcon />}
          >
            返回仪表盘
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // 获取成绩评级
  const scoreGrade = getScoreGrade(userStats.score);
  
  // 准备图表数据
  const correctWrongChartData = prepareCorrectWrongChartData();
  const scoreDistributionChartData = prepareScoreDistributionChartData();
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 页面标题 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          测验结果
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {quiz.title} - {quiz.lectureTitle}
        </Typography>
      </Box>
      
      {/* 成绩摘要卡片 */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              您的成绩
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h2" component="span" sx={{ mr: 2 }}>
                {userStats.score}
              </Typography>
              <Typography 
                variant="h5" 
                component="span"
                sx={{ 
                  color: scoreGrade.color,
                  fontWeight: 'bold'
                }}
              >
                {scoreGrade.text}
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              答对 {userStats.correctAnswers} 题，答错 {userStats.wrongAnswers} 题，总共 {userStats.totalQuestions} 题
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <AccessTimeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="完成用时" 
                  secondary={formatTime(userStats.totalTimeMs)} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmojiEventsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="排名" 
                  secondary={`第 ${userStats.rank} 名 / ${overallStats.participantCount} 人`} 
                />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            {correctWrongChartData && (
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Pie 
                  data={correctWrongChartData} 
                  options={{
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    },
                    maintainAspectRatio: false
                  }}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* 整体统计 */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          整体统计
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  参与人数
                </Typography>
                <Typography variant="h3" align="center">
                  {overallStats.participantCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  平均得分
                </Typography>
                <Typography variant="h3" align="center">
                  {overallStats.averageScore}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  平均用时
                </Typography>
                <Typography variant="h3" align="center">
                  {formatTime(overallStats.averageTimeMs)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* 分数分布图 */}
        {scoreDistributionChartData && (
          <Box sx={{ mt: 4, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              分数分布
            </Typography>
            <Box sx={{ height: '100%' }}>
              <Bar 
                data={scoreDistributionChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  },
                  plugins: {
                    title: {
                      display: true,
                      text: '分数分布'
                    }
                  }
                }}
              />
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* 详细答题结果 */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          答题详情
        </Typography>
        
        <List>
          {results.questionResults.map((result, index) => (
            <React.Fragment key={result.questionId}>
              <ListItem
                sx={{
                  borderLeft: 4,
                  borderColor: result.correct ? 'success.main' : 'error.main',
                  bgcolor: result.correct ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)',
                  borderRadius: 1,
                  mb: 2
                }}
              >
                <ListItemIcon>
                  {result.correct ? 
                    <CheckCircleIcon color="success" /> : 
                    <CancelIcon color="error" />}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="subtitle1">
                        问题 {index + 1}: {result.questionContent}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {result.options.map((option) => (
                          <Typography 
                            key={option.id} 
                            variant="body2" 
                            sx={{ 
                              mb: 0.5,
                              pl: 2,
                              fontWeight: (option.correct || option.id === result.selectedOptionId) ? 'bold' : 'normal',
                              color: option.correct ? 'success.main' : 
                                     (option.id === result.selectedOptionId && !option.correct) ? 'error.main' : 
                                     'text.primary'
                            }}
                          >
                            {option.optionLabel}. {option.content}
                            {option.correct && ' ✓'}
                            {option.id === result.selectedOptionId && !option.correct && ' ✗'}
                          </Typography>
                        ))}
                      </Box>
                      
                      {result.explanation && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            解释: {result.explanation}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
      
      {/* 底部操作按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined"
          onClick={() => navigate(`/lectures/${quiz.lectureId}`)}
        >
          返回讲座
        </Button>
        
        <Button 
          variant="contained"
          onClick={() => navigate('/dashboard')}
          startIcon={<HomeIcon />}
        >
          返回仪表盘
        </Button>
      </Box>
    </Container>
  );
};

export default QuizResults; 