import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  Stack
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SaveIcon from '@mui/icons-material/Save';
import EventIcon from '@mui/icons-material/Event';
import axios from 'axios';
import AuthContext from '../../contexts/AuthContext';

const LectureCreate = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    duration: 60,
    isPublic: true,
    allowQuestions: true,
    category: 'EDUCATION'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'EDUCATION', label: '教育' },
    { value: 'BUSINESS', label: '商业' },
    { value: 'TECHNOLOGY', label: '技术' },
    { value: 'SCIENCE', label: '科学' },
    { value: 'ARTS', label: '艺术' },
    { value: 'HEALTH', label: '健康' },
    { value: 'OTHER', label: '其他' }
  ];

  const durations = [
    { value: 30, label: '30分钟' },
    { value: 45, label: '45分钟' },
    { value: 60, label: '1小时' },
    { value: 90, label: '1小时30分钟' },
    { value: 120, label: '2小时' },
    { value: 180, label: '3小时' }
  ];

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleDateTimeChange = (newValue) => {
    setFormData({
      ...formData,
      scheduledAt: newValue
    });
    if (errors.scheduledAt) {
      setErrors({ ...errors, scheduledAt: '' });
    }
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const validate = () => {
    let tempErrors = {};
    let isValid = true;

    if (!formData.title.trim()) {
      tempErrors.title = '标题不能为空';
      isValid = false;
    }
    if (!formData.description.trim()) {
      tempErrors.description = '描述不能为空';
      isValid = false;
    }
    if (!formData.scheduledAt) {
      tempErrors.scheduledAt = '请选择开始时间';
      isValid = false;
    } else if (formData.scheduledAt < new Date()) {
      tempErrors.scheduledAt = '开始时间不能早于当前时间';
      isValid = false;
    }
    if (!formData.duration) {
      tempErrors.duration = '请选择时长';
      isValid = false;
    }
    if (!formData.category) {
      tempErrors.category = '请选择分类';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 控制台调试信息
    // console.log('【提交时formData】: ', formData);

    if (!validate()) return;

    setLoading(true);

    try {
      const payload = {
        ...formData,
        presenterId: user.id, // 用当前登录用户
        scheduledTime: formData.scheduledAt
      };
      delete payload.scheduledAt;

      const response = await axios.post('/api/organizer/lectures', payload);
      navigate(`/lectures/${response.data.id}`);
    } catch (error) {
      if (error.response?.data?.message) {
        setErrors({ ...errors, general: error.response.data.message });
      } else {
        setErrors({ ...errors, general: '创建讲座失败，请稍后再试' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              创建新讲座
            </Typography>
            <Typography variant="body1" color="text.secondary">
              填写以下信息创建一个新的讲座
            </Typography>
          </Box>

          {errors.general && (
              <Box sx={{ mb: 2 }}>
                <FormHelperText error>{errors.general}</FormHelperText>
              </Box>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                    required
                    fullWidth
                    id="title"
                    name="title"
                    label="讲座标题"
                    value={formData.title}
                    onChange={handleChange}
                    error={Boolean(errors.title)}
                    helperText={errors.title}
                    disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                    required
                    fullWidth
                    id="description"
                    name="description"
                    label="讲座描述"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    error={Boolean(errors.description)}
                    helperText={errors.description}
                    disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(errors.category)}>
                  <InputLabel id="category-label">分类</InputLabel>
                  <Select
                      labelId="category-label"
                      id="category"
                      name="category"
                      value={formData.category}
                      label="分类"
                      onChange={handleChange}
                      disabled={loading}
                  >
                    {categories.map((category) => (
                        <MenuItem key={category.value} value={category.value}>
                          {category.label}
                        </MenuItem>
                    ))}
                  </Select>
                  {errors.category && (
                      <FormHelperText>{errors.category}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(errors.duration)}>
                  <InputLabel id="duration-label">时长</InputLabel>
                  <Select
                      labelId="duration-label"
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      label="时长"
                      onChange={handleChange}
                      disabled={loading}
                  >
                    {durations.map((duration) => (
                        <MenuItem key={duration.value} value={duration.value}>
                          {duration.label}
                        </MenuItem>
                    ))}
                  </Select>
                  {errors.duration && (
                      <FormHelperText>{errors.duration}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                      label="开始时间"
                      value={formData.scheduledAt}
                      onChange={handleDateTimeChange}
                      renderInput={(params) => (
                          <TextField
                              {...params}
                              fullWidth
                              error={Boolean(errors.scheduledAt)}
                              helperText={errors.scheduledAt}
                              disabled={loading}
                          />
                      )}
                      disabled={loading}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControlLabel
                      control={
                        <Switch
                            checked={formData.isPublic}
                            onChange={handleSwitchChange}
                            name="isPublic"
                            color="primary"
                            disabled={loading}
                        />
                      }
                      label="公开讲座"
                  />
                  <FormControlLabel
                      control={
                        <Switch
                            checked={formData.allowQuestions}
                            onChange={handleSwitchChange}
                            name="allowQuestions"
                            color="primary"
                            disabled={loading}
                        />
                      }
                      label="允许提问"
                  />
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                      variant="outlined"
                      onClick={() => navigate(-1)}
                      disabled={loading}
                      startIcon={<EventIcon />}
                  >
                    取消
                  </Button>
                  <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={<SaveIcon />}
                  >
                    {loading ? '保存中...' : '创建讲座'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
  );
};

export default LectureCreate;
