package com.popquiz.controller;

import com.popquiz.dto.LectureDto;
import com.popquiz.dto.QuizDto;
import com.popquiz.mapper.LectureMapper;
import com.popquiz.mapper.QuizMapper;
import com.popquiz.model.Content;
import com.popquiz.model.Lecture;
import com.popquiz.model.Quiz;
import com.popquiz.model.User;
import com.popquiz.model.CreateLectureRequest;
import com.popquiz.repository.LectureRepository;
import com.popquiz.repository.UserRepository;
import com.popquiz.repository.QuizRepository;
import com.popquiz.service.ContentProcessingService;
import com.popquiz.service.LectureService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LectureController {

    private final LectureService lectureService;
    private final ContentProcessingService contentProcessingService;
    private final UserRepository userRepository;
    private final LectureRepository lectureRepository;
    private final QuizRepository quizRepository;

    public LectureController(
            LectureService lectureService,
            ContentProcessingService contentProcessingService,
            UserRepository userRepository,
            LectureRepository lectureRepository,
            QuizRepository quizRepository) {
        this.lectureService = lectureService;
        this.contentProcessingService = contentProcessingService;
        this.userRepository = userRepository;
        this.lectureRepository = lectureRepository;
        this.quizRepository = quizRepository;
    }

    @GetMapping("/organizer/lectures")
    public ResponseEntity<List<LectureDto>> getOrganizerLectures(Principal principal) {
        List<Lecture> lectures = lectureService.getLecturesByOrganizer(principal.getName());
        return ResponseEntity.ok(LectureMapper.toDtoList(lectures));
    }

    @PostMapping("/organizer/lectures")
    public ResponseEntity<LectureDto> createLecture(@RequestBody CreateLectureRequest request, Principal principal) {
        Lecture savedLecture = lectureService.createLecture(request, principal.getName());
        return ResponseEntity.ok(LectureMapper.toDto(savedLecture));
    }

    @PutMapping("/organizer/lectures/{lectureId}")
    public ResponseEntity<LectureDto> updateLecture(
            @PathVariable Long lectureId,
            @RequestBody UpdateLectureRequest request,
            Principal principal) {
        User organizer = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));

        if (!lecture.getOrganizer().getId().equals(organizer.getId())) {
            return ResponseEntity.status(403).build();
        }

        if (request.getTitle() != null) lecture.setTitle(request.getTitle());
        if (request.getDescription() != null) lecture.setDescription(request.getDescription());
        if (request.getScheduledTime() != null) lecture.setScheduledTime(request.getScheduledTime());
        if (request.getQuizInterval() != null) lecture.setQuizInterval(request.getQuizInterval());
        if (request.getPresenterId() != null) {
            User presenter = userRepository.findById(request.getPresenterId())
                    .orElseThrow(() -> new RuntimeException("演讲者不存在"));
            lecture.setPresenter(presenter);
        }

        Lecture updatedLecture = lectureRepository.save(lecture);
        return ResponseEntity.ok(LectureMapper.toDto(updatedLecture));
    }

    @GetMapping("/presenter/lectures")
    public ResponseEntity<List<LectureDto>> getPresenterLectures(Principal principal) {
        User presenter = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        List<Lecture> lectures = lectureRepository.findByPresenter(presenter);
        return ResponseEntity.ok(LectureMapper.toDtoList(lectures));
    }

    @PostMapping("/presenter/lectures/{lectureId}/start")
    public ResponseEntity<LectureDto> startLecture(@PathVariable Long lectureId, Principal principal) {
        User presenter = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));

        if (!lecture.getPresenter().getId().equals(presenter.getId())) {
            return ResponseEntity.status(403).build();
        }

        lecture.setStatus(Lecture.LectureStatus.LIVE);
        lecture.setStartTime(LocalDateTime.now());

        Lecture updatedLecture = lectureRepository.save(lecture);
        return ResponseEntity.ok(LectureMapper.toDto(updatedLecture));
    }

    @PostMapping("/presenter/lectures/{lectureId}/end")
    public ResponseEntity<LectureDto> endLecture(@PathVariable Long lectureId, Principal principal) {
        User presenter = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));

        if (!lecture.getPresenter().getId().equals(presenter.getId())) {
            return ResponseEntity.status(403).build();
        }

        lecture.setStatus(Lecture.LectureStatus.COMPLETED);
        lecture.setEndTime(LocalDateTime.now());

        Lecture updatedLecture = lectureRepository.save(lecture);
        return ResponseEntity.ok(LectureMapper.toDto(updatedLecture));
    }

    @PostMapping("/presenter/lectures/{lectureId}/content")
    public ResponseEntity<?> uploadContent(
            @PathVariable Long lectureId,
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        try {
            User presenter = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));

            Lecture lecture = lectureRepository.findById(lectureId)
                    .orElseThrow(() -> new RuntimeException("讲座不存在"));

            if (!lecture.getPresenter().getId().equals(presenter.getId()) &&
                    !lecture.getOrganizer().getId().equals(presenter.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "无权上传内容"));
            }

            Content content = contentProcessingService.processContentUpload(file, lecture);
            return ResponseEntity.ok(Map.of("contentId", content.getId(), "message", "文件上传成功，处理中"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "上传失败: " + e.getMessage()));
        }
    }

    @GetMapping("/lectures/{lectureId}/contents")
    public ResponseEntity<List<Content>> getLectureContents(@PathVariable Long lectureId) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));
        List<Content> contents = lecture.getContents();
        return ResponseEntity.ok(contents);
    }

    @GetMapping("/lectures/{lectureId}/quizzes")
    public ResponseEntity<List<QuizDto>> getLectureQuizzes(@PathVariable Long lectureId) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));
        List<Quiz> quizzes = quizRepository.findByLecture(lecture);
        return ResponseEntity.ok(QuizMapper.toDtoList(quizzes));
    }

    @PostMapping("/audience/lectures/join")
    public ResponseEntity<LectureDto> joinLecture(@RequestBody JoinLectureRequest request, Principal principal) {
        Lecture updatedLecture = lectureService.joinLecture(principal.getName(), request.getAccessCode());
        return ResponseEntity.ok(LectureMapper.toDto(updatedLecture));
    }

    @GetMapping("/audience/lectures")
    public ResponseEntity<List<LectureDto>> getAudienceLectures(Principal principal) {
        User audience = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        List<Lecture> lectures = lectureRepository.findByAudience(audience);
        return ResponseEntity.ok(LectureMapper.toDtoList(lectures));
    }

    @GetMapping("/lectures/{lectureId}")
    public ResponseEntity<LectureDto> getLectureDetails(@PathVariable Long lectureId) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));
        return ResponseEntity.ok(LectureMapper.toDto(lecture));
    }

    public static class UpdateLectureRequest {
        private String title;
        private String description;
        private LocalDateTime scheduledTime;
        private Long presenterId;
        private Integer quizInterval;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public LocalDateTime getScheduledTime() { return scheduledTime; }
        public void setScheduledTime(LocalDateTime scheduledTime) { this.scheduledTime = scheduledTime; }
        public Long getPresenterId() { return presenterId; }
        public void setPresenterId(Long presenterId) { this.presenterId = presenterId; }
        public Integer getQuizInterval() { return quizInterval; }
        public void setQuizInterval(Integer quizInterval) { this.quizInterval = quizInterval; }
    }

    public static class JoinLectureRequest {
        private String accessCode;
        public String getAccessCode() { return accessCode; }
        public void setAccessCode(String accessCode) { this.accessCode = accessCode; }
    }
}
