import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import TimerIcon from '@mui/icons-material/Timer';
import WebSocketService from '../../services/WebSocketService';
import axios from 'axios';

const QuizPlay = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  // 测验状态
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  
  // 加载和错误状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // 确认提交对话框状态
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  
  // 计时器引用
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // 获取测验数据
  useEffect(() => {
    const fetchQuizData = async () => {
      setLoading(true);
      
      try {
        const response = await axios.get(`/api/quizzes/${quizId}`);
        const quizData = response.data;
        
        // 设置测验数据
        setQuiz(quizData);
        setQuestions(quizData.questions || []);
        
        // 初始化答案对象
        const initialSelectedOptions = {};
        quizData.questions.forEach((question) => {
          initialSelectedOptions[question.id] = null;
        });
        setSelectedOptions(initialSelectedOptions);
        
        // 设置倒计时
        if (quizData.expiresAt) {
          const expiryTime = new Date(quizData.expiresAt).getTime();
          const now = new Date().getTime();
          const remainingTime = Math.max(0, Math.floor((expiryTime - now) / 1000));
          setTimeLeft(remainingTime);
          startTimer(remainingTime);
        } else if (quizData.timeLimit) {
          setTimeLeft(quizData.timeLimit);
          startTimer(quizData.timeLimit);
        }
        
        // 记录开始时间
        startTimeRef.current = new Date();
        
      } catch (error) {
        console.error('获取测验数据失败:', error);
        
        if (error.response) {
          if (error.response.status === 404) {
            setError('测验不存在或已结束');
          } else if (error.response.data && error.response.data.message) {
            setError(error.response.data.message);
          } else {
            setError('获取测验数据失败，请稍后再试');
          }
        } else {
          setError('网络错误，请稍后再试');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizData();
    
    // 订阅测验WebSocket更新
    if (WebSocketService.isConnected()) {
      WebSocketService.subscribeQuizStats(quizId);
    }
    
    // 组件卸载时清除计时器和WebSocket订阅
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (WebSocketService.isConnected()) {
        WebSocketService.unsubscribeAll();
      }
    };
  }, [quizId]);
  
  // 启动计时器
  const startTimer = (seconds) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimeLeft(seconds);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          // 自动提交测验
          handleSubmitQuiz();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };
  
  // 格式化时间
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // 处理选择选项
  const handleOptionSelect = (questionId, optionId) => {
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionId
    });
  };
  
  // 处理下一题
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // 处理上一题
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // 处理提交确认
  const handleConfirmSubmit = () => {
    setShowSubmitConfirm(true);
  };
  
  // 处理取消提交
  const handleCancelSubmit = () => {
    setShowSubmitConfirm(false);
  };
  
  // 处理提交测验
  const handleSubmitQuiz = async () => {
    setShowSubmitConfirm(false);
    setSubmitting(true);
    
    try {
      // 计算答题用时（毫秒）
      const elapsedTime = new Date() - startTimeRef.current;
      
      // 准备提交数据
      const responses = [];
      Object.keys(selectedOptions).forEach(questionId => {
        if (selectedOptions[questionId] !== null) {
          responses.push({
            questionId: parseInt(questionId),
            selectedOptionId: selectedOptions[questionId],
            responseTimeMs: elapsedTime
          });
        }
      });
      
      // 提交答案
      const response = await axios.post(`/api/quizzes/${quizId}/submit`, {
        responses: responses
      });
      
      // 提交成功，跳转到结果页面
      navigate(`/quiz/${quizId}/results`);
      
    } catch (error) {
      console.error('提交测验失败:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('提交测验失败，请稍后再试');
      }
      
      setSubmitting(false);
    }
  };
  
  // 获取当前问题
  const getCurrentQuestion = () => {
    if (!questions || questions.length === 0 || currentQuestionIndex >= questions.length) {
      return null;
    }
    
    return questions[currentQuestionIndex];
  };
  
  // 获取已回答问题数量
  const getAnsweredCount = () => {
    return Object.values(selectedOptions).filter(v => v !== null).length;
  };
  
  // 计算进度百分比
  const getProgressPercentage = () => {
    if (!timeLeft || !quiz) return 0;
    const total = quiz.timeLimit || 0;
    return ((total - timeLeft) / total) * 100;
  };
  
  // 加载中
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // 错误
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // 未找到测验
  if (!quiz) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography paragraph>测验不存在或已被删除</Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // 获取当前问题
  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography paragraph>没有问题可显示</Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3}>
        {/* 测验标题 */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" component="h1">
            {quiz.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <TimerIcon sx={{ mr: 1, color: timeLeft < 10 ? 'error.main' : 'text.secondary' }} />
            <Typography 
              variant="subtitle1" 
              color={timeLeft < 10 ? 'error' : 'text.secondary'}
              fontWeight={timeLeft < 10 ? 'bold' : 'normal'}
            >
              剩余时间: {formatTime(timeLeft)}
            </Typography>
          </Box>
        </Box>
        
        {/* 进度条 */}
        <Box sx={{ width: '100%', height: 6 }}>
          <LinearProgress 
            variant="determinate" 
            value={getProgressPercentage()} 
            sx={{ height: '100%' }}
          />
        </Box>
        
        {/* 问题导航 */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Typography>
            问题 {currentQuestionIndex + 1} / {questions.length}
          </Typography>
          <Typography color="text.secondary">
            已回答: {getAnsweredCount()} / {questions.length}
          </Typography>
        </Box>
        
        {/* 问题内容 */}
        <Box sx={{ p: 3, minHeight: '50vh' }}>
          <Typography variant="h6" gutterBottom>
            {currentQuestion.content}
          </Typography>
          
          <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
            <RadioGroup 
              value={selectedOptions[currentQuestion.id] || ''} 
              onChange={(e) => handleOptionSelect(currentQuestion.id, parseInt(e.target.value))}
            >
              {currentQuestion.options.map((option) => (
                <Card 
                  key={option.id} 
                  sx={{ 
                    mb: 2, 
                    ...(selectedOptions[currentQuestion.id] === option.id && {
                      border: '2px solid',
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover'
                    })
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <FormControlLabel
                      value={option.id}
                      control={<Radio />}
                      label={
                        <Typography>
                          {option.optionLabel}. {option.content}
                        </Typography>
                      }
                      sx={{ width: '100%', m: 0 }}
                      disabled={submitting}
                    />
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
        
        {/* 操作按钮 */}
        <Box 
          sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'space-between',
            borderTop: 1,
            borderColor: 'divider'
          }}
        >
          <Button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0 || submitting}
            startIcon={<ArrowBackIcon />}
          >
            上一题
          </Button>
          
          <Box>
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                startIcon={<CheckIcon />}
              >
                {submitting ? '提交中...' : '提交测验'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNextQuestion}
                disabled={submitting}
                endIcon={<ArrowForwardIcon />}
              >
                下一题
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* 提交确认对话框 */}
      <Dialog
        open={showSubmitConfirm}
        onClose={handleCancelSubmit}
      >
        <DialogTitle>确认提交</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您已回答了 {getAnsweredCount()} 个问题，共 {questions.length} 个问题。
            {getAnsweredCount() < questions.length && 
              ` 您还有 ${questions.length - getAnsweredCount()} 个问题未回答。`
            }
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
            提交后将无法更改答案，确定要提交吗？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSubmit}>
            取消
          </Button>
          <Button onClick={handleSubmitQuiz} variant="contained" autoFocus>
            确认提交
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuizPlay; 