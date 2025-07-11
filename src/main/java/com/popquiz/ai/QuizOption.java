package com.popquiz.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 测验选项数据传输对象
 * 用于AI生成的问题选项
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizOption {
    
    private char label;
    private String content;
    private boolean isCorrect;
} 