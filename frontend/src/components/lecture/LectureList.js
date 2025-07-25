import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material';

const LectureList = () => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
        .get('/api/organizer/lectures')
        .then((res) => {
          setLectures(res.data);
          setLoading(false);
        })
        .catch((err) => {
          setError('获取讲座列表失败');
          setLoading(false);
        });
  }, []);

  const handleDetail = (lectureId) => {
    navigate(`/lectures/${lectureId}`);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
      <Box sx={{ p: 2, width: '100%' }}>
        <Grid container spacing={2}>
          {lectures.map((lecture) => (
              <Grid item xs={12} md={6} lg={4} key={lecture.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{lecture.title}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {lecture.description}
                    </Typography>
                    <Typography variant="body2">
                      时间：{lecture.scheduledTime}
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => handleDetail(lecture.id)}
                    >
                      查看详情
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
          ))}
        </Grid>
      </Box>
  );
};

export default LectureList;
