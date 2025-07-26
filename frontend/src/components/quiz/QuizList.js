import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, Chip, IconButton, List, ListItem,
  ListItemButton, ListItemText, Menu, MenuItem,
  Typography, Divider, ListItemIcon
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BarChartIcon from '@mui/icons-material/BarChart';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import axios from 'axios';

const QuizList = ({ quizzes, isOwner }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const openMenu = (e, quiz) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setSelectedQuiz(quiz);
  };
  const closeMenu = () => {
    setMenuAnchorEl(null);
    setSelectedQuiz(null);
  };

  const activate = async (id) => {
    closeMenu();
    try { await axios.post(`/api/quizzes/${id}/activate`); }
    catch { alert('激活失败'); }
  };
  const remove = async (id) => {
    closeMenu();
    if (!window.confirm('确认删除？')) return;
    try { await axios.delete(`/api/quizzes/${id}`); window.location.reload(); }
    catch { alert('删除失败'); }
  };

  const statusChip = (s) => {
    switch (s) {
      case 'DRAFT':     return <Chip size="small" label="草稿" />;
      case 'PUBLISHED': return <Chip size="small" color="primary" label="已发布" />;
      case 'ACTIVE':    return <Chip size="small" color="success" label="进行中" />;
      case 'EXPIRED':   return <Chip size="small" label="已结束" />;
      default:          return <Chip size="small" label={s} />;
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString() : '未设置';

  const primaryBtn = (quiz) => {
    if (isOwner) {
      if (quiz.status === 'DRAFT') {
        return <Button size="small" variant="outlined" component={RouterLink} to={`/quiz/${quiz.id}/edit`}>编辑</Button>;
      }
      if (quiz.status === 'PUBLISHED') {
        return <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} onClick={() => activate(quiz.id)}>激活</Button>;
      }
      if (quiz.status === 'ACTIVE') {
        return <Button size="small" variant="outlined" component={RouterLink} to={`/quiz/${quiz.id}/live`}>实时</Button>;
      }
      if (quiz.status === 'EXPIRED') {
        return <Button size="small" variant="outlined" startIcon={<BarChartIcon />} component={RouterLink} to={`/quiz/${quiz.id}/results`}>结果</Button>;
      }
      return null;
    } else {
      if (quiz.status === 'ACTIVE') {
        return <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} component={RouterLink} to={`/quiz/${quiz.id}/play`}>答题</Button>;
      }
      if (quiz.status === 'EXPIRED') {
        return <Button size="small" variant="outlined" startIcon={<BarChartIcon />} component={RouterLink} to={`/quiz/${quiz.id}/results`}>结果</Button>;
      }
      return null;
    }
  };

  if (!quizzes?.length) {
    return <Typography sx={{ py:4, textAlign:'center' }} color="text.secondary">暂无测验</Typography>;
  }

  return (
      <>
        <List>
          {quizzes.map(q => (
              <React.Fragment key={q.id}>
                <ListItem
                    disablePadding
                    secondaryAction={isOwner && <IconButton onClick={e=>openMenu(e,q)}><MoreVertIcon/></IconButton>}
                >
                  <ListItemButton
                      component={RouterLink}
                      to={`/quiz/${q.id}${q.status==='ACTIVE'?'/play':'/results'}`}
                  >
                    <ListItemText
                        primary={<><Typography component="span">{q.title}</Typography> {statusChip(q.status)}</>}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {q.questionCount} 问题 | {q.timeLimit} 秒
                            </Typography>
                            <Box sx={{ display:'block', mt:.5 }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr:.5, verticalAlign:'middle' }}/>
                              {q.status==='ACTIVE'
                                  ? '进行中'
                                  : q.publishedAt
                                      ? `发布于 ${fmt(q.publishedAt)}`
                                      : '未发布'}
                            </Box>
                          </>
                        }
                    />
                  </ListItemButton>
                  <Box sx={{ mr:2 }}>{primaryBtn(q)}</Box>
                </ListItem>
                <Divider component="li"/>
              </React.Fragment>
          ))}
        </List>

        <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={closeMenu}
            anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
            transformOrigin={{ vertical:'top', horizontal:'right' }}
        >
          {selectedQuiz?.status==='DRAFT' && (
              <MenuItem component={RouterLink} to={`/quiz/${selectedQuiz.id}/edit`} onClick={closeMenu}>
                <ListItemIcon><EditIcon fontSize="small"/></ListItemIcon>
                <ListItemText primary="编辑测验"/>
              </MenuItem>
          )}
          {selectedQuiz?.status==='PUBLISHED' && (
              <MenuItem onClick={()=>activate(selectedQuiz.id)}>
                <ListItemIcon><PlayArrowIcon fontSize="small"/></ListItemIcon>
                <ListItemText primary="激活测验"/>
              </MenuItem>
          )}
          {['DRAFT','PUBLISHED'].includes(selectedQuiz?.status) && (
              <MenuItem onClick={()=>remove(selectedQuiz.id)}>
                <ListItemIcon><DeleteIcon fontSize="small"/></ListItemIcon>
                <ListItemText primary="删除测验"/>
              </MenuItem>
          )}
          {['ACTIVE','EXPIRED'].includes(selectedQuiz?.status) && (
              <MenuItem component={RouterLink} to={`/quiz/${selectedQuiz.id}/results`} onClick={closeMenu}>
                <ListItemIcon><BarChartIcon fontSize="small"/></ListItemIcon>
                <ListItemText primary="查看结果"/>
              </MenuItem>
          )}
        </Menu>
      </>
  );
};

export default QuizList;
