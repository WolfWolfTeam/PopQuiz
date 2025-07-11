import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';

/**
 * 404页面组件
 * 当访问不存在的页面时显示
 */
const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 2 }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
        </Box>
        
        <Typography variant="h4" gutterBottom>
          页面不存在
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          抱歉，您访问的页面不存在或已被删除。
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          返回首页
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFound; 