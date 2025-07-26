package com.popquiz.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LectureDto {
    private Long id;
    private String title;
    private String description;
    private Long organizerId;
    private String organizerUsername;
    private Long presenterId;
    private String presenterUsername;
    private LocalDateTime scheduledTime;
    private String status;
    private Integer duration;
    private String category;
    private Boolean isPublic;
    private Boolean allowQuestions;
}
