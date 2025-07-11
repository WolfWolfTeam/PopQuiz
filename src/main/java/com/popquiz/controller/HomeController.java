package com.popquiz.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 首页控制器
 * 提供API状态检查和基本信息
 */
@RestController
public class HomeController {

    /**
     * API状态检查端点
     * @return API状态信息
     */
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "PopQuiz API服务运行正常");
        response.put("version", "1.0.0");
        return ResponseEntity.ok(response);
    }
} 