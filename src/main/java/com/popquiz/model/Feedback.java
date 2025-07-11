package com.popquiz.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 反馈实体类
 * 记录听众对演讲的反馈
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "feedbacks")
public class Feedback {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecture_id")
    private Lecture lecture;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;
    
    @Enumerated(EnumType.STRING)
    private FeedbackType type;
    
    private Integer rating; // 1-5星评分
    
    @Column(columnDefinition = "TEXT")
    private String comment;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
    
    public enum FeedbackType {
        TOO_FAST,       // 讲得太快
        TOO_SLOW,       // 讲得太慢
        BORING,         // 内容乏味
        QUIZ_QUALITY,   // 测验质量问题
        GENERAL,        // 一般反馈
        OTHER           // 其他
    }
} 