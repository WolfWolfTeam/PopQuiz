package com.popquiz.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LectureDto {
    private Long id;
    private String title;
    private String description;
    private String organizerUsername;
    private String presenterUsername;
    private LocalDateTime scheduledTime;
    private String status;
}
