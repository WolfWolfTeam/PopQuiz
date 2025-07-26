package com.popquiz.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class HuggingFaceService {

    private static final Logger logger = LoggerFactory.getLogger(HuggingFaceService.class);
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    private final OkHttpClient client;
    private final ObjectMapper objectMapper;

    @Value("${huggingface.api-token}")
    private String apiToken;

    @Value("${huggingface.model-endpoint}")
    private String modelEndpoint;

    @Value("${huggingface.model-name}")
    private String modelName;

    public HuggingFaceService() {
        this.client = new OkHttpClient.Builder()
                .connectTimeout(120, TimeUnit.SECONDS)
                .readTimeout(120, TimeUnit.SECONDS)
                .writeTimeout(120, TimeUnit.SECONDS)
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public List<QuizQuestion> generateQuizQuestions(String content, int numQuestions, int difficultyLevel) {
        try {
            String response = callDeepSeekAPI(content, numQuestions, difficultyLevel);
            return parseDeepSeekResponse(response);
        } catch (Exception e) {
            logger.error("生成测验问题时出错", e);
            throw new RuntimeException("无法生成测验问题", e);
        }
    }

    private String callDeepSeekAPI(String content, int numQuestions, int difficultyLevel) throws IOException {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", modelName);

        ArrayNode messages = objectMapper.createArrayNode();

        // system prompt
        messages.add(objectMapper.createObjectNode()
                .put("role", "system")
                .put("content", "你是一个专业的教育专家，擅长创建高质量的测验题目。请严格按照JSON格式输出，不要多余解释。"));

        // user prompt，多行文本块，更易读，易于LLM解析
        messages.add(objectMapper.createObjectNode()
                .put("role", "user")
                .put("content", String.format("""
                        请根据以下内容生成%d道单选题，每题4个选项，难度%d，内容如下：

                        %s

                        输出严格的 JSON，结构如下：
                        {
                          "questions": [
                            {
                              "content": "问题内容",
                              "options": [
                                {"label": "A", "content": "选项A内容", "isCorrect": false},
                                {"label": "B", "content": "选项B内容", "isCorrect": false},
                                {"label": "C", "content": "选项C内容", "isCorrect": true},
                                {"label": "D", "content": "选项D内容", "isCorrect": false}
                              ],
                              "explanation": "问题解释和答案分析"
                            }
                          ]
                        }

                        重要要求：
                        1. 输出必须严格符合上述 JSON 结构，不要输出多余内容，不要加任何注释或解释。
                        2. 每题只有一个正确答案（isCorrect为true）。
                        3. 问题和选项内容请务必与输入内容相关。
                        """, numQuestions, difficultyLevel, content)));

        root.set("messages", messages);
        root.put("temperature", 0.7);

        Request request = new Request.Builder()
                .url(modelEndpoint)
                .addHeader("Authorization", "Bearer " + apiToken)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(root.toString(), JSON))
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("API调用失败: " + response);
            }
            return response.body().string();
        }
    }

    private List<QuizQuestion> parseDeepSeekResponse(String response) throws IOException {
        JsonNode rootNode = objectMapper.readTree(response);
        String content = rootNode.get("choices").get(0).get("message").get("content").asText();

        // 输出 LLM 原始返回，便于调试
        logger.info("DeepSeek LLM 返回内容：\n{}", content);

        int startIndex = content.indexOf("{");
        int endIndex = content.lastIndexOf("}") + 1;
        if (startIndex == -1 || endIndex <= startIndex) {
            throw new IOException("无法从响应中提取JSON, 原始内容: " + content);
        }

        String jsonStr = content.substring(startIndex, endIndex);
        JsonNode questionsNode = objectMapper.readTree(jsonStr);

        List<QuizQuestion> quizQuestions = new ArrayList<>();
        if (questionsNode.has("questions")) {
            ArrayNode questionsArray = (ArrayNode) questionsNode.get("questions");
            for (JsonNode questionNode : questionsArray) {
                QuizQuestion question = new QuizQuestion();
                question.setContent(questionNode.get("content").asText());
                question.setExplanation(questionNode.get("explanation").asText());

                List<QuizOption> options = new ArrayList<>();
                ArrayNode optionsArray = (ArrayNode) questionNode.get("options");
                for (JsonNode optionNode : optionsArray) {
                    QuizOption option = new QuizOption();
                    option.setLabel(optionNode.get("label").asText().charAt(0));
                    option.setContent(optionNode.get("content").asText());
                    option.setCorrect(optionNode.get("isCorrect").asBoolean());
                    options.add(option);
                }
                question.setOptions(options);
                quizQuestions.add(question);
            }
        }

        return quizQuestions;
    }
}
