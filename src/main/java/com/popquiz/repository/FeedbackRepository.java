package com.popquiz.repository;

import com.popquiz.model.Feedback;
import com.popquiz.model.Lecture;
import com.popquiz.model.Quiz;
import com.popquiz.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByLecture(Lecture lecture);
    List<Feedback> findByQuiz(Quiz quiz);
    List<Feedback> findByUser(User user);
} 