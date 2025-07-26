package com.popquiz.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 内容实体类
 * 存储演讲/课程的各种内容（文本，PPT，PDF，音频，视频等）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "contents")
public class Content {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecture_id", nullable = false)
    @JsonIgnore
    private Lecture lecture;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ContentType type;
    
    private String title;
    
    // 对于文本内容，直接存储内容
    @Column(columnDefinition = "TEXT")
    private String textContent;
    
    // 对于文件类内容，存储文件路径
    private String filePath;
    
    // 文件的原始文件名
    private String originalFilename;
    
    // 文件类型的MIME类型
    private String mimeType;
    
    // 文件大小（字节）
    private Long fileSize;
    
    // 处理状态
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProcessStatus processStatus = ProcessStatus.PENDING;
    
    // 处理完成后提取的文本内容
    @Column(columnDefinition = "TEXT")
    private String extractedText;
    
    // 处理中出现的错误信息
    private String errorMessage;
    
    // 上传/创建时间
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    // 最后更新时间
    private LocalDateTime updatedAt;
    
    // 处理开始时间
    private LocalDateTime processStartTime;
    
    // 处理完成时间
    private LocalDateTime processEndTime;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public enum ContentType {
        TEXT,           // 纯文本
        POWERPOINT,     // PowerPoint文件
        PDF,            // PDF文件
        AUDIO,          // 音频文件
        VIDEO,          // 视频文件
        OTHER           // 其他类型
    }
    
    public enum ProcessStatus {
        PENDING,        // 等待处理
        PROCESSING,     // 处理中
        COMPLETED,      // 处理完成
        FAILED          // 处理失败
    }
} 