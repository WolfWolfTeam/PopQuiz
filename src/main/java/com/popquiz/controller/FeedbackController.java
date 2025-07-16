package com.popquiz.controller;

import com.popquiz.model.Feedback;
import com.popquiz.service.FeedbackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api")
public class FeedbackController {
    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    // 提交反馈
    @PostMapping("/feedback")
    public ResponseEntity<?> submitFeedback(@RequestBody Feedback feedback, Principal principal) {
        try {
            Feedback saved = feedbackService.submitFeedback(feedback, principal.getName());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 查询讲座反馈
    @GetMapping("/lectures/{lectureId}/feedbacks")
    public ResponseEntity<List<Feedback>> getLectureFeedbacks(@PathVariable Long lectureId) {
        return ResponseEntity.ok(feedbackService.getLectureFeedbacks(lectureId));
    }

    // 查询测验反馈
    @GetMapping("/quizzes/{quizId}/feedbacks")
    public ResponseEntity<List<Feedback>> getQuizFeedbacks(@PathVariable Long quizId) {
        return ResponseEntity.ok(feedbackService.getQuizFeedbacks(quizId));
    }
} 