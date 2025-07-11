package com.popquiz.repository;

import com.popquiz.model.Question;
import com.popquiz.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    
    List<Question> findByQuiz(Quiz quiz);
    
    List<Question> findByQuizOrderBySequenceNumberAsc(Quiz quiz);
    
    int countByQuiz(Quiz quiz);
} 