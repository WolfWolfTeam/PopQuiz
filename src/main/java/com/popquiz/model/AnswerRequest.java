package com.popquiz.model;

import java.util.List;

public class AnswerRequest {
    private List<Long> optionIds; // 选择题选项ID
    private String textResponse;  // 简答题答案
    private Long responseTimeMs;  // 答题用时（毫秒）

    public List<Long> getOptionIds() { return optionIds; }
    public void setOptionIds(List<Long> optionIds) { this.optionIds = optionIds; }
    public String getTextResponse() { return textResponse; }
    public void setTextResponse(String textResponse) { this.textResponse = textResponse; }
    public Long getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(Long responseTimeMs) { this.responseTimeMs = responseTimeMs; }
} 