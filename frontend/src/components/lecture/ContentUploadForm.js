import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';

const ContentUploadForm = ({ lectureId, onUploaded, onCancel }) => {
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    contentType: 'SLIDE',
    file: null,
    description: ''
  });
  
  // 错误状态
  const [errors, setErrors] = useState({});
  
  // 上传状态
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // 可选内容类型
  const contentTypes = [
    { value: 'SLIDE', label: '幻灯片' },
    { value: 'DOCUMENT', label: '文档' },
    { value: 'VIDEO', label: '视频' },
    { value: 'AUDIO', label: '音频' },
    { value: 'TEXT', label: '文本' },
    { value: 'OTHER', label: '其他' }
  ];
  
  // 处理表单输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // 清除相关错误
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // 处理文件选择
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // 检查文件大小（限制为50MB）
      if (selectedFile.size > 50 * 1024 * 1024) {
        setErrors({ ...errors, file: '文件大小不能超过50MB' });
        return;
      }
      
      setFormData({ ...formData, file: selectedFile });
      
      // 自动设置标题（如果为空）
      if (!formData.title) {
        setFormData({
          ...formData,
          file: selectedFile,
          title: selectedFile.name.split('.')[0]
        });
      }
      
      // 清除文件错误
      if (errors.file) {
        setErrors({ ...errors, file: '' });
      }
    }
  };
  
  // 表单验证
  const validate = () => {
    let tempErrors = {};
    let isValid = true;
    
    if (!formData.title.trim()) {
      tempErrors.title = '标题不能为空';
      isValid = false;
    }
    
    if (!formData.file) {
      tempErrors.file = '请选择要上传的文件';
      isValid = false;
    }
    
    if (!formData.contentType) {
      tempErrors.contentType = '请选择内容类型';
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
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // 创建FormData对象
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('contentType', formData.contentType);
      uploadFormData.append('description', formData.description || '');
      
      // 发送上传请求，并跟踪进度
      const response = await axios.post(
          `/api/presenter/lectures/${lectureId}/content`,
          uploadFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': 'Bearer ' + localStorage.getItem('token') // 如果后端有鉴权
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          }
      );

      // 上传成功，通知父组件
      if (onUploaded && typeof onUploaded === 'function') {
        onUploaded(response.data);
      }
      
    } catch (error) {
      console.error('上传失败:', error);
      
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          setErrors({ ...errors, general: error.response.data.message });
        } else {
          setErrors({ ...errors, general: '上传失败，请稍后再试' });
        }
      } else {
        setErrors({ ...errors, general: '网络错误，请稍后再试' });
      }
      
      setUploading(false);
    }
  };
  
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        上传内容
      </Typography>
      
      {errors.general && (
        <Box sx={{ mb: 2 }}>
          <FormHelperText error>{errors.general}</FormHelperText>
        </Box>
      )}
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="title"
              label="内容标题"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={Boolean(errors.title)}
              helperText={errors.title}
              disabled={uploading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" error={Boolean(errors.contentType)}>
              <InputLabel id="contentType-label">内容类型</InputLabel>
              <Select
                labelId="contentType-label"
                id="contentType"
                name="contentType"
                value={formData.contentType}
                label="内容类型"
                onChange={handleChange}
                disabled={uploading}
              >
                {contentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.contentType && (
                <FormHelperText>{errors.contentType}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="内容描述（可选）"
              name="description"
              multiline
              rows={2}
              value={formData.description}
              onChange={handleChange}
              disabled={uploading}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <input
                accept="*/*"
                style={{ display: 'none' }}
                id="content-file"
                type="file"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <label htmlFor="content-file">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={uploading}
                >
                  选择文件
                </Button>
              </label>
              
              {formData.file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  已选择: {formData.file.name} ({Math.round(formData.file.size / 1024)} KB)
                </Typography>
              )}
              
              {errors.file && (
                <FormHelperText error>{errors.file}</FormHelperText>
              )}
            </Box>
          </Grid>
          
          {uploading && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                  上传中... {uploadProgress}%
                </Typography>
              </Box>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                onClick={onCancel}
                variant="outlined"
                startIcon={<CancelIcon />}
                disabled={uploading}
              >
                取消
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                disabled={uploading}
              >
                {uploading ? '上传中...' : '上传'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ContentUploadForm; 