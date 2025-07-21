package com.popquiz.repository;

import com.popquiz.model.Quiz;
import com.popquiz.model.User;
import com.popquiz.model.Question;
import com.popquiz.model.UserResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserResponseRepository extends JpaRepository<UserResponse, Long> {
    Optional<UserResponse> findByUserAndQuestion(User user, Question question);

    // 统计测验的总答题数
    @Query("SELECT COUNT(r) FROM UserResponse r WHERE r.quiz = :quiz")
    int countTotalResponsesByQuiz(Quiz quiz);

    // 统计测验的正确答题数
    @Query("SELECT COUNT(r) FROM UserResponse r WHERE r.quiz = :quiz AND r.correct = true")
    int countCorrectResponsesByQuiz(Quiz quiz);

    // 统计测验的参与人数
    @Query("SELECT COUNT(DISTINCT r.user) FROM UserResponse r WHERE r.quiz = :quiz")
    int countDistinctUsersByQuiz(Quiz quiz);

    // 统计某用户在某测验的答题数
    @Query("SELECT COUNT(r) FROM UserResponse r WHERE r.user = :user AND r.quiz = :quiz")
    int countTotalResponsesByUserAndQuiz(User user, Quiz quiz);

    // 统计某用户在某测验的正确答题数
    @Query("SELECT COUNT(r) FROM UserResponse r WHERE r.user = :user AND r.quiz = :quiz AND r.correct = true")
    int countCorrectResponsesByUserAndQuiz(User user, Quiz quiz);
    
    // DashboardController需要的批量统计方法
    @Query("SELECT COUNT(r) FROM UserResponse r WHERE r.quiz IN :quizzes")
    long countByQuizIn(@Param("quizzes") List<Quiz> quizzes);
    
    @Query("SELECT COUNT(DISTINCT r.user) FROM UserResponse r WHERE r.quiz IN :quizzes")
    long countDistinctUsersByQuizIn(@Param("quizzes") List<Quiz> quizzes);

    // 按问题序号排序获取用户的答题记录
    @Query("SELECT r FROM UserResponse r WHERE r.user = :user AND r.quiz = :quiz ORDER BY r.question.sequenceNumber ASC")
    List<UserResponse> findByUserAndQuizOrderByQuestionSequenceNumber(User user, Quiz quiz);

    // 获取测验的平均答题时间（毫秒）
    @Query("SELECT AVG(r.responseTimeMs) FROM UserResponse r WHERE r.quiz = :quiz AND r.responseTimeMs IS NOT NULL")
    Long getAverageResponseTimeByQuiz(Quiz quiz);

    // 获取所有参与测验的用户及其分数
    @Query("SELECT r.user.id, " +
           "CAST(COUNT(CASE WHEN r.correct = true THEN 1 END) * 100.0 / COUNT(r) AS double) " +
           "FROM UserResponse r " +
           "WHERE r.quiz.id = :quizId " +
           "GROUP BY r.user.id " +
           "ORDER BY COUNT(CASE WHEN r.correct = true THEN 1 END) * 100.0 / COUNT(r) DESC")
    List<Object[]> getUserScoresByQuiz(@Param("quizId") Long quizId);

    // 获取分数分布
    @Query("SELECT " +
           "CASE " +
           "  WHEN CAST(COUNT(CASE WHEN r.correct = true THEN 1 END) * 100.0 / COUNT(r) AS double) < 60 THEN '0-59' " +
           "  WHEN CAST(COUNT(CASE WHEN r.correct = true THEN 1 END) * 100.0 / COUNT(r) AS double) < 70 THEN '60-69' " +
           "  WHEN CAST(COUNT(CASE WHEN r.correct = true THEN 1 END) * 100.0 / COUNT(r) AS double) < 80 THEN '70-79' " +
           "  WHEN CAST(COUNT(CASE WHEN r.correct = true THEN 1 END) * 100.0 / COUNT(r) AS double) < 90 THEN '80-89' " +
           "  ELSE '90-100' " +
           "END as scoreRange, " +
           "COUNT(DISTINCT r.user) as userCount " +
           "FROM UserResponse r " +
           "WHERE r.quiz.id = :quizId " +
           "GROUP BY r.user.id " +
           "ORDER BY scoreRange")
    List<Object[]> getScoreDistributionByQuiz(@Param("quizId") Long quizId);
    
    @Query("SELECT COUNT(r) FROM UserResponse r WHERE r.user = :user AND r.quiz IN :quizzes")
    long countByUserAndQuizIn(@Param("user") User user, @Param("quizzes") List<Quiz> quizzes);
    
    @Query("SELECT COUNT(r) FROM UserResponse r WHERE r.quiz IN :quizzes AND r.correct = true")
    long countCorrectResponsesByQuizIn(@Param("quizzes") List<Quiz> quizzes);
    
    @Query("SELECT COUNT(r) FROM UserResponse r WHERE r.user = :user AND r.quiz IN :quizzes AND r.correct = true")
    long countCorrectResponsesByUserAndQuizIn(@Param("user") User user, @Param("quizzes") List<Quiz> quizzes);
} 