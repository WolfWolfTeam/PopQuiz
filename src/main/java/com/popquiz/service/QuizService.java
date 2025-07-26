package com.popquiz.service;

import com.popquiz.ai.HuggingFaceService;
import com.popquiz.ai.QuizOption;
import com.popquiz.ai.QuizQuestion;
import com.popquiz.model.*;
import com.popquiz.repository.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 测验服务
 * 处理测验的创建、发布、激活、答题、统计等功能
 */
@Service
public class QuizService {

    private final HuggingFaceService huggingFaceService;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final ContentRepository contentRepository;
    private final LectureRepository lectureRepository;
    private final UserResponseRepository userResponseRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public QuizService(
            HuggingFaceService huggingFaceService,
            QuizRepository quizRepository,
            QuestionRepository questionRepository,
            ContentRepository contentRepository,
            LectureRepository lectureRepository,
            UserResponseRepository userResponseRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.huggingFaceService = huggingFaceService;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.contentRepository = contentRepository;
        this.lectureRepository = lectureRepository;
        this.userResponseRepository = userResponseRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    /**
     * 只生成AI测验题目（用于预览，不入库，适配 /api/lectures/{lectureId}/generate-quiz）
     */
    public List<QuizQuestion> generateQuizQuestions(Long lectureId, int questionCount, int optionCount, int difficultyLevel) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));
        List<Content> contents = contentRepository.findByLectureAndProcessStatus(lecture, Content.ProcessStatus.COMPLETED);
        if (contents.isEmpty()) {
            throw new RuntimeException("讲座没有可用的已处理内容");
        }
        String combinedText = contents.stream()
                .map(Content::getExtractedText)
                .filter(t -> t != null && !t.isBlank())
                .collect(Collectors.joining("\n\n"));
        if (combinedText.length() > 1800) {
            combinedText = combinedText.substring(0, 1800);
        }
        return huggingFaceService.generateQuizQuestions(combinedText, questionCount, difficultyLevel);
    }

    /**
     * 创建新测验（并保存所有题/选项）
     */
    @Transactional
    public Quiz createQuizForLecture(Long lectureId, String title, int questionCount, int difficultyLevel) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));
        List<Content> contents = contentRepository.findByLectureAndProcessStatus(lecture, Content.ProcessStatus.COMPLETED);
        if (contents.isEmpty()) {
            throw new RuntimeException("讲座没有可用的已处理内容");
        }
        String combinedText = contents.stream()
                .map(Content::getExtractedText)
                .filter(t -> t != null && !t.isBlank())
                .collect(Collectors.joining("\n\n"));
        if (combinedText.length() > 1800) {
            combinedText = combinedText.substring(0, 1800);
        }

        // 设置测验序号
        int quizCount = quizRepository.findByLecture(lecture).size();
        Quiz quiz = new Quiz();
        quiz.setLecture(lecture);
        quiz.setTitle(title);
        quiz.setStatus(Quiz.QuizStatus.DRAFT);
        quiz.setCreatedAt(LocalDateTime.now());
        quiz.setUpdatedAt(LocalDateTime.now());
        quiz.setTimeLimit(30 * questionCount);
        quiz.setSequenceNumber(quizCount + 1);
        quiz.setQuestionCount(questionCount);

        Quiz savedQuiz = quizRepository.save(quiz);

        List<QuizQuestion> generatedQuestions = huggingFaceService.generateQuizQuestions(
                combinedText, questionCount, difficultyLevel);

        int qIndex = 0;
        for (QuizQuestion quizQuestion : generatedQuestions) {
            Question question = new Question();
            question.setQuiz(savedQuiz);
            question.setContent(quizQuestion.getContent());
            question.setSequenceNumber(++qIndex);
            question.setType(Question.QuestionType.MULTIPLE_CHOICE);
            question.setExplanation(quizQuestion.getExplanation());
            question.setDifficultyLevel(difficultyLevel);

            List<Option> optionList = new ArrayList<>();
            int optSeq = 0;
            for (QuizOption quizOption : quizQuestion.getOptions()) {
                Option option = new Option();
                option.setQuestion(question);
                option.setContent(quizOption.getContent());
                option.setOptionLabel(quizOption.getLabel());
                option.setCorrect(quizOption.isCorrect());
                option.setSequenceNumber(++optSeq); // 如果有该字段
                optionList.add(option);
            }
            question.setOptions(optionList);
            questionRepository.save(question);
        }
        return savedQuiz;
    }

    /**
     * 发布测验
     */
    @Transactional
    public Quiz publishQuiz(Long quizId, int timeLimit) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("测验不存在"));
        if (quiz.getStatus() != Quiz.QuizStatus.DRAFT) {
            throw new RuntimeException("只能发布处于草稿状态的测验");
        }
        quiz.setStatus(Quiz.QuizStatus.PUBLISHED);
        quiz.setPublishedAt(LocalDateTime.now());
        quiz.setTimeLimit(timeLimit);
        quiz.setUpdatedAt(LocalDateTime.now());
        return quizRepository.save(quiz);
    }

    /**
     * 激活测验（开始测验）
     */
    @Transactional
    public Quiz activateQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("测验不存在"));
        if (quiz.getStatus() != Quiz.QuizStatus.PUBLISHED) {
            throw new RuntimeException("只能激活已发布的测验");
        }
        quiz.setStatus(Quiz.QuizStatus.ACTIVE);
        quiz.setExpiresAt(LocalDateTime.now().plusSeconds(quiz.getTimeLimit()));
        quiz.setUpdatedAt(LocalDateTime.now());
        Quiz activatedQuiz = quizRepository.save(quiz);
        notificationService.broadcastQuizActivated(activatedQuiz);
        return activatedQuiz;
    }

    /**
     * 提交测验答案
     */
    @Transactional
    public UserResponse submitAnswer(Long userId, Long questionId, List<Long> optionIds, String textResponse, Long responseTimeMs) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("问题不存在"));
        Quiz quiz = question.getQuiz();

        if (quiz.getStatus() != Quiz.QuizStatus.ACTIVE || (quiz.getExpiresAt() != null && LocalDateTime.now().isAfter(quiz.getExpiresAt()))) {
            throw new RuntimeException("测验已经结束，无法提交答案");
        }
        Optional<UserResponse> existingResponse = userResponseRepository.findByUserAndQuestion(user, question);
        if (existingResponse.isPresent()) {
            throw new RuntimeException("您已经回答过这个问题");
        }
        UserResponse response = new UserResponse();
        response.setUser(user);
        response.setQuestion(question);
        response.setQuiz(quiz);
        response.setResponseTimeMs(responseTimeMs);

        // 选择题
        if (question.getType() == Question.QuestionType.MULTIPLE_CHOICE ||
                question.getType() == Question.QuestionType.MULTIPLE_ANSWER) {
            for (Long optionId : optionIds) {
                Option option = question.getOptions().stream()
                        .filter(o -> o.getId().equals(optionId))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("选项不存在"));
                response.getSelectedOptions().add(option);
                option.incrementSelectedCount();
            }
            // 判断正确
            if (question.getType() == Question.QuestionType.MULTIPLE_CHOICE) {
                if (optionIds.size() == 1) {
                    Option selectedOption = question.getOptions().stream()
                            .filter(o -> o.getId().equals(optionIds.get(0)))
                            .findFirst()
                            .orElse(null);
                    response.setCorrect(selectedOption != null && selectedOption.getCorrect());
                } else {
                    response.setCorrect(false);
                }
            } else {
                List<Option> correctOptions = question.getOptions().stream()
                        .filter(Option::getCorrect)
                        .collect(Collectors.toList());
                List<Option> incorrectOptions = question.getOptions().stream()
                        .filter(o -> !o.getCorrect())
                        .collect(Collectors.toList());
                boolean allCorrectOptionsSelected = correctOptions.stream()
                        .allMatch(o -> optionIds.contains(o.getId()));
                boolean noIncorrectOptionsSelected = incorrectOptions.stream()
                        .noneMatch(o -> optionIds.contains(o.getId()));
                response.setCorrect(allCorrectOptionsSelected && noIncorrectOptionsSelected);
            }
        } else if (question.getType() == Question.QuestionType.SHORT_ANSWER) {
            response.setTextResponse(textResponse);
            response.setCorrect(false);
        }
        UserResponse savedResponse = userResponseRepository.save(response);
        notificationService.sendStatisticsUpdate(quiz.getId());
        return savedResponse;
    }

    /**
     * 获取测验统计信息
     */
    public QuizStatistics getQuizStatistics(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("测验不存在"));
        int totalResponses = userResponseRepository.countTotalResponsesByQuiz(quiz);
        int correctResponses = userResponseRepository.countCorrectResponsesByQuiz(quiz);
        int participantCount = userResponseRepository.countDistinctUsersByQuiz(quiz);
        double correctRate = totalResponses > 0 ? (double) correctResponses / totalResponses * 100 : 0;
        QuizStatistics statistics = new QuizStatistics();
        statistics.setQuizId(quizId);
        statistics.setTotalResponses(totalResponses);
        statistics.setCorrectResponses(correctResponses);
        statistics.setParticipantCount(participantCount);
        statistics.setCorrectRate(correctRate);
        return statistics;
    }

    /**
     * 获取用户在测验中的统计信息
     */
    public UserQuizStatistics getUserQuizStatistics(Long userId, Long quizId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("测验不存在"));
        int userTotalResponses = userResponseRepository.countTotalResponsesByUserAndQuiz(user, quiz);
        int userCorrectResponses = userResponseRepository.countCorrectResponsesByUserAndQuiz(user, quiz);
        double userCorrectRate = userTotalResponses > 0 ? (double) userCorrectResponses / userTotalResponses * 100 : 0;
        int rank = 1; // 这里可根据你实际逻辑实现排名
        UserQuizStatistics statistics = new UserQuizStatistics();
        statistics.setUserId(userId);
        statistics.setQuizId(quizId);
        statistics.setTotalResponses(userTotalResponses);
        statistics.setCorrectResponses(userCorrectResponses);
        statistics.setCorrectRate(userCorrectRate);
        statistics.setRank(rank);
        return statistics;
    }

    /**
     * 定时任务：检查并更新过期的测验
     */
    @Scheduled(fixedRate = 10000)
    @Transactional
    public void checkAndExpireQuizzes() {
        LocalDateTime now = LocalDateTime.now();
        List<Quiz> activeQuizzes = quizRepository.findByStatusAndExpiresAtBefore(
                Quiz.QuizStatus.ACTIVE, now);
        for (Quiz quiz : activeQuizzes) {
            quiz.setStatus(Quiz.QuizStatus.EXPIRED);
            Quiz expiredQuiz = quizRepository.save(quiz);
            notificationService.broadcastQuizExpired(expiredQuiz);
        }
    }

    // ====================== 统计 DTO ======================
    public static class QuizStatistics {
        private Long quizId;
        private int totalResponses;
        private int correctResponses;
        private int participantCount;
        private double correctRate;
        public Long getQuizId() { return quizId; }
        public void setQuizId(Long quizId) { this.quizId = quizId; }
        public int getTotalResponses() { return totalResponses; }
        public void setTotalResponses(int totalResponses) { this.totalResponses = totalResponses; }
        public int getCorrectResponses() { return correctResponses; }
        public void setCorrectResponses(int correctResponses) { this.correctResponses = correctResponses; }
        public int getParticipantCount() { return participantCount; }
        public void setParticipantCount(int participantCount) { this.participantCount = participantCount; }
        public double getCorrectRate() { return correctRate; }
        public void setCorrectRate(double correctRate) { this.correctRate = correctRate; }
    }

    public static class UserQuizStatistics {
        private Long userId;
        private Long quizId;
        private int totalResponses;
        private int correctResponses;
        private double correctRate;
        private int rank;
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public Long getQuizId() { return quizId; }
        public void setQuizId(Long quizId) { this.quizId = quizId; }
        public int getTotalResponses() { return totalResponses; }
        public void setTotalResponses(int totalResponses) { this.totalResponses = totalResponses; }
        public int getCorrectResponses() { return correctResponses; }
        public void setCorrectResponses(int correctResponses) { this.correctResponses = correctResponses; }
        public double getCorrectRate() { return correctRate; }
        public void setCorrectRate(double correctRate) { this.correctRate = correctRate; }
        public int getRank() { return rank; }
        public void setRank(int rank) { this.rank = rank; }
    }
}
