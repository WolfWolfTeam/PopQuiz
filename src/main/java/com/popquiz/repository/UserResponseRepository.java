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
    
    @Query("SELECT COUNT(r) FROM UserResponse r WHERE r.user = :user AND r.quiz IN :quizzes")
    long countByUserAndQuizIn(@Param("user") User user, @Param("quizzes") List<Quiz> quizzes);
    
    @Query("SELECT COUNT(r) FROM UserResponse r WHERE r.quiz IN :quizzes AND r.correct = true")
    long countCorrectResponsesByQuizIn(@Param("quizzes") List<Quiz> quizzes);
    
    @Query("SELECT COUNT(r) FROM UserResponse r WHERE r.user = :user AND r.quiz IN :quizzes AND r.correct = true")
    long countCorrectResponsesByUserAndQuizIn(@Param("user") User user, @Param("quizzes") List<Quiz> quizzes);
} 