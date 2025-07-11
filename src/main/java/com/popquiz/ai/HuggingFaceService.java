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
    
    @Value("${huggingface.api.token}")
    private String apiToken;
    
    @Value("${huggingface.model.endpoint}")
    private String modelEndpoint;

    public HuggingFaceService() {
        this.client = new OkHttpClient.Builder()
                .connectTimeout(120, TimeUnit.SECONDS)
                .readTimeout(120, TimeUnit.SECONDS)
                .writeTimeout(120, TimeUnit.SECONDS)
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 使用DeepSeek AI生成测验问题
     * @param content 用于生成问题的内容文本
     * @param numQuestions 要生成的问题数量
     * @param difficultyLevel 问题难度级别(1-5)
     * @return 生成的问题列表
     */
    public List<QuizQuestion> generateQuizQuestions(String content, int numQuestions, int difficultyLevel) {
        try {
            String prompt = buildQuizGenerationPrompt(content, numQuestions, difficultyLevel);
            String response = callHuggingFaceAPI(prompt);
            
            return parseQuizQuestionsResponse(response);
        } catch (Exception e) {
            logger.error("生成测验问题时出错", e);
            throw new RuntimeException("无法生成测验问题", e);
        }
    }

    private String buildQuizGenerationPrompt(String content, int numQuestions, int difficultyLevel) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一个专业的教育专家，擅长创建高质量的测验题目。")
              .append("请根据以下内容创建")
              .append(numQuestions)
              .append("个单选题，每个问题有4个选项(A,B,C,D)，难度级别为")
              .append(difficultyLevel)
              .append("（1-5，5最难）。\n\n")
              .append("内容：\n")
              .append(content)
              .append("\n\n")
              .append("请严格按照以下JSON格式返回问题：\n")
              .append("{\n")
              .append("  \"questions\": [\n")
              .append("    {\n")
              .append("      \"content\": \"问题内容\",\n")
              .append("      \"options\": [\n")
              .append("        {\"label\": \"A\", \"content\": \"选项A内容\", \"isCorrect\": false},\n")
              .append("        {\"label\": \"B\", \"content\": \"选项B内容\", \"isCorrect\": false},\n")
              .append("        {\"label\": \"C\", \"content\": \"选项C内容\", \"isCorrect\": true},\n")
              .append("        {\"label\": \"D\", \"content\": \"选项D内容\", \"isCorrect\": false}\n")
              .append("      ],\n")
              .append("      \"explanation\": \"问题解释和答案分析\"\n")
              .append("    }\n")
              .append("  ]\n")
              .append("}\n\n")
              .append("请确保问题直接关联到提供的内容，难度合适，且每个问题只有一个正确答案。");
        
        return prompt.toString();
    }

    private String callHuggingFaceAPI(String prompt) throws IOException {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("inputs", prompt);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_length", 2048);
        
        Request request = new Request.Builder()
                .url(modelEndpoint)
                .addHeader("Authorization", "Bearer " + apiToken)
                .post(RequestBody.create(requestBody.toString(), JSON))
                .build();
                
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("API调用失败: " + response);
            }
            return response.body().string();
        }
    }

    private List<QuizQuestion> parseQuizQuestionsResponse(String response) throws IOException {
        JsonNode rootNode = objectMapper.readTree(response);
        String generatedText;
        
        // 处理不同的响应格式
        if (rootNode.has("generated_text")) {
            generatedText = rootNode.get("generated_text").asText();
        } else if (rootNode.isArray() && rootNode.get(0).has("generated_text")) {
            generatedText = rootNode.get(0).get("generated_text").asText();
        } else {
            throw new IOException("无法解析API响应");
        }
        
        // 提取JSON部分
        int startIndex = generatedText.indexOf("{");
        int endIndex = generatedText.lastIndexOf("}") + 1;
        
        if (startIndex == -1 || endIndex <= startIndex) {
            throw new IOException("无法从响应中提取JSON");
        }
        
        String jsonStr = generatedText.substring(startIndex, endIndex);
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