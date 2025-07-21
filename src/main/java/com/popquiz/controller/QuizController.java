package com.popquiz.controller;

import com.popquiz.model.*;
import com.popquiz.repository.LectureRepository;
import com.popquiz.repository.QuestionRepository;
import com.popquiz.repository.QuizRepository;
import com.popquiz.repository.UserRepository;
import com.popquiz.service.NotificationService;
import com.popquiz.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;

@RestController
@RequestMapping("/api")
public class QuizController {

    private final QuizService quizService;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final LectureRepository lectureRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public QuizController(
            QuizService quizService,
            QuizRepository quizRepository,
            QuestionRepository questionRepository,
            LectureRepository lectureRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.quizService = quizService;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.lectureRepository = lectureRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // 演讲者相关API

    @PostMapping("/presenter/lectures/{lectureId}/quizzes")
    public ResponseEntity<?> createQuiz(
            @PathVariable Long lectureId,
            @RequestBody CreateQuizRequest request,
            Principal principal) {
        try {
            User presenter = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));

            Lecture lecture = lectureRepository.findById(lectureId)
                    .orElseThrow(() -> new RuntimeException("讲座不存在"));

            // 检查权限
            if (!lecture.getPresenter().getId().equals(presenter.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "无权为此讲座创建测验"));
            }

            // 创建测验
            Quiz quiz = quizService.createQuizForLecture(
                    lectureId,
                    request.getTitle(),
                    request.getQuestionCount(),
                    request.getDifficultyLevel());

            return ResponseEntity.ok(quiz);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/presenter/quizzes/{quizId}/publish")
    public ResponseEntity<?> publishQuiz(
            @PathVariable Long quizId,
            @RequestBody PublishQuizRequest request,
            Principal principal) {
        try {
            Quiz quiz = quizRepository.findById(quizId)
                    .orElseThrow(() -> new RuntimeException("测验不存在"));

            User presenter = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));

