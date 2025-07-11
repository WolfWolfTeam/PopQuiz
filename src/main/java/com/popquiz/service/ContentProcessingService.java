package com.popquiz.service;

import com.popquiz.model.Content;
import com.popquiz.model.Lecture;
import com.popquiz.repository.ContentRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * 内容处理服务
 * 处理各种类型的内容，提取文本
 */
@Service
public class ContentProcessingService {

    private static final Logger logger = LoggerFactory.getLogger(ContentProcessingService.class);
    
    private final ContentRepository contentRepository;
    
    @Value("${upload.path}")
    private String uploadPath;
    
    public ContentProcessingService(ContentRepository contentRepository) {
        this.contentRepository = contentRepository;
    }
    
    /**
     * 处理上传的内容文件
     */
    public Content processContentUpload(MultipartFile file, Lecture lecture) throws Exception {
        // 创建上传目录（如果不存在）
        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }
        
        // 生成文件路径
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadPath, fileName);
        
        // 保存文件
        Files.write(filePath, file.getBytes());
        
        // 创建内容记录
        Content content = new Content();
        content.setLecture(lecture);
        content.setTitle(file.getOriginalFilename());
        content.setFilePath(filePath.toString());
        content.setOriginalFilename(file.getOriginalFilename());
        content.setMimeType(file.getContentType());
        content.setFileSize(file.getSize());
        content.setProcessStatus(Content.ProcessStatus.PENDING);
        
        // 根据文件类型设置内容类型
        if (file.getContentType() != null) {
            if (file.getContentType().contains("text/")) {
                content.setType(Content.ContentType.TEXT);
            } else if (file.getContentType().contains("application/vnd.ms-powerpoint") || 
                    file.getContentType().contains("application/vnd.openxmlformats-officedocument.presentationml")) {
                content.setType(Content.ContentType.POWERPOINT);
            } else if (file.getContentType().contains("application/pdf")) {
                content.setType(Content.ContentType.PDF);
            } else if (file.getContentType().contains("audio/")) {
                content.setType(Content.ContentType.AUDIO);
            } else if (file.getContentType().contains("video/")) {
                content.setType(Content.ContentType.VIDEO);
            } else {
                content.setType(Content.ContentType.OTHER);
            }
        } else {
            content.setType(Content.ContentType.OTHER);
        }
        
        // 保存内容记录
        Content savedContent = contentRepository.save(content);
        
        // 异步处理内容
        processContentAsync(savedContent.getId());
        
        return savedContent;
    }
    
    /**
     * 异步处理内容
     */
    @Async
    public void processContentAsync(Long contentId) {
        try {
            Content content = contentRepository.findById(contentId)
                    .orElseThrow(() -> new RuntimeException("内容未找到"));
            
            content.setProcessStatus(Content.ProcessStatus.PROCESSING);
            content.setProcessStartTime(java.time.LocalDateTime.now());
            contentRepository.save(content);
            
            String extractedText = "";
            
            try {
                switch (content.getType()) {
                    case TEXT:
                        extractedText = processTextFile(content.getFilePath());
                        break;
                    case POWERPOINT:
                        extractedText = processPowerPointFile(content.getFilePath());
                        break;
                    case PDF:
                        extractedText = processPdfFile(content.getFilePath());
                        break;
                    case AUDIO:
                        // 音频处理需要外部API或服务
                        extractedText = "音频文件需要外部转录服务";
                        break;
                    case VIDEO:
                        // 视频处理需要外部API或服务
                        extractedText = "视频文件需要外部转录服务";
                        break;
                    default:
                        extractedText = "不支持的文件类型";
                }
                
                content.setExtractedText(extractedText);
                content.setProcessStatus(Content.ProcessStatus.COMPLETED);
            } catch (Exception e) {
                logger.error("处理内容时出错", e);
                content.setProcessStatus(Content.ProcessStatus.FAILED);
                content.setErrorMessage(e.getMessage());
            }
            
            content.setProcessEndTime(java.time.LocalDateTime.now());
            contentRepository.save(content);
            
        } catch (Exception e) {
            logger.error("异步处理内容时出错", e);
        }
    }
    
    /**
     * 处理文本文件
     */
    private String processTextFile(String filePath) throws Exception {
        return new String(Files.readAllBytes(Paths.get(filePath)));
    }
    
    /**
     * 处理PowerPoint文件
     */
    private String processPowerPointFile(String filePath) throws Exception {
        StringBuilder text = new StringBuilder();
        
        try (FileInputStream fis = new FileInputStream(filePath);
             XMLSlideShow ppt = new XMLSlideShow(fis)) {
            
            for (XSLFSlide slide : ppt.getSlides()) {
                text.append("Slide ").append(slide.getSlideNumber()).append(":\n");
                
                List<XSLFShape> shapes = slide.getShapes();
                for (XSLFShape shape : shapes) {
                    if (shape instanceof XSLFTextShape) {
                        XSLFTextShape textShape = (XSLFTextShape) shape;
                        String slideText = textShape.getText();
                        if (slideText != null && !slideText.isEmpty()) {
                            text.append(slideText).append("\n");
                        }
                    }
                }
                text.append("\n");
            }
        }
        
        return text.toString();
    }
    
    /**
     * 处理PDF文件
     */
    private String processPdfFile(String filePath) throws Exception {
        StringBuilder text = new StringBuilder();
        
        try (PDDocument document = PDDocument.load(new File(filePath))) {
            PDFTextStripper stripper = new PDFTextStripper();
            text.append(stripper.getText(document));
        }
        
        return text.toString();
    }
} 