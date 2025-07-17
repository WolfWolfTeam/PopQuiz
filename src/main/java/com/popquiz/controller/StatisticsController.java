package com.popquiz.controller;

import com.popquiz.model.Lecture;
import com.popquiz.model.Quiz;
import com.popquiz.model.User;
import com.popquiz.repository.LectureRepository;
import com.popquiz.repository.QuizRepository;
import com.popquiz.repository.UserRepository;
import com.popquiz.repository.UserResponseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organizer/lectures")
public class StatisticsController {
    private final LectureRepository lectureRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final UserResponseRepository userResponseRepository;

    public StatisticsController(LectureRepository lectureRepository, QuizRepository quizRepository, UserRepository userRepository, UserResponseRepository userResponseRepository) {
        this.lectureRepository = lectureRepository;
        this.quizRepository = quizRepository;
        this.userRepository = userRepository;
        this.userResponseRepository = userResponseRepository;
    }

    // 组织者全局统计
    @GetMapping("/statistics")
    public ResponseEntity<?> getOrganizerStatistics(Principal principal) {
        User organizer = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        List<Lecture> lectures = lectureRepository.findByOrganizer(organizer);
        List<Map<String, Object>> lectureStats = lectures.stream().map(lecture -> {
            Map<String, Object> stat = new HashMap<>();
            stat.put("lectureId", lecture.getId());
            stat.put("title", lecture.getTitle());
            List<Quiz> quizzes = quizRepository.findByLecture(lecture);
            stat.put("quizCount", quizzes.size());
            int totalParticipants = lecture.getAudience().size();
            stat.put("participantCount", totalParticipants);
            int totalResponses = quizzes.stream().mapToInt(q -> userResponseRepository.countTotalResponsesByQuiz(q)).sum();
            stat.put("totalResponses", totalResponses);
            return stat;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(lectureStats);
    }
} 