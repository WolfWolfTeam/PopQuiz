package com.popquiz.repository;

import com.popquiz.model.DiscussionComment;
import com.popquiz.model.Question;
import com.popquiz.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * 讨论评论存储库接口
 */
@Repository
public interface DiscussionCommentRepository extends JpaRepository<DiscussionComment, Long> {
    
    List<DiscussionComment> findByQuestion(Question question);
    
    List<DiscussionComment> findByQuestionOrderByCreatedAtAsc(Question question);
    
    List<DiscussionComment> findByUser(User user);
    
    List<DiscussionComment> findByQuestionAndParentIsNull(Question question);
    
    List<DiscussionComment> findByParent(DiscussionComment parent);
    
    long countByQuestion(Question question);
} 