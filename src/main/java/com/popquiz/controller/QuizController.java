package com.popquiz.controller;

import com.popquiz.ai.QuizQuestion;
import com.popquiz.dto.QuizDto;
import com.popquiz.mapper.QuizMapper;
import com.popquiz.model.Lecture;
import com.popquiz.model.Question;
import com.popquiz.model.Quiz;
import com.popquiz.model.User;
import com.popquiz.model.UserResponse;
import com.popquiz.repository.LectureRepository;
import com.popquiz.repository.QuestionRepository;
import com.popquiz.repository.QuizRepository;
import com.popquiz.repository.UserRepository;
import com.popquiz.service.NotificationService;
import com.popquiz.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    // ========== 1. AI 预览出题 ==========
    @PostMapping("/lectures/{lectureId}/generate-quiz")
    public ResponseEntity<?> previewGeneratedQuestions(
            @PathVariable Long lectureId,
            @RequestParam int questionCount,
            @RequestParam int optionCount,
            @RequestParam int difficultyLevel,
            Principal principal
    ) {
        try {
            List<QuizQuestion> preview =
                    quizService.generateQuizQuestions(lectureId, questionCount, optionCount, difficultyLevel);
            return ResponseEntity.ok(preview);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // ========== 2. 主讲人：创建测验 ==========
    @PostMapping("/presenter/lectures/{lectureId}/quizzes")
    public ResponseEntity<QuizDto> createQuiz(
            @PathVariable Long lectureId,
            @RequestBody CreateQuizRequest req,
            Principal principal
    ) {
        Quiz quiz = quizService.createQuizForLecture(
                lectureId, req.getTitle(), req.getQuestionCount(), req.getDifficultyLevel());
        return ResponseEntity.ok(QuizMapper.toDto(quiz));
    }

    public static class CreateQuizRequest {
        private String title;
        private Integer questionCount;
        private Integer difficultyLevel;

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

    // ========== 3. 主讲人：发布测验 ==========
    @PostMapping("/presenter/quizzes/{quizId}/publish")
    public ResponseEntity<QuizDto> publishQuiz(
            @PathVariable Long quizId,
            @RequestBody PublishQuizRequest req,
            Principal principal
    ) {
        Quiz quiz = quizService.publishQuiz(quizId, req.getTimeLimit());
        return ResponseEntity.ok(QuizMapper.toDto(quiz));
    }

    public static class PublishQuizRequest {
        private Integer timeLimit;

        public Integer getTimeLimit() {
            return timeLimit;
        }
        public void setTimeLimit(Integer timeLimit) {
            this.timeLimit = timeLimit;
        }
    }

    // ========== 4. 主讲人：激活测验 ==========
    @PostMapping("/presenter/quizzes/{quizId}/activate")
    public ResponseEntity<QuizDto> activateQuiz(
            @PathVariable Long quizId,
            Principal principal
    ) {
        Quiz quiz = quizService.activateQuiz(quizId);
        return ResponseEntity.ok(QuizMapper.toDto(quiz));
    }

    // ========== 5. 主讲人：查看本讲座所有测验 ==========
    @GetMapping("/presenter/lectures/{lectureId}/quizzes")
    public ResponseEntity<List<QuizDto>> listPresenterQuizzes(
            @PathVariable Long lectureId,
            Principal principal
    ) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));
        List<Quiz> quizzes = quizRepository.findByLectureOrderBySequenceNumberAsc(lecture);
        return ResponseEntity.ok(QuizMapper.toDtoList(quizzes));
    }

    // ========== 6. 主讲人：查看测验统计 ==========
    @GetMapping("/presenter/quizzes/{quizId}/statistics")
    public ResponseEntity<QuizService.QuizStatistics> getQuizStatistics(
            @PathVariable Long quizId,
            Principal principal
    ) {
        QuizService.QuizStatistics stats = quizService.getQuizStatistics(quizId);
        return ResponseEntity.ok(stats);
    }

    // ========== 7. 听众：查看可参加的测验列表 ==========
    @GetMapping("/audience/lectures/{lectureId}/quizzes")
    public ResponseEntity<List<QuizDto>> listAudienceQuizzes(
            @PathVariable Long lectureId,
            Principal principal
    ) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));
        List<Quiz> quizzes = quizRepository.findByLectureOrderBySequenceNumberAsc(lecture).stream()
                .filter(q -> q.getStatus() == Quiz.QuizStatus.PUBLISHED
                        || q.getStatus() == Quiz.QuizStatus.ACTIVE)
                .collect(Collectors.toList());
        return ResponseEntity.ok(QuizMapper.toDtoList(quizzes));
    }

    // ========== 8. 听众：获取某个测验详细（带题目） ==========
    @GetMapping("/audience/quizzes/{quizId}")
    public ResponseEntity<QuizDetailsResponse> getQuizDetails(
            @PathVariable Long quizId,
            Principal principal
    ) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("测验不存在"));
        if (quiz.getStatus() != Quiz.QuizStatus.ACTIVE) {
            return ResponseEntity.badRequest().body(null);
        }
        List<Question> questions = questionRepository.findByQuizOrderBySequenceNumberAsc(quiz);

        QuizDetailsResponse resp = new QuizDetailsResponse();
        resp.setQuizId(quiz.getId());
        resp.setTitle(quiz.getTitle());
        resp.setTimeLimit(quiz.getTimeLimit());
        resp.setExpiresAt(quiz.getExpiresAt());
        resp.setQuestions(questions.stream().map(q -> {
            QuestionDto d = new QuestionDto();
            d.setId(q.getId());
            d.setContent(q.getContent());
            d.setType(q.getType().name());
            d.setSequenceNumber(q.getSequenceNumber());
            d.setOptions(q.getOptions().stream().map(o -> {
                OptionDto od = new OptionDto();
                od.setId(o.getId());
                od.setContent(o.getContent());
                od.setLabel(o.getOptionLabel());
                return od;
            }).collect(Collectors.toList()));
            return d;
        }).collect(Collectors.toList()));
        return ResponseEntity.ok(resp);
    }

    public static class QuizDetailsResponse {
        private Long quizId;
        private String title;
        private Integer timeLimit;
        private LocalDateTime expiresAt;
        private List<QuestionDto> questions;

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
        public LocalDateTime getExpiresAt() {
            return expiresAt;
        }
        public void setExpiresAt(LocalDateTime expiresAt) {
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

    // ========== 9. 听众：提交答案 ==========
    @PostMapping("/audience/questions/{questionId}/answer")
    public ResponseEntity<?> submitAnswer(
            @PathVariable Long questionId,
            @RequestBody AnswerRequest req,
            Principal principal
    ) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        UserResponse r = quizService.submitAnswer(
                user.getId(),
                questionId,
                req.getOptionIds(),
                req.getTextResponse(),
                req.getResponseTimeMs());
        return ResponseEntity.ok(Map.of("correct", r.getCorrect()));
    }

    public static class AnswerRequest {
        private List<Long> optionIds;
        private String textResponse;
        private Long responseTimeMs;

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

    // ========== 10. 听众：获取个人测验统计 ==========
    @GetMapping("/audience/quizzes/{quizId}/statistics")
    public ResponseEntity<?> getUserStats(
            @PathVariable Long quizId,
            Principal principal
    ) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("测验不存在"));
        QuizService.UserQuizStatistics stats = quizService.getUserQuizStatistics(user.getId(), quizId);
        return ResponseEntity.ok(stats);
    }
}
