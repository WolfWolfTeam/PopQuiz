package com.popquiz.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI生成的测验题目数据结构
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestion {

    private String content;
    private List<QuizOption> options;
    private String explanation;
    private int correctIndex;

    public String getQuestion() {
        return content;
    }

    public int getCorrectIndex() {
        return correctIndex;
    }
}
