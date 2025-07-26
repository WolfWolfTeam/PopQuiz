package com.popquiz.dto;

import com.popquiz.model.Content;

public class ContentDto {
    private Long id;
    private String title;
    private String originalFilename;
    private String contentType;
    private String processStatus;
    private String extractedText;  // ✅ 添加这行

    public static ContentDto from(Content content) {
        ContentDto dto = new ContentDto();
        dto.id = content.getId();
        dto.title = content.getTitle();
        dto.originalFilename = content.getOriginalFilename();
        dto.contentType = content.getType().name();
        dto.processStatus = content.getProcessStatus().name();
        dto.extractedText = content.getExtractedText();  // ✅ 设置字段
        return dto;
    }

    // Getters and setters ↓↓↓

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public String getProcessStatus() { return processStatus; }
    public void setProcessStatus(String processStatus) { this.processStatus = processStatus; }

    public String getExtractedText() { return extractedText; }
    public void setExtractedText(String extractedText) { this.extractedText = extractedText; }
}