            // 检查权限
            if (!quiz.getLecture().getPresenter().getId().equals(presenter.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "无权发布此测验"));
            }

            // 发布测验
            Quiz publishedQuiz = quizService.publishQuiz(quizId, request.getTimeLimit());
            return ResponseEntity.ok(publishedQuiz);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/presenter/quizzes/{quizId}/activate")
    public ResponseEntity<?> activateQuiz(@PathVariable Long quizId, Principal principal) {
        try {
            Quiz quiz = quizRepository.findById(quizId)
                    .orElseThrow(() -> new RuntimeException("测验不存在"));

            User presenter = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));

            // 检查权限
            if (!quiz.getLecture().getPresenter().getId().equals(presenter.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "无权激活此测验"));
            }

            // 激活测验
            Quiz activatedQuiz = quizService.activateQuiz(quizId);
            return ResponseEntity.ok(activatedQuiz);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/presenter/lectures/{lectureId}/quizzes")
    public ResponseEntity<?> getLectureQuizzes(@PathVariable Long lectureId, Principal principal) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));

        User presenter = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        // 检查权限
        if (!lecture.getPresenter().getId().equals(presenter.getId()) && 
            !lecture.getOrganizer().getId().equals(presenter.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "无权查看此讲座的测验"));
        }

        List<Quiz> quizzes = quizRepository.findByLectureOrderBySequenceNumberAsc(lecture);
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/presenter/quizzes/{quizId}/statistics")
    public ResponseEntity<?> getQuizStatistics(@PathVariable Long quizId, Principal principal) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("测验不存在"));

        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        // 检查权限
        if (!quiz.getLecture().getPresenter().getId().equals(user.getId()) && 
            !quiz.getLecture().getOrganizer().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "无权查看此测验的统计信息"));
        }

        QuizService.QuizStatistics statistics = quizService.getQuizStatistics(quizId);
        return ResponseEntity.ok(statistics);
    }

    // 听众相关API

    @GetMapping("/audience/lectures/{lectureId}/quizzes")
    public ResponseEntity<?> getAudienceQuizzes(@PathVariable Long lectureId, Principal principal) {
        try {
            // 检查认证
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("message", "需要登录"));
            }

            Lecture lecture = lectureRepository.findById(lectureId)
                    .orElseThrow(() -> new RuntimeException("讲座不存在"));

            User audience = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));

            // 检查是否是此讲座的听众
            if (!lecture.getAudience().contains(audience)) {
                return ResponseEntity.status(403).body(Map.of("message", "您不是此讲座的听众"));
            }

            // 只返回已发布或活跃的测验
            List<Quiz> quizzes = quizRepository.findByLectureOrderBySequenceNumberAsc(lecture).stream()
                    .filter(q -> q.getStatus() == Quiz.QuizStatus.PUBLISHED || q.getStatus() == Quiz.QuizStatus.ACTIVE)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(quizzes);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "服务器内部错误: " + e.getMessage()));
        }
    }

    @GetMapping("/audience/quizzes/{quizId}")
    public ResponseEntity<?> getQuizDetails(@PathVariable Long quizId, Principal principal) {
        try {
            // 检查认证
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("message", "需要登录"));
            }

            Quiz quiz = quizRepository.findById(quizId)
                    .orElseThrow(() -> new RuntimeException("测验不存在"));

            User audience = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));

            // 检查是否是此讲座的听众
            if (!quiz.getLecture().getAudience().contains(audience)) {
                return ResponseEntity.status(403).body(Map.of("message", "您不是此讲座的听众"));
            }

            // 只返回活跃的测验的问题
            if (quiz.getStatus() != Quiz.QuizStatus.ACTIVE) {
                return ResponseEntity.badRequest().body(Map.of("message", "测验不在进行中"));
            }

            // 获取问题及选项，但不包含正确答案信息
            List<Question> questions = questionRepository.findByQuizOrderBySequenceNumberAsc(quiz);
            
            // 构建没有正确答案信息的响应
            QuizDetailsResponse response = new QuizDetailsResponse();
            response.setQuizId(quiz.getId());
            response.setTitle(quiz.getTitle());
            response.setTimeLimit(quiz.getTimeLimit());
            response.setExpiresAt(quiz.getExpiresAt());
            
            response.setQuestions(questions.stream().map(q -> {
                QuestionDto questionDto = new QuestionDto();
                questionDto.setId(q.getId());
                questionDto.setContent(q.getContent());
                questionDto.setType(q.getType().name());
                questionDto.setSequenceNumber(q.getSequenceNumber());
                
                // 隐藏正确答案
                questionDto.setOptions(q.getOptions().stream().map(o -> {
                    OptionDto optionDto = new OptionDto();
                    optionDto.setId(o.getId());
                    optionDto.setContent(o.getContent());
                    optionDto.setLabel(o.getOptionLabel());
                    // 不设置isCorrect字段
                    return optionDto;
                }).collect(Collectors.toList()));
                
                return questionDto;
            }).collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "服务器内部错误: " + e.getMessage()));
        }
    }

    @PostMapping("/audience/questions/{questionId}/answer")
    public ResponseEntity<?> submitAnswer(
            @PathVariable Long questionId,
            @RequestBody AnswerRequest request,
            Principal principal) {
        try {
            User audience = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));

            // 提交答案
            UserResponse response = quizService.submitAnswer(
                    audience.getId(),
                    questionId,
                    request.getOptionIds(),
                    request.getTextResponse(),
                    request.getResponseTimeMs());

            return ResponseEntity.ok(Map.of("correct", response.getCorrect()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 批量提交测验答案
    @PostMapping("/audience/quizzes/{quizId}/submit")
    public ResponseEntity<?> submitQuizAnswers(
            @PathVariable Long quizId,
            @RequestBody QuizSubmitRequest request,
            Principal principal) {
        try {
            User audience = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));

            Quiz quiz = quizRepository.findById(quizId)
                    .orElseThrow(() -> new RuntimeException("测验不存在"));

            // 检查是否是此讲座的听众
            if (!quiz.getLecture().getAudience().contains(audience)) {
                return ResponseEntity.status(403).body(Map.of("message", "您不是此讲座的听众"));
            }

            // 批量提交答案
            List<UserResponse> responses = quizService.submitQuizAnswers(
                    audience.getId(),
                    quizId,
                    request.getResponses());

            return ResponseEntity.ok(Map.of(
                "message", "测验提交成功",
                "submittedCount", responses.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 获取用户测验结果详情
    @GetMapping("/audience/quizzes/{quizId}/user-results")
    public ResponseEntity<?> getUserQuizResults(@PathVariable Long quizId, Principal principal) {
        try {
            User audience = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));

            Quiz quiz = quizRepository.findById(quizId)
                    .orElseThrow(() -> new RuntimeException("测验不存在"));

            // 检查是否是此讲座的听众
            if (!quiz.getLecture().getAudience().contains(audience)) {
                return ResponseEntity.status(403).body(Map.of("message", "您不是此讲座的听众"));
            }

            // 获取用户答题详情
            List<UserResponse> responses = quizService.getUserQuizResponses(audience.getId(), quizId);
            
            return ResponseEntity.ok(responses.stream().map(response -> {
                Map<String, Object> result = new HashMap<>();
                result.put("questionId", response.getQuestion().getId());
                result.put("questionContent", response.getQuestion().getContent());
                result.put("correct", response.getCorrect());
                result.put("responseTimeMs", response.getResponseTimeMs());
                result.put("submittedAt", response.getSubmittedAt());
                
                if (response.getTextResponse() != null) {
                    result.put("textResponse", response.getTextResponse());
                }
                
                if (!response.getSelectedOptions().isEmpty()) {
                    result.put("selectedOptions", response.getSelectedOptions().stream()
                            .map(option -> Map.of(
                                "id", option.getId(),
                                "content", option.getContent(),
                                "label", option.getOptionLabel()
                            ))
                            .collect(Collectors.toList()));
                }
                
                return result;
            }).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 获取用户测验统计信息
    @GetMapping("/audience/quizzes/{quizId}/user-stats")
    public ResponseEntity<?> getUserQuizStats(@PathVariable Long quizId, Principal principal) {
        try {
            User audience = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));

            Quiz quiz = quizRepository.findById(quizId)
                    .orElseThrow(() -> new RuntimeException("测验不存在"));

            // 检查是否是此讲座的听众
            if (!quiz.getLecture().getAudience().contains(audience)) {
                return ResponseEntity.status(403).body(Map.of("message", "您不是此讲座的听众"));
            }

            // 获取用户统计信息
            Map<String, Object> stats = quizService.getUserQuizDetailedStats(audience.getId(), quizId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 获取测验整体统计信息
    @GetMapping("/audience/quizzes/{quizId}/stats")
    public ResponseEntity<?> getQuizStats(@PathVariable Long quizId, Principal principal) {
        try {
            User audience = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("用户不存在"));

            Quiz quiz = quizRepository.findById(quizId)
                    .orElseThrow(() -> new RuntimeException("测验不存在"));

            // 检查是否是此讲座的听众
            if (!quiz.getLecture().getAudience().contains(audience)) {
                return ResponseEntity.status(403).body(Map.of("message", "您不是此讲座的听众"));
            }

            // 获取测验整体统计信息
            Map<String, Object> stats = quizService.getQuizDetailedStats(quizId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/audience/quizzes/{quizId}/statistics")
    public ResponseEntity<?> getUserQuizStatistics(@PathVariable Long quizId, Principal principal) {
        User audience = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("测验不存在"));

        // 检查测验是否已结束
        if (quiz.getStatus() != Quiz.QuizStatus.EXPIRED && quiz.getStatus() != Quiz.QuizStatus.CANCELLED) {
            return ResponseEntity.badRequest().body(Map.of("message", "测验尚未结束"));
        }

        QuizService.UserQuizStatistics statistics = quizService.getUserQuizStatistics(audience.getId(), quizId);
        return ResponseEntity.ok(statistics);
    }

    // 请求和响应DTO类

    public static class CreateQuizRequest {
        private String title;
        private Integer questionCount;
        private Integer difficultyLevel;
        
        // getter and setter
        
        public String getTitle() {
            return title;
        }
        
        public void setTitle(String title) {
            this.title = title;
        }
        
        public Integer getQuestionCount() {
            return questionCount;
        }
        
        public void setQuestionCount(Integer questionCount) {
            this.questionCount = questionCount;
        }
        
        public Integer getDifficultyLevel() {
            return difficultyLevel;
        }
        
        public void setDifficultyLevel(Integer difficultyLevel) {
            this.difficultyLevel = difficultyLevel;
        }
    }
    
    public static class PublishQuizRequest {
        private Integer timeLimit;
        
        // getter and setter
        
        public Integer getTimeLimit() {
            return timeLimit;
        }
        
        public void setTimeLimit(Integer timeLimit) {
            this.timeLimit = timeLimit;
        }
    }
    
    public static class AnswerRequest {
        private List<Long> optionIds;
        private String textResponse;
        private Long responseTimeMs;
        
        // getter and setter
        
        public List<Long> getOptionIds() {
            return optionIds;
        }
        
        public void setOptionIds(List<Long> optionIds) {
            this.optionIds = optionIds;
        }
        
        public String getTextResponse() {
            return textResponse;
        }
        
        public void setTextResponse(String textResponse) {
            this.textResponse = textResponse;
        }
        
        public Long getResponseTimeMs() {
            return responseTimeMs;
        }
        
        public void setResponseTimeMs(Long responseTimeMs) {
            this.responseTimeMs = responseTimeMs;
        }
    }
    
    public static class QuizDetailsResponse {
        private Long quizId;
        private String title;
        private Integer timeLimit;
        private java.time.LocalDateTime expiresAt;
        private List<QuestionDto> questions;
        
        // getter and setter
        
        public Long getQuizId() {
            return quizId;
        }
        
        public void setQuizId(Long quizId) {
            this.quizId = quizId;
        }
        
        public String getTitle() {
            return title;
        }
        
        public void setTitle(String title) {
            this.title = title;
        }
        
        public Integer getTimeLimit() {
            return timeLimit;
        }
        
        public void setTimeLimit(Integer timeLimit) {
            this.timeLimit = timeLimit;
        }
        
        public java.time.LocalDateTime getExpiresAt() {
            return expiresAt;
        }
        
        public void setExpiresAt(java.time.LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
        }
        
        public List<QuestionDto> getQuestions() {
            return questions;
        }
        
        public void setQuestions(List<QuestionDto> questions) {
            this.questions = questions;
        }
    }
    
    public static class QuestionDto {
        private Long id;
        private String content;
        private String type;
        private Integer sequenceNumber;
        private List<OptionDto> options;
        
        // getter and setter
        
        public Long getId() {
            return id;
        }
        
        public void setId(Long id) {
            this.id = id;
        }
        
        public String getContent() {
            return content;
        }
        
        public void setContent(String content) {
            this.content = content;
        }
        
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
        }
        
        public Integer getSequenceNumber() {
            return sequenceNumber;
        }
        
        public void setSequenceNumber(Integer sequenceNumber) {
            this.sequenceNumber = sequenceNumber;
        }
        
        public List<OptionDto> getOptions() {
            return options;
        }
        
        public void setOptions(List<OptionDto> options) {
            this.options = options;
        }
    }
    
    public static class OptionDto {
        private Long id;
        private String content;
        private char label;
        
        // getter and setter
        
        public Long getId() {
            return id;
        }
        
        public void setId(Long id) {
            this.id = id;
        }
        
        public String getContent() {
            return content;
        }
        
        public void setContent(String content) {
            this.content = content;
        }
        
        public char getLabel() {
            return label;
        }
        
        public void setLabel(char label) {
            this.label = label;
        }
    }

    public static class QuizSubmitRequest {
        private List<QuizResponse> responses;
        
        public List<QuizResponse> getResponses() {
            return responses;
        }
        
        public void setResponses(List<QuizResponse> responses) {
            this.responses = responses;
        }
    }
    
    public static class QuizResponse {
        private Long questionId;
        private Long selectedOptionId;
        private List<Long> selectedOptionIds;
        private String textResponse;
        private Long responseTimeMs;
        
        public Long getQuestionId() {
            return questionId;
        }
        
        public void setQuestionId(Long questionId) {
            this.questionId = questionId;
        }
        
        public Long getSelectedOptionId() {
            return selectedOptionId;
        }
        
        public void setSelectedOptionId(Long selectedOptionId) {
            this.selectedOptionId = selectedOptionId;
        }
        
        public List<Long> getSelectedOptionIds() {
            return selectedOptionIds;
        }
        
        public void setSelectedOptionIds(List<Long> selectedOptionIds) {
            this.selectedOptionIds = selectedOptionIds;
        }
        
        public String getTextResponse() {
            return textResponse;
        }
        
        public void setTextResponse(String textResponse) {
            this.textResponse = textResponse;
        }
        
        public Long getResponseTimeMs() {
            return responseTimeMs;
        }
        
        public void setResponseTimeMs(Long responseTimeMs) {
            this.responseTimeMs = responseTimeMs;
        }
    }
} 