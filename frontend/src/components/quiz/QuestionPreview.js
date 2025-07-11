import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  Collapse,
  IconButton,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/**
 * 问题预览组件
 * 用于在测验创建过程中预览问题
 */
const QuestionPreview = ({ question, index }) => {
  const [expanded, setExpanded] = useState(false);
  
  // 切换展开/折叠解释
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  // 格式化序号
  const formatIndex = (idx) => {
    return (idx + 1).toString().padStart(2, '0');
  };
  
  // 获取选项样式
  const getOptionStyle = (option) => {
    if (option.correct) {
      return {
        backgroundColor: 'rgba(46, 125, 50, 0.08)',
        border: '1px solid rgba(46, 125, 50, 0.5)',
        borderRadius: 1
      };
    }
    return {};
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', mb: 1 }}>
          <Typography 
            variant="subtitle1"
            fontWeight="bold" 
            sx={{ mr: 1, minWidth: '36px' }}
          >
            {formatIndex(index)}.
          </Typography>
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            {question.content}
          </Typography>
        </Box>
        
        <Box sx={{ pl: 4.5, mb: 2 }}>
          <RadioGroup>
            {question.options.map((option, optIdx) => (
              <FormControlLabel
                key={optIdx}
                value={option.label}
                control={<Radio checked={option.correct} />}
                label={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      ...(option.correct && { fontWeight: 'bold' })
                    }}
                  >
                    {option.label}. {option.content}
                  </Typography>
                }
                sx={getOptionStyle(option)}
                disabled
              />
            ))}
          </RadioGroup>
        </Box>
        
        {question.explanation && (
          <Box sx={{ pl: 4.5 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: 'text.secondary',
                cursor: 'pointer',
                mb: 1
              }}
              onClick={toggleExpand}
            >
              <Typography variant="body2" sx={{ mr: 1 }}>
                解释
              </Typography>
              <IconButton size="small">
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
            
            <Collapse in={expanded}>
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                  borderRadius: 1
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {question.explanation}
                </Typography>
              </Box>
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionPreview; 