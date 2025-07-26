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
import AddIcon from '@mui/icons-material/Add';

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
            .catch(() => {
                setError('获取讲座列表失败');
                setLoading(false);
            });
    }, []);

    const handleDetail = (lectureId) => {
        navigate(`/lectures/${lectureId}`);
    };

    const handleCreate = () => {
        navigate('/lectures/create');
    };

    if (loading) return <CircularProgress />;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{ p: 2, width: '100%' }}>
            {/* 创建讲座按钮 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    创建讲座
                </Button>
            </Box>

            <Grid container spacing={2}>
                {lectures.map((lecture) => (
                    <Grid item xs={12} md={6} lg={4} key={lecture.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div">
                                    {lecture.title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" component="div">
                                    {lecture.description}
                                </Typography>
                                <Typography variant="body2" component="div">
                                    时间：{new Date(lecture.scheduledTime).toLocaleString()}
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
