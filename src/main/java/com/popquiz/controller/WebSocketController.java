package com.popquiz.controller;

import com.popquiz.model.DiscussionComment;
import com.popquiz.model.Question;
import com.popquiz.model.User;
import com.popquiz.repository.DiscussionCommentRepository;
import com.popquiz.repository.QuestionRepository;
import com.popquiz.repository.UserRepository;
import com.popquiz.service.NotificationService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket控制器
 * 处理WebSocket消息通信
 */
@Controller
public class WebSocketController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final DiscussionCommentRepository discussionCommentRepository;

    public WebSocketController(
            NotificationService notificationService,
            UserRepository userRepository,
            QuestionRepository questionRepository,
            DiscussionCommentRepository discussionCommentRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
        this.discussionCommentRepository = discussionCommentRepository;
    }

    /**
     * 处理用户上线消息
     */
    @MessageMapping("/connect")
    public void handleUserConnect(Principal principal, SimpMessageHeaderAccessor headerAccessor) {
        if (principal != null) {
            String username = principal.getName();
            headerAccessor.getSessionAttributes().put("username", username);
            
            // 可以在这里发送用户上线通知
            Map<String, Object> data = new HashMap<>();
            data.put("message", "您已成功连接到PopQuiz实时通知系统");
            data.put("timestamp", System.currentTimeMillis());
            
            notificationService.sendUserNotification(username, "CONNECT_SUCCESS", data);
        }
    }

    /**
     * 处理听众加入讲座的消息
     */
    @MessageMapping("/lecture/{lectureId}/join")
    public void handleAudienceJoinLecture(
            @DestinationVariable Long lectureId,
            Principal principal) {
        if (principal != null) {
            String username = principal.getName();
            
            // 这里可以处理听众加入讲座的逻辑
            // 例如，将用户添加到讲座的WebSocket订阅组
            
            // 通知演讲者有新听众加入
            Map<String, Object> data = new HashMap<>();
            data.put("lectureId", lectureId);
            data.put("username", username);
            data.put("timestamp", System.currentTimeMillis());
            
            // 这里可以发送通知给演讲者
        }
    }

    /**
     * 处理问题评论
     */
    @MessageMapping("/question/{questionId}/comment")
    @Transactional
    public void handleQuestionComment(
            @DestinationVariable Long questionId,
            @Payload CommentMessage message,
            Principal principal) {
        if (principal == null) {
            return;
        }
        
        try {
            User user = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            Question question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new RuntimeException("问题不存在"));
            
            // 创建新评论
            DiscussionComment comment = new DiscussionComment();
            comment.setUser(user);
            comment.setQuestion(question);
            comment.setContent(message.getContent());
            
            // 如果是回复，设置父评论
            if (message.getParentCommentId() != null) {
                DiscussionComment parentComment = discussionCommentRepository.findById(message.getParentCommentId())
                        .orElseThrow(() -> new RuntimeException("父评论不存在"));
                comment.setParent(parentComment);
            }
            
            // 保存评论
            discussionCommentRepository.save(comment);
            
            // 发送新评论通知
            notificationService.broadcastNewComment(questionId, user.getUsername());
            
        } catch (Exception e) {
            // 处理错误
        }
    }
    
    /**
     * 评论消息数据传输对象
     */
    public static class CommentMessage {
        private String content;
        private Long parentCommentId;
        
        // getter and setter
        
        public String getContent() {
            return content;
        }
        
        public void setContent(String content) {
            this.content = content;
        }
        
        public Long getParentCommentId() {
            return parentCommentId;
        }
        
        public void setParentCommentId(Long parentCommentId) {
            this.parentCommentId = parentCommentId;
        }
    }
} 