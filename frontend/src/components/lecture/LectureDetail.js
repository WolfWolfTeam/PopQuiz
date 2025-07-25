import React, { useState, useEffect, useContext } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  Menu,
  MenuItem
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CategoryIcon from '@mui/icons-material/Category';
import DateRangeIcon from '@mui/icons-material/DateRange';
import GroupIcon from '@mui/icons-material/Group';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WebSocketService from '../../services/WebSocketService';
import axios from 'axios';
import AuthContext from '../../contexts/AuthContext';
import ContentUploadForm from './ContentUploadForm';
import QuizList from '../quiz/QuizList';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
      <div
          role="tabpanel"
          hidden={value !== index}
          id={`lecture-tabpanel-${index}`}
          aria-labelledby={`lecture-tab-${index}`}
          {...other}
      >
        {value === index && (
            <Box sx={{ p: 3 }}>
              {children}
            </Box>
        )}
      </div>
  );
}

const LectureDetail = () => {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [contents, setContents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    const fetchLectureData = async () => {
      setLoading(true);

      try {
        const response = await axios.get(`/api/lectures/${lectureId}`);
        setLecture(response.data);

        const contentsResponse = await axios.get(`/api/lectures/${lectureId}/contents`);
        setContents(contentsResponse.data);

        const quizzesResponse = await axios.get(`/api/lectures/${lectureId}/quizzes`);
        setQuizzes(quizzesResponse.data);
      } catch (error) {
        console.error('获取讲座数据失败:', error);
        setError('获取讲座数据失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchLectureData();

    WebSocketService.subscribeLecture(lectureId, (msg) => {
      console.log('收到讲座消息:', msg);
    });

    return () => {
      WebSocketService.unsubscribeAll();
    };
  }, [lectureId]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'UPCOMING': return 'info';
      case 'LIVE': return 'success';
      case 'ENDED': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'UPCOMING': return '即将开始';
      case 'LIVE': return '进行中';
      case 'ENDED': return '已结束';
      default: return status;
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleStartLecture = async () => {
    try {
      await axios.post(`/api/lectures/${lectureId}/start`);
      setLecture({ ...lecture, status: 'LIVE' });
    } catch (error) {
      console.error('开始讲座失败:', error);
    }
  };

  const handleEndLecture = async () => {
    try {
      await axios.post(`/api/lectures/${lectureId}/end`);
      setLecture({ ...lecture, status: 'ENDED' });
    } catch (error) {
      console.error('结束讲座失败:', error);
    }
  };

  const handleEditLecture = () => {
    navigate(`/lectures/edit/${lectureId}`);
    handleMenuClose();
  };

  const handleDeleteLecture = async () => {
    if (window.confirm('确定要删除此讲座吗？此操作不可撤销。')) {
      try {
        await axios.delete(`/api/lectures/${lectureId}`);
        navigate('/lectures');
      } catch (error) {
        console.error('删除讲座失败:', error);
      }
    }
    handleMenuClose();
  };

  const handleContentUploaded = (newContent) => {
    setContents([...contents, newContent]);
    setShowUploadForm(false);
  };

  const isOwnerOrSpeaker = () => {
    if (!user || !lecture) return false;
    return user.id === lecture.organizerId || user.id === lecture.speakerId;
  };

  const getPrimaryActionButton = () => {
    if (!lecture) return null;

    if (isOwnerOrSpeaker()) {
      if (lecture.status === 'UPCOMING') {
        return (
            <Button variant="contained" color="primary" startIcon={<PlayArrowIcon />} onClick={handleStartLecture}>
              开始讲座
            </Button>
        );
      }
      if (lecture.status === 'LIVE') {
        return (
            <Button variant="contained" color="error" onClick={handleEndLecture}>
              结束讲座
            </Button>
        );
      }
      return null;
    }

    if (lecture.status === 'LIVE') {
      return (
          <Button variant="contained" color="primary" component={RouterLink} to={`/lectures/${lectureId}/join`} startIcon={<PlayArrowIcon />}>
            加入讲座
          </Button>
      );
    }

    return null;
  };

  const canCreateQuiz = () => {
    if (!lecture || !user) return false;
    if (user.id !== lecture.organizerId && user.id !== lecture.speakerId) return false;
    return contents.length > 0;
  };

  if (loading) {
    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <Typography>加载中...</Typography>
          </Box>
        </Container>
    );
  }

  if (error) {
    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" paragraph>{error}</Typography>
            <Button variant="contained" onClick={() => navigate('/lectures')}>返回讲座列表</Button>
          </Paper>
        </Container>
    );
  }

  if (!lecture) {
    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography paragraph>讲座不存在或已被删除</Typography>
            <Button variant="contained" onClick={() => navigate('/lectures')}>返回讲座列表</Button>
          </Paper>
        </Container>
    );
  }

  // 组件 UI 返回部分略
  return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h4" gutterBottom>{lecture.title}</Typography>
              <Chip label={getStatusText(lecture.status)} color={getStatusColor(lecture.status)} />
            </Box>
            <Box>
              {getPrimaryActionButton()}
              {isOwnerOrSpeaker() && (
                  <>
                    <IconButton onClick={handleMenuOpen}>
                      <MoreVertIcon />
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
                      <MenuItem onClick={handleEditLecture}>
                        <EditIcon fontSize="small" sx={{ mr: 1 }} /> 编辑讲座
                      </MenuItem>
                      <MenuItem onClick={handleDeleteLecture}>
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> 删除讲座
                      </MenuItem>
                    </Menu>
                  </>
              )}
            </Box>
          </Box>

          <Typography variant="body1" gutterBottom>{lecture.description}</Typography>
          <Grid container spacing={2} mt={2}>
            <Grid item xs={12} sm={6}>
              <List>
                <ListItem>
                  <ListItemIcon><AccessTimeIcon /></ListItemIcon>
                  <ListItemText primary="预定时间" secondary={formatDateTime(lecture.scheduledTime)} />
                </ListItem>
                {lecture.startTime && (
                    <ListItem>
                      <ListItemIcon><PlayArrowIcon /></ListItemIcon>
                      <ListItemText primary="开始时间" secondary={formatDateTime(lecture.startTime)} />
                    </ListItem>
                )}
                {lecture.endTime && (
                    <ListItem>
                      <ListItemIcon><DateRangeIcon /></ListItemIcon>
                      <ListItemText primary="结束时间" secondary={formatDateTime(lecture.endTime)} />
                    </ListItem>
                )}
              </List>
            </Grid>
            <Grid item xs={12} sm={6}>
              <List>
                <ListItem>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="组织者" secondary={lecture.organizerName || '—'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="演讲者" secondary={lecture.presenterName || '—'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><GroupIcon /></ListItemIcon>
                  <ListItemText primary="观众人数" secondary={lecture.audienceCount || 0} />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="讲座内容" />
            <Tab label="测验管理" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          {isOwnerOrSpeaker() && (
              <>
                <Button
                    variant="outlined"
                    startIcon={<UploadFileIcon />}
                    onClick={() => setShowUploadForm(true)}
                    sx={{ mb: 2 }}
                >
                  上传内容
                </Button>
                {showUploadForm && (
                    <ContentUploadForm lectureId={lectureId} onUploaded={handleContentUploaded} />
                )}
              </>
          )}
          {contents.length === 0 ? (
              <Typography>暂无上传内容</Typography>
          ) : (
              <List>
                {contents.map((content) => (
                    <ListItem key={content.id}>
                      <ListItemIcon><CategoryIcon /></ListItemIcon>
                      <ListItemText
                          primary={content.title || content.originalFilename}
                          secondary={content.processStatus}
                      />
                    </ListItem>
                ))}
              </List>
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          {canCreateQuiz() && (
              <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  component={RouterLink}
                  to={`/lectures/${lectureId}/quizzes/create`}
                  sx={{ mb: 2 }}
              >
                创建测验
              </Button>
          )}
          <QuizList quizzes={quizzes} />
        </TabPanel>
      </Container>
  );

};

export default LectureDetail;