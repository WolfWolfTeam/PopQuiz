package com.popquiz.model;

import java.time.LocalDateTime;

public class CreateLectureRequest {
    private String title;
    private String description;
    private Long presenterId;
    private LocalDateTime scheduledTime;
    private Integer quizInterval;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getPresenterId() { return presenterId; }
    public void setPresenterId(Long presenterId) { this.presenterId = presenterId; }
    public LocalDateTime getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(LocalDateTime scheduledTime) { this.scheduledTime = scheduledTime; }
    public Integer getQuizInterval() { return quizInterval; }
    public void setQuizInterval(Integer quizInterval) { this.quizInterval = quizInterval; }
} 