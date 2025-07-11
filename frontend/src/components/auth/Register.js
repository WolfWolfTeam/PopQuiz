import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  OutlinedInput,
  Paper,
  Stack,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  FormLabel,
  RadioGroup,
  Radio
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Avatar from '@mui/material/Avatar';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  
  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    role: 'AUDIENCE', // 默认角色为听众
    agreeTerms: false
  });
  
  // 错误状态
  const [errors, setErrors] = useState({});
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  
  // 注册成功状态
  const [registered, setRegistered] = useState(false);
  
  // 是否显示密码
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 处理表单输入变化
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
    
    // 清除相关错误
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // 切换显示密码
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  // 切换显示确认密码
  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  // 阻止鼠标按下默认行为
  const handleMouseDownPassword = (e) => {
    e.preventDefault();
  };
  
  // 表单验证
  const validate = () => {
    let tempErrors = {};
    let isValid = true;
    
    if (!formData.username.trim()) {
      tempErrors.username = '用户名不能为空';
      isValid = false;
    } else if (formData.username.length < 3) {
      tempErrors.username = '用户名长度不能小于3位';
      isValid = false;
    }
    
    if (!formData.password) {
      tempErrors.password = '密码不能为空';
      isValid = false;
    } else if (formData.password.length < 6) {
      tempErrors.password = '密码长度不能小于6位';
      isValid = false;
    }
    
    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = '请确认密码';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = '两次输入的密码不一致';
      isValid = false;
    }
    
    if (!formData.email.trim()) {
      tempErrors.email = '邮箱不能为空';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        tempErrors.email = '请输入有效的邮箱地址';
        isValid = false;
      }
    }
    
    if (!formData.fullName.trim()) {
      tempErrors.fullName = '姓名不能为空';
      isValid = false;
    }
    
    if (!formData.agreeTerms) {
      tempErrors.agreeTerms = '必须同意服务条款';
      isValid = false;
    }
    
    setErrors(tempErrors);
    return isValid;
  };
  
  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // 排除不需要发送的字段
      const { confirmPassword, agreeTerms, ...registerData } = formData;
      
      await axios.post('/api/auth/register', registerData);
      
      // 注册成功
      setRegistered(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('注册失败:', error);
      
      if (error.response && error.response.data) {
        // 服务器返回的错误信息
        if (error.response.data.message) {
          setErrors({ ...errors, general: error.response.data.message });
        } else {
          setErrors({ ...errors, general: '注册失败，请稍后再试' });
        }
      } else {
        setErrors({ ...errors, general: '网络错误，请稍后再试' });
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          my: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <PersonAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          注册账号
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, width: '100%', mt: 3 }}>
          {registered ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                注册成功！
              </Typography>
              <Typography variant="body1" paragraph>
                您已成功注册，即将跳转到登录页面...
              </Typography>
              <Button 
                component={RouterLink} 
                to="/login" 
                variant="contained"
                color="primary"
              >
                立即登录
              </Button>
            </Box>
          ) : (
            <>
              {errors.general && (
                <Box sx={{ mb: 2 }}>
                  <FormHelperText error>{errors.general}</FormHelperText>
                </Box>
              )}
              
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="用户名"
                    name="username"
                    autoComplete="username"
                    autoFocus
                    value={formData.username}
                    onChange={handleChange}
                    error={Boolean(errors.username)}
                    helperText={errors.username}
                    disabled={loading}
                  />
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="fullName"
                    label="姓名"
                    name="fullName"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={handleChange}
                    error={Boolean(errors.fullName)}
                    helperText={errors.fullName}
                    disabled={loading}
                  />
                </Stack>
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="电子邮箱"
                  name="email"
                  autoComplete="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  disabled={loading}
                />
                
                <FormControl 
                  variant="outlined" 
                  fullWidth 
                  margin="normal"
                  error={Boolean(errors.password)}
                >
                  <InputLabel htmlFor="password">密码 *</InputLabel>
                  <OutlinedInput
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="密码"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {errors.password && (
                    <FormHelperText error>{errors.password}</FormHelperText>
                  )}
                </FormControl>
                
                <FormControl 
                  variant="outlined" 
                  fullWidth 
                  margin="normal"
                  error={Boolean(errors.confirmPassword)}
                >
                  <InputLabel htmlFor="confirmPassword">确认密码 *</InputLabel>
                  <OutlinedInput
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={handleClickShowConfirmPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="确认密码"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {errors.confirmPassword && (
                    <FormHelperText error>{errors.confirmPassword}</FormHelperText>
                  )}
                </FormControl>
                
                <FormControl component="fieldset" margin="normal">
                  <FormLabel component="legend">选择角色</FormLabel>
                  <RadioGroup 
                    row 
                    name="role" 
                    value={formData.role} 
                    onChange={handleChange}
                  >
                    <FormControlLabel 
                      value="ORGANIZER" 
                      control={<Radio />} 
                      label="组织者" 
                      disabled={loading}
                    />
                    <FormControlLabel 
                      value="SPEAKER" 
                      control={<Radio />} 
                      label="演讲者" 
                      disabled={loading}
                    />
                    <FormControlLabel 
                      value="AUDIENCE" 
                      control={<Radio />} 
                      label="听众" 
                      disabled={loading}
                    />
                  </RadioGroup>
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      name="agreeTerms"
                      color="primary"
                      disabled={loading}
                    />
                  }
                  label="我已阅读并同意服务条款"
                />
                {errors.agreeTerms && (
                  <FormHelperText error>{errors.agreeTerms}</FormHelperText>
                )}
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? '注册中...' : '注册'}
                </Button>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Link component={RouterLink} to="/login" variant="body2">
                    已有账号？登录
                  </Link>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 