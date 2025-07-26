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
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';
import QuestionPreview from './QuestionPreview';

const QuizCreate = () => {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  // ——— state ———
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questionCount: 5,
    difficultyLevel: 2,
    timeLimit: 30
  });
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lecture, setLecture] = useState(null);
  const [contents, setContents] = useState([]);

  // ——— fetch lecture & contents ———
  useEffect(() => {
    const fetchLectureData = async () => {
      setLoading(true);
      try {
        const lecRes = await axios.get(`/api/lectures/${lectureId}`);
        setLecture(lecRes.data);
        const cntRes = await axios.get(`/api/lectures/${lectureId}/contents`);
        setContents(cntRes.data);
      } catch (e) {
        console.error(e);
        setErrors({ general: '获取讲座数据失败，请稍后再试' });
      } finally {
        setLoading(false);
      }
    };
    fetchLectureData();
  }, [lectureId]);

  // ——— handlers ———
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    setErrors(e2 => ({ ...e2, [name]: '' }));
  };
  const handleSliderChange = (name) => (_, v) => {
    setFormData(f => ({ ...f, [name]: v }));
    setErrors(e2 => ({ ...e2, [name]: '' }));
  };

  // 基础信息校验
  const validateBasicInfo = () => {
    const e = {};
    if (!formData.title.trim()) e.title = '标题不能为空';
    if (formData.questionCount < 1 || formData.questionCount > 10)
      e.questionCount = '问题数量必须在1-10之间';
    if (formData.difficultyLevel < 1 || formData.difficultyLevel > 3)
      e.difficultyLevel = '难度级别必须在1-3之间';
    if (formData.timeLimit < 10 || formData.timeLimit > 180)
      e.timeLimit = '时间限制必须在10-180秒之间';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateBasicInfo()) return;
    setActiveStep(s => s + 1);
    if (activeStep === 0) generateQuestions();
  };
  const handleBack = () => setActiveStep(s => s - 1);

  // 调用后端 AI 预览接口
  const generateQuestions = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(
          `/api/lectures/${lectureId}/generate-quiz`,
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
      setErrors({});
    } catch (e) {
      console.error(e);
      setErrors({ general: e.response?.data?.message || '生成问题失败' });
    } finally {
      setGenerating(false);
    }
  };

  // 保存测验到后端
  const handleSaveQuiz = async () => {
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        questionCount: formData.questionCount,
        difficultyLevel: formData.difficultyLevel,
        timeLimit: formData.timeLimit,
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
      await axios.post(
          `/api/presenter/lectures/${lectureId}/quizzes`,
          payload
      );
      navigate(`/lectures/${lectureId}`);
    } catch (e) {
      console.error(e);
      setErrors({ general: e.response?.data?.message || '保存测验失败' });
    } finally {
      setLoading(false);
    }
  };

  // 标签文本
  const diffLabel = lvl =>
      ({ 1: '简单', 2: '中等', 3: '困难' }[lvl] || '');
  const timeLabel = sec =>
      sec < 60
          ? `${sec}秒`
          : `${Math.floor(sec / 60)}分${sec % 60 ? sec % 60 + '秒' : ''}`;

  // ——— UI ———
  if (loading && !lecture)
    return (
        <Container sx={{ py: 10 }}>
          <CircularProgress />
        </Container>
    );
  if (!loading && (!lecture || contents.length === 0))
    return (
        <Container sx={{ py: 10 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="warning">
              {!lecture
                  ? '讲座不存在或已删除'
                  : '尚未上传任何内容，请先上传再创建测验'}
            </Alert>
            <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
              返回
            </Button>
          </Paper>
        </Container>
    );

  return (
      <Container sx={{ my: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" mb={2}>
            创建测验 —— {lecture.title}
          </Typography>
          {errors.general && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.general}
              </Alert>
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
                    <TextField
                        fullWidth
                        label="描述（可选）"
                        name="description"
                        multiline
                        rows={2}
                        value={formData.description}
                        onChange={handleChange}
                        disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      问题数：{formData.questionCount}
                    </Typography>
                    <Slider
                        min={1}
                        max={10}
                        step={1}
                        marks
                        value={formData.questionCount}
                        onChange={handleSliderChange('questionCount')}
                        disabled={loading}
                    />
                    {errors.questionCount && (
                        <FormHelperText error>
                          {errors.questionCount}
                        </FormHelperText>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      难度：{diffLabel(formData.difficultyLevel)}
                    </Typography>
                    <Slider
                        min={1}
                        max={3}
                        step={1}
                        marks={[
                          { value: 1, label: '简单' },
                          { value: 2, label: '中等' },
                          { value: 3, label: '困难' }
                        ]}
                        value={formData.difficultyLevel}
                        onChange={handleSliderChange('difficultyLevel')}
                        disabled={loading}
                    />
                    {errors.difficultyLevel && (
                        <FormHelperText error>
                          {errors.difficultyLevel}
                        </FormHelperText>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      时限：{timeLabel(formData.timeLimit)}
                    </Typography>
                    <Slider
                        min={10}
                        max={180}
                        step={5}
                        marks={[
                          { value: 10, label: '10秒' },
                          { value: 30, label: '30秒' },
                          { value: 60, label: '1分' },
                          { value: 120, label: '2分' },
                          { value: 180, label: '3分' }
                        ]}
                        value={formData.timeLimit}
                        onChange={handleSliderChange('timeLimit')}
                        disabled={loading}
                    />
                    {errors.timeLimit && (
                        <FormHelperText error>
                          {errors.timeLimit}
                        </FormHelperText>
                    )}
                  </Grid>
                </Grid>
                <Box mt={2}>
                  <Button onClick={() => navigate(-1)} sx={{ mr: 1 }}>
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
              <StepLabel>生成题目</StepLabel>
              <StepContent>
                {generating ? (
                    <Box textAlign="center" py={4}>
                      <CircularProgress />
                      <Typography>AI 生成中，请稍候……</Typography>
                    </Box>
                ) : questions.length > 0 ? (
                    <>
                      <Box mb={2} display="flex" justifyContent="space-between">
                        <Typography>
                          已生成 {questions.length} 道题
                        </Typography>
                        <Button
                            startIcon={<AutoFixHighIcon />}
                            onClick={generateQuestions}
                        >
                          重新生成
                        </Button>
                      </Box>
                      {questions.map((q, i) => (
                          <QuestionPreview
                              key={i}
                              question={q}
                              index={i}
                          />
                      ))}
                    </>
                ) : (
                    <Alert severity="info">
                      还没有生成题目，点击下一步开始……
                    </Alert>
                )}
                <Box mt={2}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    返回
                  </Button>
                  <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveQuiz}
                      disabled={!questions.length || loading}
                  >
                    保存测验
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
