import React, { useState, useContext } from 'react';
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
  Typography
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Avatar from '@mui/material/Avatar';
import axios from 'axios';
import AuthContext from '../../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  
  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  // 错误状态
  const [errors, setErrors] = useState({});
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  
  // 是否显示密码
  const [showPassword, setShowPassword] = useState(false);
  
  // 处理表单输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // 清除相关错误
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // 切换显示密码
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
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
    }
    
    if (!formData.password) {
      tempErrors.password = '密码不能为空';
      isValid = false;
    } else if (formData.password.length < 6) {
      tempErrors.password = '密码长度不能小于6位';
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
      const response = await axios.post('/api/auth/login', formData);
      
      // 登录成功
      const { token, user } = response.data;
      console.log('登录成功，token:', token);
      console.log('登录成功，user:', user);
      login(token, user);
      console.log('login(token, user) 已调用');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('登录失败:', error);
      
      if (error.response && error.response.data) {
        // 服务器返回的错误信息
        if (error.response.data.message) {
          setErrors({ ...errors, general: error.response.data.message });
        } else {
          setErrors({ ...errors, general: '登录失败，请检查用户名和密码' });
        }
      } else {
        setErrors({ ...errors, general: '网络错误，请稍后再试' });
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          登录
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, width: '100%', mt: 3 }}>
          {errors.general && (
            <Box sx={{ mb: 2 }}>
              <FormHelperText error>{errors.general}</FormHelperText>
            </Box>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
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
                autoComplete="current-password"
                disabled={loading}
              />
              {errors.password && (
                <FormHelperText error>{errors.password}</FormHelperText>
              )}
            </FormControl>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
            
            <Stack direction="row" justifyContent="space-between">
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                忘记密码？
              </Link>
              <Link component={RouterLink} to="/register" variant="body2">
                没有账号？注册
              </Link>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 