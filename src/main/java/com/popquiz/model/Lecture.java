package com.popquiz.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 演讲/课程实体类
 * 表示系统中的一次演讲或课程
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "lectures")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Lecture {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "presenter_id", nullable = false)
    private User presenter;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "lecture_audience",
        joinColumns = @JoinColumn(name = "lecture_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> audience = new HashSet<>();
    
    @Column(nullable = false)
    private LocalDateTime scheduledTime;
    
    private LocalDateTime startTime;
    
    private LocalDateTime endTime;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LectureStatus status = LectureStatus.SCHEDULED;
    
    @OneToMany(mappedBy = "lecture", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Content> contents = new ArrayList<>();
    
    @OneToMany(mappedBy = "lecture", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Quiz> quizzes = new ArrayList<>();
    
    private String accessCode;
    
    @Column(nullable = false)
    private Integer quizInterval = 10; // 默认10分钟间隔
    
    @Column(nullable = false)
    private boolean autoGenerateQuiz = true;
    
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public enum LectureStatus {
        SCHEDULED,     // 已排定
        LIVE,          // 进行中
        COMPLETED,     // 已完成
        CANCELLED      // 已取消
    }
} 