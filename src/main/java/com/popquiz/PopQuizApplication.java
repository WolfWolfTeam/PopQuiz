package com.popquiz;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * PopQuiz应用程序的主启动类
 * 使用SpringBoot框架
 */
@SpringBootApplication
@EnableScheduling
public class PopQuizApplication implements ApplicationListener<ApplicationReadyEvent> {
    
    private static final Logger log = LoggerFactory.getLogger(PopQuizApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(PopQuizApplication.class, args);
    }
    
    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        try {
            Environment env = event.getApplicationContext().getEnvironment();
            String protocol = "http";
            String hostAddress = InetAddress.getLocalHost().getHostAddress();
            String serverPort = env.getProperty("server.port", "8080");
            String contextPath = env.getProperty("server.servlet.context-path", "/");
            if (!contextPath.startsWith("/")) {
                contextPath = "/" + contextPath;
            }
            
            log.info("\n----------------------------------------------------------\n\t" +
                    "应用 '{}' 已成功启动! 访问地址:\n\t" +
                    "本地: \t\t{}://localhost:{}{}\n\t" +
                    "外部: \t\t{}://{}:{}{}\n\t" +
                    "----------------------------------------------------------",
                    env.getProperty("spring.application.name", "PopQuiz"),
                    protocol, serverPort, contextPath,
                    protocol, hostAddress, serverPort, contextPath);
        } catch (UnknownHostException e) {
            log.error("无法确定主机地址", e);
        }
    }
} 