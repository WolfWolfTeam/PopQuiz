//package com.popquiz;
//
//import com.popquiz.model.*;
//import com.popquiz.repository.*;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.stereotype.Component;
//
//import java.time.LocalDateTime;
//import java.util.Arrays;
//import java.util.HashSet;
//import java.util.Set;
//
///**
// * 测验数据生成器 - 为用户dhn生成测试数据
// * 这个类会在应用启动时自动运行，为用户dhn创建讲座和测验
// */
//@Component
//public class QuizDataGenerator implements CommandLineRunner {
//
//    @Autowired
//    private UserRepository userRepository;
//
//    @Autowired
//    private RoleRepository roleRepository;
//
//    @Autowired
//    private LectureRepository lectureRepository;
//
//    @Autowired
//    private QuizRepository quizRepository;
//
//    @Autowired
//    private QuestionRepository questionRepository;
//
//    @Autowired
//    private OptionRepository optionRepository;
//
//    @Override
//    public void run(String... args) throws Exception {
//        System.out.println("开始为用户dhn生成测验数据...");
//
//        // 1. 确保用户dhn存在
//        User dhnUser = ensureUserExists("dhn", "dhn@qq.com", "ROLE_USER");
//
//        // 2. 确保演讲者存在
//        User speaker = ensureUserExists("speaker", "speaker@popquiz.com", "ROLE_SPEAKER");
//
//        // 3. 确保组织者存在
//        User organizer = ensureUserExists("organizer", "organizer@popquiz.com", "ROLE_ORGANIZER");
//
//        // 4. 创建讲座
//        Lecture lecture = createLecture("Java编程基础讲座", "介绍Java编程的基础知识", organizer, speaker);
//
//        // 5. 将用户dhn添加到讲座观众中
//        addUserToLectureAudience(lecture, dhnUser);
//
//        // 6. 创建测验
//        Quiz quiz = createQuiz(lecture, "Java基础测验", 1);
//
//        // 7. 创建问题和选项
//        createQuestionsAndOptions(quiz);
//
//        // 8. 发布测验
//        publishQuiz(quiz);
//
//        System.out.println("测验数据生成完成！");
//        System.out.println("讲座ID: " + lecture.getId());
//        System.out.println("测验ID: " + quiz.getId());
//        System.out.println("用户dhn可以参与测验了");
//    }
//
//    private User ensureUserExists(String username, String email, String roleName) {
//        return userRepository.findByUsername(username)
//                .orElseGet(() -> {
//                    User user = new User();
//                    user.setUsername(username);
//                    user.setEmail(email);
//                    user.setPassword("123456"); // 使用明文密码
//                    user.setFullName(username);
//                    user.setNickname(username);
//                    user.setEnabled(true);
//                    user.setCreatedAt(LocalDateTime.now());
//                    user.setUpdatedAt(LocalDateTime.now());
//
//                    // 设置角色
//                    Role role = roleRepository.findByName(roleName)
//                            .orElseThrow(() -> new RuntimeException("角色不存在: " + roleName));
//                    user.setRoles(new HashSet<>(Arrays.asList(role)));
//
//                    User savedUser = userRepository.save(user);
//                    System.out.println("创建用户: " + username + " (ID: " + savedUser.getId() + ")");
//                    return savedUser;
//                });
//    }
//
//    private Lecture createLecture(String title, String description, User organizer, User presenter) {
//        // 检查是否已存在相同标题的讲座
//        return lectureRepository.findByTitle(title)
//                .orElseGet(() -> {
//                    Lecture lecture = new Lecture();
//                    lecture.setTitle(title);
//                    lecture.setDescription(description);
//                    lecture.setOrganizer(organizer);
//                    lecture.setPresenter(presenter);
//                    lecture.setScheduledTime(LocalDateTime.now().plusHours(1));
//                    lecture.setStatus(Lecture.LectureStatus.SCHEDULED);
//                    lecture.setQuizInterval(10);
//                    lecture.setAutoGenerateQuiz(true);
//                    lecture.setCreatedAt(LocalDateTime.now());
//                    lecture.setUpdatedAt(LocalDateTime.now());
//
//                    Lecture savedLecture = lectureRepository.save(lecture);
//                    System.out.println("创建讲座: " + title + " (ID: " + savedLecture.getId() + ")");
//                    return savedLecture;
//                });
//    }
//
//    private void addUserToLectureAudience(Lecture lecture, User user) {
//        Set<User> audience = lecture.getAudience();
//        if (audience == null) {
//            audience = new HashSet<>();
//        }
//
//        if (!audience.contains(user)) {
//            audience.add(user);
//            lecture.setAudience(audience);
//            lectureRepository.save(lecture);
//            System.out.println("将用户 " + user.getUsername() + " 添加到讲座观众中");
//        }
//    }
//
//    private Quiz createQuiz(Lecture lecture, String title, int sequenceNumber) {
//        Quiz quiz = new Quiz();
//        quiz.setLecture(lecture);
//        quiz.setTitle(title);
//        quiz.setSequenceNumber(sequenceNumber);
//        quiz.setStatus(Quiz.QuizStatus.DRAFT);
//        quiz.setCreatedAt(LocalDateTime.now());
//        quiz.setTimeLimit(60); // 60秒时间限制
//
//        Quiz savedQuiz = quizRepository.save(quiz);
//        System.out.println("创建测验: " + title + " (ID: " + savedQuiz.getId() + ")");
//        return savedQuiz;
//    }
//
//    private void createQuestionsAndOptions(Quiz quiz) {
//        // 问题1：Java是什么类型的语言？
//        Question question1 = createQuestion(quiz, "Java是什么类型的编程语言？", 1, "MULTIPLE_CHOICE", 1);
//        createOptions(question1, Arrays.asList(
//                new OptionData("面向对象语言", true, 'A'),
//                new OptionData("过程式语言", false, 'B'),
//                new OptionData("函数式语言", false, 'C'),
//                new OptionData("脚本语言", false, 'D')
//        ));
//
//        // 问题2：Java的三大特性是什么？
//        Question question2 = createQuestion(quiz, "Java的三大特性不包括以下哪一项？", 2, "MULTIPLE_CHOICE", 2);
//        createOptions(question2, Arrays.asList(
//                new OptionData("封装", false, 'A'),
//                new OptionData("继承", false, 'B'),
//                new OptionData("多态", false, 'C'),
//                new OptionData("重载", true, 'D')
//        ));
//
//        // 问题3：Java中哪个关键字用于定义常量？
//        Question question3 = createQuestion(quiz, "Java中用于定义常量的关键字是？", 3, "MULTIPLE_CHOICE", 1);
//        createOptions(question3, Arrays.asList(
//                new OptionData("const", false, 'A'),
//                new OptionData("final", true, 'B'),
//                new OptionData("static", false, 'C'),
//                new OptionData("constant", false, 'D')
//        ));
//
//        // 问题4：Java中String是基本数据类型吗？
//        Question question4 = createQuestion(quiz, "Java中String是基本数据类型吗？", 4, "MULTIPLE_CHOICE", 1);
//        createOptions(question4, Arrays.asList(
//                new OptionData("是", false, 'A'),
//                new OptionData("不是", true, 'B'),
//                new OptionData("有时是", false, 'C'),
//                new OptionData("取决于版本", false, 'D')
//        ));
//
//        // 问题5：Java中哪个包包含基本的数据类型？
//        Question question5 = createQuestion(quiz, "Java中哪个包包含基本的数据类型？", 5, "MULTIPLE_CHOICE", 2);
//        createOptions(question5, Arrays.asList(
//                new OptionData("java.lang", true, 'A'),
//                new OptionData("java.util", false, 'B'),
//                new OptionData("java.io", false, 'C'),
//                new OptionData("java.math", false, 'D')
//        ));
//    }
//
//    private Question createQuestion(Quiz quiz, String content, int sequenceNumber, String type, int difficultyLevel) {
//        Question question = new Question();
//        question.setQuiz(quiz);
//        question.setContent(content);
//        question.setSequenceNumber(sequenceNumber);
//        question.setType(Question.QuestionType.valueOf(type));
//        question.setDifficultyLevel(difficultyLevel);
//        question.setCreatedAt(LocalDateTime.now());
//
//        Question savedQuestion = questionRepository.save(question);
//        System.out.println("创建问题: " + content.substring(0, Math.min(20, content.length())) + "... (ID: " + savedQuestion.getId() + ")");
//        return savedQuestion;
//    }
//
//    private void createOptions(Question question, java.util.List<OptionData> optionDataList) {
//        for (OptionData optionData : optionDataList) {
//            Option option = new Option();
//            option.setQuestion(question);
//            option.setContent(optionData.content);
//            option.setCorrect(optionData.isCorrect);
//            option.setOptionLabel(optionData.label);
//            option.setSelectedCount(0);
//
//            Option savedOption = optionRepository.save(option);
//            System.out.println("创建选项: " + optionData.label + ". " + optionData.content +
//                    (optionData.isCorrect ? " (正确答案)" : "") + " (ID: " + savedOption.getId() + ")");
//        }
//    }
//
//    private void publishQuiz(Quiz quiz) {
//        quiz.setStatus(Quiz.QuizStatus.PUBLISHED);
//        quiz.setPublishedAt(LocalDateTime.now());
//        quiz.setExpiresAt(LocalDateTime.now().plusDays(7)); // 7天后过期
//
//        quizRepository.save(quiz);
//        System.out.println("测验已发布，过期时间: " + quiz.getExpiresAt());
//    }
//
//    // 辅助类用于存储选项数据
//    private static class OptionData {
//        String content;
//        boolean isCorrect;
//        char label;
//
//        OptionData(String content, boolean isCorrect, char label) {
//            this.content = content;
//            this.isCorrect = isCorrect;
//            this.label = label;
//        }
//    }
//}