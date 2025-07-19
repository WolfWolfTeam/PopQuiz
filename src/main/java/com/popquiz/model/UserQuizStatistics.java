package com.popquiz.model;

public class UserQuizStatistics {
    private Long userId;
    private Long quizId;
    private int totalResponses;
    private int correctResponses;
    private double correctRate;
    private int rank;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }
    public int getTotalResponses() { return totalResponses; }
    public void setTotalResponses(int totalResponses) { this.totalResponses = totalResponses; }
    public int getCorrectResponses() { return correctResponses; }
    public void setCorrectResponses(int correctResponses) { this.correctResponses = correctResponses; }
    public double getCorrectRate() { return correctRate; }
    public void setCorrectRate(double correctRate) { this.correctRate = correctRate; }
    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }
} 