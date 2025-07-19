package com.popquiz.repository;

import com.popquiz.model.Option;
import com.popquiz.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OptionRepository extends JpaRepository<Option, Long> {
    
    /**
     * 根据问题查找所有选项
     */
    List<Option> findByQuestionOrderByOptionLabelAsc(Question question);
    
    /**
     * 根据问题ID查找所有选项
     */
    List<Option> findByQuestionIdOrderByOptionLabelAsc(Long questionId);
    
    /**
     * 根据问题查找正确答案
     */
    List<Option> findByQuestionAndIsCorrectTrue(Question question);
} 