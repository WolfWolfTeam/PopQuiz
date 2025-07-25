package com.popquiz.dto;

public class OptionDto {
    private Long id;
    private String content;
    private String label;
    // 可扩展更多字段

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
} 