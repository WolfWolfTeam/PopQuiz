package com.popquiz.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * 徽章实体类
 * 用于系统的游戏化激励功能，用户可以通过不同的行为获得不同徽章
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "badges")
public class Badge {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    private String description;
    
    private String iconUrl;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BadgeType type;
    
    @ManyToMany(mappedBy = "badges")
    private Set<User> users = new HashSet<>();
    
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
    
    public enum BadgeType {
        PARTICIPATION,    // 参与徽章
        ACHIEVEMENT,      // 成就徽章
        EXCELLENCE,       // 卓越徽章
        SPECIAL           // 特殊徽章
    }
} 