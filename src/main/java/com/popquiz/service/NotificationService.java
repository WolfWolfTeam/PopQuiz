package com.popquiz.service;

import com.popquiz.model.Quiz;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 通知服务
 * 用于发送WebSocket通知
 */
@Service
public class NotificationService {
    
    private final SimpMessagingTemplate messagingTemplate;
    
    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * 向特定用户发送通知
     */
    public void sendUserNotification(String username, String type, Map<String, Object> data) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", type);
        notification.put("data", data);
        
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", notification);
    }
    
    /**
     * 向所有订阅特定话题的用户广播通知
     */
    public void broadcastNotification(String topic, String type, Map<String, Object> data) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", type);
        notification.put("data", data);
        
        messagingTemplate.convertAndSend("/topic/" + topic, notification);
    }
    
    /**
     * 向特定讲座的所有用户广播通知
     */
    public void broadcastLectureNotification(Long lectureId, String type, Map<String, Object> data) {
        broadcastNotification("lecture." + lectureId, type, data);
    }
    
    /**
     * 向特定讲座的所有用户广播测验通知
     */
    public void broadcastQuizNotification(Long lectureId, Long quizId, String type, Map<String, Object> data) {
        broadcastNotification("lecture." + lectureId + ".quiz." + quizId, type, data);
    }
    
    /**
     * 广播新评论通知
     */
    public void broadcastNewComment(Long questionId, String username) {
        Map<String, Object> data = new HashMap<>();
        data.put("questionId", questionId);
        data.put("username", username);
        data.put("timestamp", System.currentTimeMillis());
        
        broadcastNotification("question." + questionId + ".comments", "NEW_COMMENT", data);
    }

    // === 新增：为QuizService补充的通知方法 ===
    public void broadcastQuizActivated(Quiz quiz) {
        Map<String, Object> data = new HashMap<>();
        data.put("quizId", quiz.getId());
        data.put("title", quiz.getTitle());
        data.put("status", quiz.getStatus());
        data.put("expiresAt", quiz.getExpiresAt());
        broadcastLectureNotification(quiz.getLecture().getId(), "QUIZ_ACTIVATED", data);
    }

    public void broadcastQuizExpired(Quiz quiz) {
        Map<String, Object> data = new HashMap<>();
        data.put("quizId", quiz.getId());
        data.put("title", quiz.getTitle());
        data.put("status", quiz.getStatus());
        broadcastLectureNotification(quiz.getLecture().getId(), "QUIZ_EXPIRED", data);
    }

    public void sendStatisticsUpdate(Long quizId) {
        Map<String, Object> data = new HashMap<>();
        data.put("quizId", quizId);
        broadcastNotification("quiz." + quizId + ".statistics", "STATISTICS_UPDATE", data);
    }
} 