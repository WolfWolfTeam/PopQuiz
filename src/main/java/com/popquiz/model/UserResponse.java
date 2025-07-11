package com.popquiz.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * 用户响应实体类
 * 记录用户对问题的回答
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_responses")
public class UserResponse {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_response_options",
        joinColumns = @JoinColumn(name = "user_response_id"),
        inverseJoinColumns = @JoinColumn(name = "option_id")
    )
    private Set<Option> selectedOptions = new HashSet<>();
    
    // 对于简答题
    @Column(columnDefinition = "TEXT")
    private String textResponse;
    
    @Column(name = "correct")
    private Boolean correct;
    
    @Column(nullable = false)
    private LocalDateTime submittedAt;
    
    // 回答时间（毫秒）
    private Long responseTimeMs;
    
    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
    }
} 