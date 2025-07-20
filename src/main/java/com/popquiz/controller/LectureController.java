package com.popquiz.controller;

import com.popquiz.model.Content;
import com.popquiz.model.Lecture;
import com.popquiz.model.User;
import com.popquiz.model.CreateLectureRequest;
import com.popquiz.repository.LectureRepository;
import com.popquiz.repository.UserRepository;
import com.popquiz.service.ContentProcessingService;
import com.popquiz.service.LectureService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class LectureController {

    private final LectureService lectureService;
    private final ContentProcessingService contentProcessingService;
    private final UserRepository userRepository;
    private final LectureRepository lectureRepository;

    public LectureController(
            LectureService lectureService,
            ContentProcessingService contentProcessingService,
            UserRepository userRepository,
            LectureRepository lectureRepository) {
        this.lectureService = lectureService;
        this.contentProcessingService = contentProcessingService;
        this.userRepository = userRepository;
        this.lectureRepository = lectureRepository;
    }

    // 组织者相关API
    
    @GetMapping("/organizer/lectures")
    public ResponseEntity<List<Lecture>> getOrganizerLectures(Principal principal) {
        // 暂时移除认证检查，直接返回所有讲座
        // List<Lecture> lectures = lectureService.getLecturesByOrganizer(principal.getName());
        List<Lecture> lectures = lectureRepository.findAll();
        return ResponseEntity.ok(lectures);
    }
    
    @PostMapping("/organizer/lectures")
    public ResponseEntity<?> createLecture(@RequestBody CreateLectureRequest request, Principal principal) {
        Lecture savedLecture = lectureService.createLecture(request, principal.getName());
        return ResponseEntity.ok(savedLecture);
    }
    
    @PutMapping("/organizer/lectures/{lectureId}")
    public ResponseEntity<?> updateLecture(
            @PathVariable Long lectureId,
            @RequestBody UpdateLectureRequest request,
            Principal principal) {
        User organizer = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));
        
        // 检查权限
        if (!lecture.getOrganizer().getId().equals(organizer.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "无权修改此讲座"));
        }
        
        // 更新讲座
        if (request.getTitle() != null) {
            lecture.setTitle(request.getTitle());
        }
        
        if (request.getDescription() != null) {
            lecture.setDescription(request.getDescription());
        }
        
        if (request.getScheduledTime() != null) {
            lecture.setScheduledTime(request.getScheduledTime());
        }
        
        if (request.getQuizInterval() != null) {
            lecture.setQuizInterval(request.getQuizInterval());
        }
        
        if (request.getPresenterId() != null) {
            User presenter = userRepository.findById(request.getPresenterId())
                    .orElseThrow(() -> new RuntimeException("演讲者不存在"));
            lecture.setPresenter(presenter);
        }
        
        Lecture updatedLecture = lectureRepository.save(lecture);
        return ResponseEntity.ok(updatedLecture);
    }
    
    // 演讲者相关API
    
    @GetMapping("/presenter/lectures")
    public ResponseEntity<List<Lecture>> getPresenterLectures(Principal principal) {
        User presenter = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        List<Lecture> lectures = lectureRepository.findByPresenter(presenter);
        return ResponseEntity.ok(lectures);
    }
    
    @PostMapping("/presenter/lectures/{lectureId}/start")
    public ResponseEntity<?> startLecture(@PathVariable Long lectureId, Principal principal) {
        User presenter = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));
        
        // 检查权限
        if (!lecture.getPresenter().getId().equals(presenter.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "无权开始此讲座"));
        }
        
        // 开始讲座
        lecture.setStatus(Lecture.LectureStatus.LIVE);
        lecture.setStartTime(LocalDateTime.now());
        
        Lecture updatedLecture = lectureRepository.save(lecture);
        return ResponseEntity.ok(updatedLecture);
    }
    
    @PostMapping("/presenter/lectures/{lectureId}/end")
    public ResponseEntity<?> endLecture(@PathVariable Long lectureId, Principal principal) {
        User presenter = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));
        
        // 检查权限
        if (!lecture.getPresenter().getId().equals(presenter.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "无权结束此讲座"));
        }
        
        // 结束讲座
        lecture.setStatus(Lecture.LectureStatus.COMPLETED);
        lecture.setEndTime(LocalDateTime.now());
        
        Lecture updatedLecture = lectureRepository.save(lecture);
        return ResponseEntity.ok(updatedLecture);
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
            
            // 检查权限
            if (!lecture.getPresenter().getId().equals(presenter.getId()) && 
                !lecture.getOrganizer().getId().equals(presenter.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "无权上传内容"));
            }
            
            // 处理上传
            Content content = contentProcessingService.processContentUpload(file, lecture);
            return ResponseEntity.ok(Map.of("contentId", content.getId(), "message", "文件上传成功，处理中"));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "上传失败: " + e.getMessage()));
        }
    }
    
    // 听众相关API
    
    @PostMapping("/audience/lectures/join")
    public ResponseEntity<?> joinLecture(@RequestBody JoinLectureRequest request, Principal principal) {
        try {
            Lecture updatedLecture = lectureService.joinLecture(principal.getName(), request.getAccessCode());
            return ResponseEntity.ok(updatedLecture);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
    
    @GetMapping("/audience/lectures")
    public ResponseEntity<List<Lecture>> getAudienceLectures(Principal principal) {
        User audience = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        List<Lecture> lectures = lectureRepository.findByAudience(audience);
        return ResponseEntity.ok(lectures);
    }
    
    // 公共API
    
    @GetMapping("/public/lectures/{lectureId}")
    public ResponseEntity<?> getLectureDetails(@PathVariable Long lectureId) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));
        
        return ResponseEntity.ok(lecture);
    }
    
    // 辅助方法
    
    private String generateAccessCode() {
        // 生成6位随机访问代码
        return String.format("%06d", (int)(Math.random() * 1000000));
    }
    
    // 请求DTO类
    
    // 删除此处的CreateLectureRequest内部类，避免与com.popquiz.model.CreateLectureRequest冲突
    
    public static class UpdateLectureRequest {
        private String title;
        private String description;
        private LocalDateTime scheduledTime;
        private Long presenterId;
        private Integer quizInterval;
        
        // getter and setter
        
        public String getTitle() {
            return title;
        }
        
        public void setTitle(String title) {
            this.title = title;
        }
        
        public String getDescription() {
            return description;
        }
        
        public void setDescription(String description) {
            this.description = description;
        }
        
        public LocalDateTime getScheduledTime() {
            return scheduledTime;
        }
        
        public void setScheduledTime(LocalDateTime scheduledTime) {
            this.scheduledTime = scheduledTime;
        }
        
        public Long getPresenterId() {
            return presenterId;
        }
        
        public void setPresenterId(Long presenterId) {
            this.presenterId = presenterId;
        }
        
        public Integer getQuizInterval() {
            return quizInterval;
        }
        
        public void setQuizInterval(Integer quizInterval) {
            this.quizInterval = quizInterval;
        }
    }
    
    public static class JoinLectureRequest {
        private String accessCode;
        
        // getter and setter
        
        public String getAccessCode() {
            return accessCode;
        }
        
        public void setAccessCode(String accessCode) {
            this.accessCode = accessCode;
        }
    }
} 