package com.popquiz.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class QuizDto {
    private Long id;
    private String title;
    private Integer sequenceNumber;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;
    private LocalDateTime expiresAt;
    private Integer timeLimit;
    private Long lectureId;
    private Integer questionCount;
}
