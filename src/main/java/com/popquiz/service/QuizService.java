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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 测验服务
 * 处理测验的创建、发布、统计等功能
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
            NotificationService notificationService) {
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
     * 为讲座创建测验
     */
    @Transactional
    public Quiz createQuizForLecture(Long lectureId, String title, int questionCount, int difficultyLevel) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));
        
        // 获取讲座的所有已处理内容
        List<Content> contents = contentRepository.findByLectureAndProcessStatus(lecture, Content.ProcessStatus.COMPLETED);
        if (contents.isEmpty()) {
            throw new RuntimeException("讲座没有可用的已处理内容");
        }
        
        // 合并所有内容的提取文本
        String combinedText = contents.stream()
                .map(Content::getExtractedText)
                .collect(Collectors.joining("\n\n"));
        
        // 创建新的测验
        Quiz quiz = new Quiz();
        quiz.setLecture(lecture);
        quiz.setTitle(title);
        quiz.setStatus(Quiz.QuizStatus.DRAFT);
        quiz.setCreatedAt(LocalDateTime.now());
        quiz.setTimeLimit(30); // 默认30秒
        
        // 设置序号
        int quizCount = quizRepository.findByLecture(lecture).size();
        quiz.setSequenceNumber(quizCount + 1);
        
        // 保存测验
        Quiz savedQuiz = quizRepository.save(quiz);
        
        // 使用AI生成问题
        List<QuizQuestion> generatedQuestions = huggingFaceService.generateQuizQuestions(
                combinedText, questionCount, difficultyLevel);
        
        // 将生成的问题保存到数据库
        for (int i = 0; i < generatedQuestions.size(); i++) {
            QuizQuestion quizQuestion = generatedQuestions.get(i);
            
            Question question = new Question();
            question.setQuiz(savedQuiz);
            question.setContent(quizQuestion.getContent());
            question.setSequenceNumber(i + 1);
            question.setType(Question.QuestionType.MULTIPLE_CHOICE);
            question.setExplanation(quizQuestion.getExplanation());
            question.setDifficultyLevel(difficultyLevel);
            
            Question savedQuestion = questionRepository.save(question);
            
            // 保存选项
            for (QuizOption quizOption : quizQuestion.getOptions()) {
                Option option = new Option();
                option.setQuestion(savedQuestion);
                option.setContent(quizOption.getContent());
                option.setOptionLabel(quizOption.getLabel());
                option.setCorrect(quizOption.isCorrect());
                
                // 这里使用JPA的级联保存
                savedQuestion.getOptions().add(option);
            }
            
            // 保存问题和其选项
            questionRepository.save(savedQuestion);
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
        // 设置过期时间
        quiz.setExpiresAt(LocalDateTime.now().plusSeconds(quiz.getTimeLimit()));
        
        Quiz activatedQuiz = quizRepository.save(quiz);
        
        // 发送测验激活通知
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
        
        // 检查测验是否已过期
        if (quiz.getStatus() != Quiz.QuizStatus.ACTIVE || (quiz.getExpiresAt() != null && LocalDateTime.now().isAfter(quiz.getExpiresAt()))) {
            throw new RuntimeException("测验已经结束，无法提交答案");
        }
        
        // 检查用户是否已经回答过这个问题
        Optional<UserResponse> existingResponse = userResponseRepository.findByUserAndQuestion(user, question);
        if (existingResponse.isPresent()) {
            throw new RuntimeException("您已经回答过这个问题");
        }
        
        UserResponse response = new UserResponse();
        response.setUser(user);
        response.setQuestion(question);
        response.setQuiz(quiz);
        response.setResponseTimeMs(responseTimeMs);
        
        // 根据问题类型处理答案
        if (question.getType() == Question.QuestionType.MULTIPLE_CHOICE || 
            question.getType() == Question.QuestionType.MULTIPLE_ANSWER) {
            // 处理选择题
            for (Long optionId : optionIds) {
                Option option = question.getOptions().stream()
                        .filter(o -> o.getId().equals(optionId))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("选项不存在"));
                response.getSelectedOptions().add(option);
                
                // 更新选择次数
                option.incrementSelectedCount();
            }
            
            // 判断答案是否正确
            if (question.getType() == Question.QuestionType.MULTIPLE_CHOICE) {
                // 单选题：选择一个且正确
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
                // 多选题：所有正确的选项都被选中，且没有选错误的选项
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
            // 处理简答题
            response.setTextResponse(textResponse);
            // 简答题需要人工判断或更复杂的AI比对
            response.setCorrect(false);
        }
        
        UserResponse savedResponse = userResponseRepository.save(response);
        
        // 更新统计信息
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
        
        // 计算排名需要更复杂的查询，这里简化实现
        int rank = 1;
        
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
    @Scheduled(fixedRate = 10000) // 每10秒执行一次
    @Transactional
    public void checkAndExpireQuizzes() {
        LocalDateTime now = LocalDateTime.now();
        List<Quiz> activeQuizzes = quizRepository.findByStatusAndExpiresAtBefore(
                Quiz.QuizStatus.ACTIVE, now);
        
        for (Quiz quiz : activeQuizzes) {
            quiz.setStatus(Quiz.QuizStatus.EXPIRED);
            Quiz expiredQuiz = quizRepository.save(quiz);
            
            // 发送测验过期通知
            notificationService.broadcastQuizExpired(expiredQuiz);
        }
    }
    
    /**
     * 测验统计信息
     */
    public static class QuizStatistics {
        private Long quizId;
        private int totalResponses;
        private int correctResponses;
        private int participantCount;
        private double correctRate;
        
        // getter and setter

        public Long getQuizId() {
            return quizId;
        }

        public void setQuizId(Long quizId) {
            this.quizId = quizId;
        }

        public int getTotalResponses() {
            return totalResponses;
        }

        public void setTotalResponses(int totalResponses) {
            this.totalResponses = totalResponses;
        }

        public int getCorrectResponses() {
            return correctResponses;
        }

        public void setCorrectResponses(int correctResponses) {
            this.correctResponses = correctResponses;
        }

        public int getParticipantCount() {
            return participantCount;
        }

        public void setParticipantCount(int participantCount) {
            this.participantCount = participantCount;
        }

        public double getCorrectRate() {
            return correctRate;
        }

        public void setCorrectRate(double correctRate) {
            this.correctRate = correctRate;
        }
    }
    
    /**
     * 用户测验统计信息
     */
    public static class UserQuizStatistics {
        private Long userId;
        private Long quizId;
        private int totalResponses;
        private int correctResponses;
        private double correctRate;
        private int rank;
        
        // getter and setter

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public Long getQuizId() {
            return quizId;
        }

        public void setQuizId(Long quizId) {
            this.quizId = quizId;
        }

        public int getTotalResponses() {
            return totalResponses;
        }

        public void setTotalResponses(int totalResponses) {
            this.totalResponses = totalResponses;
        }

        public int getCorrectResponses() {
            return correctResponses;
        }

        public void setCorrectResponses(int correctResponses) {
            this.correctResponses = correctResponses;
        }

        public double getCorrectRate() {
            return correctRate;
        }

        public void setCorrectRate(double correctRate) {
            this.correctRate = correctRate;
        }

        public int getRank() {
            return rank;
        }

        public void setRank(int rank) {
            this.rank = rank;
        }
    }
} 