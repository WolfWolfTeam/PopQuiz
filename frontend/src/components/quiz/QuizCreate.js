import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormHelperText,
  Grid,
  Paper,
  Slider,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
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
        const lectureResponse = await axios.get(`/api/lectures/${lectureId}`);
        setLecture(lectureResponse.data);

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

  // 表单字段变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // 滑块变化
  const handleSliderChange = (name) => (event, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // 基本信息校验
  const validateBasicInfo = () => {
    const temp = {};
    let ok = true;
    if (!formData.title.trim()) {
      temp.title = '标题不能为空';
      ok = false;
    }
    if (formData.questionCount < 1 || formData.questionCount > 10) {
      temp.questionCount = '问题数量必须在1-10之间';
      ok = false;
    }
    if (formData.difficultyLevel < 1 || formData.difficultyLevel > 3) {
      temp.difficultyLevel = '难度级别必须在1-3之间';
      ok = false;
    }
    if (formData.timeLimit < 10 || formData.timeLimit > 180) {
      temp.timeLimit = '时间限制必须在10-180秒之间';
      ok = false;
    }
    setErrors(temp);
    return ok;
  };

  // 下一步
  const handleNext = () => {
    if (activeStep === 0 && !validateBasicInfo()) return;
    setActiveStep((s) => s + 1);
    if (activeStep === 0) {
      generateQuestions();
    }
  };

  // 上一步
  const handleBack = () => {
    setActiveStep((s) => s - 1);
  };

  // AI 生成问题
  const generateQuestions = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(
          `/api/presenter/lectures/${lectureId}/generate-quiz`,
          null,
          {
            params: {
              questionCount: formData.questionCount,
              optionCount: 4,
              difficultyLevel: formData.difficultyLevel
            }
          }
      );
      setQuestions(res.data);
    } catch (err) {
      console.error('生成问题失败:', err);
      setErrors({ general: err.response?.data?.message || '生成问题失败，请稍后再试' });
    } finally {
      setGenerating(false);
    }
  };

  // 保存测验（改成正确的 URL）
  const handleSaveQuiz = async () => {
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        // 后端 CreateQuizRequest 只需要 title/questionCount/difficultyLevel
        questionCount: formData.questionCount,
        difficultyLevel: formData.difficultyLevel
      };
      await axios.post(
          `/api/presenter/lectures/${lectureId}/quizzes`,
          payload
      );
      navigate(`/lectures/${lectureId}`);
    } catch (err) {
      console.error('保存测验失败:', err);
      setErrors({ general: err.response?.data?.message || '保存测验失败，请稍后再试' });
    } finally {
      setLoading(false);
    }
  };

  // 标签辅助
  const getDifficultyLabel = (l) =>
      ({1: '简单', 2: '中等', 3: '困难'}[l] || '');
  const getTimeLabel = (s) =>
      s < 60 ? `${s}秒` : `${Math.floor(s/60)}分${s%60||''}`;

  if (loading && !lecture) {
    return (
        <Container sx={{ mt: 4 }}>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        </Container>
    );
  }
  if (!loading && (!lecture || contents.length === 0)) {
    return (
        <Container sx={{ mt: 4 }}>
          <Paper sx={{ p:4, textAlign:'center' }}>
            <Alert severity="warning" sx={{ mb:2 }}>
              {!lecture ? '讲座不存在或已被删除' : '请先上传内容，再创建测验'}
            </Alert>
            <Button onClick={() => navigate(`/lectures/${lectureId}`)}>
              返回
            </Button>
          </Paper>
        </Container>
    );
  }

  return (
      <Container maxWidth="md" sx={{ mt:4, mb:4 }}>
        <Paper sx={{ p:4 }}>
          <Typography variant="h4" gutterBottom>
            创建测验
          </Typography>
          <Typography color="text.secondary" sx={{ mb:3 }}>
            为讲座 “{lecture?.title}” 创建测验
          </Typography>
          {errors.general && (
              <Alert severity="error" sx={{ mb:2 }}>{errors.general}</Alert>
          )}
          <Stepper activeStep={activeStep} orientation="vertical">
            <Step>
              <StepLabel>基本信息</StepLabel>
              <StepContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                        fullWidth
                        required
                        label="测验标题"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        error={!!errors.title}
                        helperText={errors.title}
                        disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>问题数量: {formData.questionCount}</Typography>
                    <Slider
                        min={1} max={10} step={1}
                        value={formData.questionCount}
                        onChange={handleSliderChange('questionCount')}
                        disabled={loading}
                    />
                    {errors.questionCount && (
                        <FormHelperText error>{errors.questionCount}</FormHelperText>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>
                      难度: {getDifficultyLabel(formData.difficultyLevel)}
                    </Typography>
                    <Slider
                        min={1} max={3} step={1}
                        value={formData.difficultyLevel}
                        onChange={handleSliderChange('difficultyLevel')}
                        disabled={loading}
                    />
                    {errors.difficultyLevel && (
                        <FormHelperText error>{errors.difficultyLevel}</FormHelperText>
                    )}
                  </Grid>
                </Grid>
                <Box sx={{ mt:3, display:'flex', gap:2 }}>
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
            <Step>
              <StepLabel>生成问题</StepLabel>
              <StepContent>
                {generating
                    ? (
                        <Box sx={{ textAlign:'center', py:4 }}>
                          <CircularProgress sx={{ mb:2 }} />
                          <Typography>AI 正在生成问题，请稍候…</Typography>
                        </Box>
                    ) : (
                        <>
                          {questions.length > 0
                              ? (
                                  <>
                                    <Box sx={{ mb:2, display:'flex', justifyContent:'space-between' }}>
                                      <Typography>已生成 {questions.length} 个问题</Typography>
                                      <Button
                                          variant="outlined"
                                          startIcon={<AutoFixHighIcon />}
                                          onClick={generateQuestions}
                                          disabled={generating}
                                      >
                                        重新生成
                                      </Button>
                                    </Box>
                                    {questions.map((q,i) => (
                                        <QuestionPreview key={i} question={q} index={i} />
                                    ))}
                                  </>
                              )
                              : (
                                  <Alert severity="info">
                                    点击“重新生成”尝试再次调用 AI
                                  </Alert>
                              )
                          }
                        </>
                    )
                }
                <Box sx={{ mt:3, display:'flex', gap:2 }}>
                  <Button onClick={handleBack} disabled={generating||loading}>
                    返回
                  </Button>
                  <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveQuiz}
                      disabled={generating||loading}
                  >
                    {loading ? '保存中…' : '保存测验'}
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
