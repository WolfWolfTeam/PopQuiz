package com.popquiz.dto;

import lombok.Data;

@Data
public class DashboardStatsDto {
    private long totalLectures;
    private long totalQuizzes;
    private long liveLectures;      // LectureStatus.LIVE
    private long activeQuizzes;     // QuizStatus.ACTIVE
}
