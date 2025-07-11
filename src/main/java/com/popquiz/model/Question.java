package com.popquiz.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 问题实体类
 * 表示测验中的单个问题
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "questions")
public class Question {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;
    
    @Column(nullable = false)
    private String content;
    
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Option> options = new ArrayList<>();
    
    @Column(nullable = false)
    private Integer sequenceNumber; // 问题在该测验中的序号
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type = QuestionType.MULTIPLE_CHOICE;
    
    private String explanation; // 问题答案的解释
    
    @Column(nullable = false)
    private Integer difficultyLevel = 2; // 1-5，默认中等难度
    
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL)
    private List<DiscussionComment> comments = new ArrayList<>();
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
    
    public enum QuestionType {
        MULTIPLE_CHOICE,    // 单选题
        MULTIPLE_ANSWER,    // 多选题
        TRUE_FALSE,         // 判断题
        SHORT_ANSWER        // 简答题
    }
} 