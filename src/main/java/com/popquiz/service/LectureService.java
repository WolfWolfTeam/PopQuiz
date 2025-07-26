package com.popquiz.service;

import com.popquiz.ai.HuggingFaceService;
import com.popquiz.ai.QuizOption;
import com.popquiz.ai.QuizQuestion;
import com.popquiz.model.*;
import com.popquiz.repository.ContentRepository;
import com.popquiz.repository.LectureRepository;
import com.popquiz.repository.QuestionRepository;
import com.popquiz.repository.QuizRepository;
import com.popquiz.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class LectureService {

    private final LectureRepository lectureRepository;
    private final UserRepository userRepository;
    private final ContentRepository contentRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final HuggingFaceService huggingFaceService;

    public LectureService(
            LectureRepository lectureRepository,
            UserRepository userRepository,
            ContentRepository contentRepository,
            QuizRepository quizRepository,
            QuestionRepository questionRepository,
            HuggingFaceService huggingFaceService
    ) {
        this.lectureRepository = lectureRepository;
        this.userRepository = userRepository;
        this.contentRepository = contentRepository;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.huggingFaceService = huggingFaceService;
    }

    @Transactional
    public Lecture createLecture(CreateLectureRequest request, String organizerUsername) {
        User organizer = userRepository.findByUsername(organizerUsername)
                .orElseThrow(() -> new RuntimeException("组织者不存在"));
        // 让organizer同时做presenter
        User presenter = organizer;

        Lecture lecture = new Lecture();
        lecture.setTitle(request.getTitle());
        lecture.setDescription(request.getDescription());
        lecture.setOrganizer(organizer);
        lecture.setPresenter(presenter);
        lecture.setScheduledTime(request.getScheduledTime());
        if(request.getQuizInterval() != null){
            lecture.setQuizInterval(request.getQuizInterval());
        }
        // 其他属性可选
        return lectureRepository.save(lecture);
    }

    public List<Lecture> getLecturesByOrganizer(String organizerUsername) {
        User organizer = userRepository.findByUsername(organizerUsername)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return lectureRepository.findByOrganizer(organizer);
    }

    public List<Lecture> getLecturesByAudience(String audienceUsername) {
        User audience = userRepository.findByUsername(audienceUsername)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return lectureRepository.findByAudience(audience);
    }

    public Optional<Lecture> getLectureById(Long lectureId) {
        return lectureRepository.findById(lectureId);
    }

    @Transactional
    public Lecture joinLecture(String audienceUsername, String accessCode) {
        User audience = userRepository.findByUsername(audienceUsername)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        List<Lecture> lectures = lectureRepository.findByAccessCode(accessCode);
        if (lectures.isEmpty()) {
            throw new RuntimeException("无效的访问代码");
        }
        Lecture lecture = lectures.get(0);
        Set<User> audienceSet = lecture.getAudience();
        audienceSet.add(audience);
        lecture.setAudience(audienceSet);
        return lectureRepository.save(lecture);
    }

    @Transactional
    public Quiz generateQuizForLecture(Long lectureId, int questionCount, int optionCount, int difficultyLevel){
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new RuntimeException("讲座不存在"));

        List<Content> contents = contentRepository.findByLectureAndProcessStatus(lecture, Content.ProcessStatus.COMPLETED);
        String combinedText = contents.stream()
                .map(Content::getExtractedText)
                .filter(Objects::nonNull)
                .filter(text -> !text.isBlank())
                .reduce("", (a, b) -> a + "\n" + b);

        // === 调试日志，建议你运行一次后把日志内容贴给我 ===
        System.out.println("[DEBUG] combinedText.length = " + combinedText.length());
        System.out.println("[DEBUG] combinedText (preview): " + (combinedText.length() > 400 ? combinedText.substring(0, 400) + "..." : combinedText));

        if (combinedText.isBlank()) {
            throw new RuntimeException("暂无可用于生成测验的讲座内容");
        }

        // 可选：截断 combinedText，防止输入过长
        int maxLength = 1800;
        if (combinedText.length() > maxLength) {
            combinedText = combinedText.substring(0, maxLength);
            System.out.println("[DEBUG] combinedText 已被截断为 " + maxLength + " 字符");
        }

        List<QuizQuestion> questions = huggingFaceService.generateQuizQuestions(combinedText, questionCount, difficultyLevel);

        if (questions == null || questions.isEmpty()) {
            throw new RuntimeException("AI生成测验问题失败，返回结果为空");
        }

        Quiz quiz = new Quiz();
        quiz.setLecture(lecture);
        quiz.setTitle("自动生成测验");
        quiz.setStatus(Quiz.QuizStatus.DRAFT);
        quiz.setCreatedAt(LocalDateTime.now());
        quiz.setUpdatedAt(LocalDateTime.now());
        quiz.setTimeLimit(60 * questions.size());
        quiz.setSequenceNumber(0);

        Quiz savedQuiz = quizRepository.save(quiz);

        int questionIndex = 0;
        for (QuizQuestion quizQuestion : questions) {
            Question q = new Question();

            q.setQuiz(savedQuiz);
            q.setContent(quizQuestion.getContent());
            q.setExplanation(quizQuestion.getExplanation());
            q.setCreatedAt(LocalDateTime.now());
            q.setSequenceNumber(++questionIndex);

            List<Option> optionList = new ArrayList<>();
            for (int i = 0; i < quizQuestion.getOptions().size(); i++) {
                QuizOption opt = quizQuestion.getOptions().get(i);
                Option option = new Option();
                option.setQuestion(q);
                option.setContent(opt.getContent());
                option.setOptionLabel(opt.getLabel());
                option.setCorrect(opt.isCorrect());
                optionList.add(option);
            }

            q.setOptions(optionList);
            questionRepository.save(q);
        }

        return savedQuiz;
    }

    private String generateAccessCode() {
        return String.format("%06d", new Random().nextInt(1_000_000));
    }
}
