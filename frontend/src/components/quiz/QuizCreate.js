import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';
import QuestionPreview from './QuestionPreview';

const QuizCreate = () => {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  
  // 步骤状态
  const [activeStep, setActiveStep] = useState(0);
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questionCount: 5,
    difficultyLevel: 2,
    timeLimit: 30
  });
  
  // 生成的问题
  const [questions, setQuestions] = useState([]);
  
  // 错误状态
  const [errors, setErrors] = useState({});
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lecture, setLecture] = useState(null);
  const [contents, setContents] = useState([]);
  
  // 获取讲座信息和内容
  useEffect(() => {
    const fetchLectureData = async () => {
      setLoading(true);
      try {
        // 获取讲座信息
        const lectureResponse = await axios.get(`/api/lectures/${lectureId}`);
        setLecture(lectureResponse.data);
        
        // 获取讲座内容
        const contentsResponse = await axios.get(`/api/lectures/${lectureId}/contents`);
        setContents(contentsResponse.data);
      } catch (error) {
        console.error('获取讲座数据失败:', error);
        setErrors({ general: '获取讲座数据失败，请稍后再试' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLectureData();
  }, [lectureId]);
  
  // 处理表单输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // 清除相关错误
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // 处理滑块变化
  const handleSliderChange = (name) => (event, value) => {
    setFormData({ ...formData, [name]: value });
    
    // 清除相关错误
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // 表单验证
  const validateBasicInfo = () => {
    let tempErrors = {};
    let isValid = true;
    
    if (!formData.title.trim()) {
      tempErrors.title = '标题不能为空';
      isValid = false;
    }
    
    if (formData.questionCount < 1 || formData.questionCount > 10) {
      tempErrors.questionCount = '问题数量必须在1-10之间';
      isValid = false;
    }
    
    if (formData.difficultyLevel < 1 || formData.difficultyLevel > 3) {
      tempErrors.difficultyLevel = '难度级别必须在1-3之间';
      isValid = false;
    }
    
    if (formData.timeLimit < 10 || formData.timeLimit > 180) {
      tempErrors.timeLimit = '时间限制必须在10-180秒之间';
      isValid = false;
    }
    
    setErrors(tempErrors);
    return isValid;
  };
  
  // 处理下一步
  const handleNext = () => {
    if (activeStep === 0 && !validateBasicInfo()) {
      return;
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    
    // 如果进入第二步，生成问题
    if (activeStep === 0) {
      generateQuestions();
    }
  };
  
  // 处理上一步
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // 生成问题
  const generateQuestions = async () => {
    setGenerating(true);
    
    try {
      const response = await axios.post(`/api/lectures/${lectureId}/generate-quiz`, {
        questionCount: formData.questionCount,
        difficultyLevel: formData.difficultyLevel
      });
      
      setQuestions(response.data);
    } catch (error) {
      console.error('生成问题失败:', error);
      
      if (error.response && error.response.data) {
        setErrors({ general: error.response.data.message || '生成问题失败，请稍后再试' });
      } else {
        setErrors({ general: '网络错误，请稍后再试' });
      }
    } finally {
      setGenerating(false);
    }
  };
  
  // 重新生成问题
  const handleRegenerateQuestions = () => {
    generateQuestions();
  };
  
  // 保存测验
  const handleSaveQuiz = async () => {
    setLoading(true);
    
    try {
      const quizData = {
        ...formData,
        questions: questions.map(q => ({
          content: q.content,
          explanation: q.explanation,
          options: q.options.map(o => ({
            content: o.content,
            isCorrect: o.correct,
            optionLabel: o.label
          }))
        }))
      };
      
      const response = await axios.post(`/api/lectures/${lectureId}/quizzes`, quizData);
      
      // 创建成功，跳转到讲座详情页
      navigate(`/lectures/${lectureId}`);
      
    } catch (error) {
      console.error('保存测验失败:', error);
      
      if (error.response && error.response.data) {
        setErrors({ general: error.response.data.message || '保存测验失败，请稍后再试' });
      } else {
        setErrors({ general: '网络错误，请稍后再试' });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 难度级别标签
  const getDifficultyLabel = (level) => {
    switch (level) {
      case 1:
        return '简单';
      case 2:
        return '中等';
      case 3:
        return '困难';
      default:
        return '';
    }
  };
  
  // 获取时间限制标签
  const getTimeLimitLabel = (seconds) => {
    if (seconds < 60) {
      return `${seconds}秒`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds === 0 ? `${minutes}分钟` : `${minutes}分${remainingSeconds}秒`;
    }
  };
  
  // 加载中
  if (loading && !lecture) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // 未找到讲座或没有内容
  if (!loading && (!lecture || contents.length === 0)) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {!lecture ? '讲座不存在或已被删除' : '讲座没有上传内容，请先上传内容再创建测验'}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate(`/lectures/${lectureId}`)}
          >
            返回讲座页面
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            创建测验
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            为讲座 "{lecture?.title}" 创建一个新的测验
          </Typography>
        </Box>
        
        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* 步骤1：基本信息 */}
          <Step key="basic-info">
            <StepLabel>基本信息</StepLabel>
            <StepContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="title"
                    name="title"
                    label="测验标题"
                    value={formData.title}
                    onChange={handleChange}
                    error={Boolean(errors.title)}
                    helperText={errors.title}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="description"
                    name="description"
                    label="测验描述（可选）"
                    multiline
                    rows={2}
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography id="question-count-slider" gutterBottom>
                    问题数量: {formData.questionCount}
                  </Typography>
                  <Slider
                    value={formData.questionCount}
                    onChange={handleSliderChange('questionCount')}
                    aria-labelledby="question-count-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={1}
                    max={10}
                    disabled={loading}
                  />
                  {errors.questionCount && (
                    <FormHelperText error>{errors.questionCount}</FormHelperText>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Typography id="difficulty-level-slider" gutterBottom>
                    难度级别: {getDifficultyLabel(formData.difficultyLevel)}
                  </Typography>
                  <Slider
                    value={formData.difficultyLevel}
                    onChange={handleSliderChange('difficultyLevel')}
                    aria-labelledby="difficulty-level-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={1}
                    max={3}
                    disabled={loading}
                    valueLabelFormat={getDifficultyLabel}
                  />
                  {errors.difficultyLevel && (
                    <FormHelperText error>{errors.difficultyLevel}</FormHelperText>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Typography id="time-limit-slider" gutterBottom>
                    时间限制: {getTimeLimitLabel(formData.timeLimit)}
                  </Typography>
                  <Slider
                    value={formData.timeLimit}
                    onChange={handleSliderChange('timeLimit')}
                    aria-labelledby="time-limit-slider"
                    valueLabelDisplay="auto"
                    step={5}
                    marks={[
                      { value: 10, label: '10秒' },
                      { value: 30, label: '30秒' },
                      { value: 60, label: '1分钟' },
                      { value: 120, label: '2分钟' },
                      { value: 180, label: '3分钟' }
                    ]}
                    min={10}
                    max={180}
                    disabled={loading}
                    valueLabelFormat={getTimeLimitLabel}
                  />
                  {errors.timeLimit && (
                    <FormHelperText error>{errors.timeLimit}</FormHelperText>
                  )}
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/lectures/${lectureId}`)}
                  startIcon={<CancelIcon />}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                >
                  下一步
                </Button>
              </Box>
            </StepContent>
          </Step>
          
          {/* 步骤2：生成问题 */}
          <Step key="generate-questions">
            <StepLabel>生成问题</StepLabel>
            <StepContent>
              {generating ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography>
                    AI正在根据讲座内容生成问题，请稍候...
                  </Typography>
                </Box>
              ) : (
                <>
                  {questions.length > 0 ? (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          已生成 {questions.length} 个问题
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={handleRegenerateQuestions}
                          startIcon={<AutoFixHighIcon />}
                          disabled={generating}
                        >
                          重新生成
                        </Button>
                      </Box>
                      
                      {questions.map((question, index) => (
                        <QuestionPreview 
                          key={index}
                          question={question}
                          index={index}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      问题生成失败，请点击"重新生成"按钮尝试再次生成
                    </Alert>
                  )}
                </>
              )}
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  onClick={handleBack}
                  disabled={generating || loading}
                >
                  返回
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveQuiz}
                  disabled={generating || loading || questions.length === 0}
                  startIcon={<SaveIcon />}
                >
                  {loading ? '保存中...' : '保存测验'}
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>
    </Container>
  );
};

export default QuizCreate; 