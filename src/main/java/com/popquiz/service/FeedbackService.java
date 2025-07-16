package com.popquiz.service;

import com.popquiz.model.Feedback;
import com.popquiz.model.Lecture;
import com.popquiz.model.Quiz;
import com.popquiz.model.User;
import com.popquiz.repository.FeedbackRepository;
import com.popquiz.repository.LectureRepository;
import com.popquiz.repository.QuizRepository;
import com.popquiz.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FeedbackService {
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final LectureRepository lectureRepository;
    private final QuizRepository quizRepository;

    public FeedbackService(FeedbackRepository feedbackRepository, UserRepository userRepository, LectureRepository lectureRepository, QuizRepository quizRepository) {
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.lectureRepository = lectureRepository;
        this.quizRepository = quizRepository;
    }

    @Transactional
    public Feedback submitFeedback(Feedback feedback, String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("用户不存在"));
        feedback.setUser(user);
        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getLectureFeedbacks(Long lectureId) {
        Lecture lecture = lectureRepository.findById(lectureId).orElseThrow(() -> new RuntimeException("讲座不存在"));
        return feedbackRepository.findByLecture(lecture);
    }

    public List<Feedback> getQuizFeedbacks(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId).orElseThrow(() -> new RuntimeException("测验不存在"));
        return feedbackRepository.findByQuiz(quiz);
    }
} 