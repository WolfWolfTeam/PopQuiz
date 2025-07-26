package com.popquiz.controller;

import com.popquiz.dto.DashboardStatsDto;
import com.popquiz.dto.LectureDto;
import com.popquiz.dto.QuizDto;
import com.popquiz.mapper.LectureMapper;
import com.popquiz.mapper.QuizMapper;
import com.popquiz.model.Lecture;
import com.popquiz.model.Quiz;
import com.popquiz.repository.LectureRepository;
import com.popquiz.repository.QuizRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final LectureRepository lectureRepo;
    private final QuizRepository quizRepo;

    public DashboardController(LectureRepository lectureRepo,
                               QuizRepository quizRepo) {
        this.lectureRepo = lectureRepo;
        this.quizRepo    = quizRepo;
    }

    /** 1. 统计总览 */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> stats() {
        DashboardStatsDto dto = new DashboardStatsDto();
        dto.setTotalLectures( lectureRepo.count() );
        dto.setTotalQuizzes(  quizRepo.count() );
        dto.setLiveLectures(  lectureRepo.countByStatus(Lecture.LectureStatus.LIVE) );
        dto.setActiveQuizzes( quizRepo.countByStatus(Quiz.QuizStatus.ACTIVE) );
        return ResponseEntity.ok(dto);
    }

    /** 2. 最近 5 条按排定时间倒序的讲座 */
    @GetMapping("/recent-lectures")
    public ResponseEntity<List<LectureDto>> recentLectures() {
        List<Lecture> recent = lectureRepo.findTop5ByOrderByScheduledTimeDesc();
        return ResponseEntity.ok(LectureMapper.toDtoList(recent));
    }

    /** 3. 当前所有“进行中”测验 */
    @GetMapping("/active-quizzes")
    public ResponseEntity<List<QuizDto>> activeQuizzes() {
        List<Quiz> active = quizRepo.findByStatus(Quiz.QuizStatus.ACTIVE);
        return ResponseEntity.ok(QuizMapper.toDtoList(active));
    }
}
