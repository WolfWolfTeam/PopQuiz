package com.popquiz.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 测验实体类
 * 表示在演讲/课程中的一次测验
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "quiz")
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecture_id", nullable = false)
    private Lecture lecture;

    private String title;

    @Column(nullable = false)
    private Integer sequenceNumber; // 测验在该演讲中的序号

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private QuizStatus status = QuizStatus.DRAFT;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    private LocalDateTime publishedAt;

    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Integer timeLimit = 30; // 默认30秒时限

    @Column(nullable = false)
    private Integer questionCount = 0; // 新增字段

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Question> questions = new ArrayList<>();

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    private List<UserResponse> responses = new ArrayList<>();

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    private List<Feedback> feedbacks = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // 显式定义 setQuestionCount（因有自定义调用）
    public Integer getQuestionCount() {
        return questionCount;
    }

    public void setQuestionCount(Integer questionCount) {
        this.questionCount = questionCount;
    }

    public enum QuizStatus {
        DRAFT,       // 草稿
        PUBLISHED,   // 已发布
        ACTIVE,      // 进行中
        EXPIRED,     // 已过期
        CANCELLED    // 已取消
    }
}
