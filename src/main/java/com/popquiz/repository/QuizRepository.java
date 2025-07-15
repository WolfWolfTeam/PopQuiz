package com.popquiz.repository;

import com.popquiz.model.Lecture;
import com.popquiz.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    
    List<Quiz> findByLecture(Lecture lecture);
    
    List<Quiz> findByLectureOrderBySequenceNumberAsc(Lecture lecture);
    
    List<Quiz> findByStatus(Quiz.QuizStatus status);
    
    List<Quiz> findByStatusAndExpiresAtBefore(Quiz.QuizStatus status, LocalDateTime now);
    
    @Query("SELECT q FROM Quiz q WHERE q.lecture.id IN :lectureIds")
    List<Quiz> findByLectureIn(@Param("lectureIds") List<Long> lectureIds);
    
    @Query("SELECT q FROM Quiz q WHERE q.lecture.id IN :lectureIds AND q.status = :status")
    List<Quiz> findByLectureInAndStatus(@Param("lectureIds") List<Long> lectureIds, @Param("status") Quiz.QuizStatus status);
} 