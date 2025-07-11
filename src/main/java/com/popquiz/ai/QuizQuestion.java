package com.popquiz.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * 测验问题数据传输对象
 * 用于AI生成的问题和选项
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestion {
    
    private String content;
    private List<QuizOption> options;
    private String explanation;
} 