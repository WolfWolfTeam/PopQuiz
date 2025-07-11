# PopQuiz

PopQuiz是一个使用AI技术为演讲和课程生成实时测验题目的系统。基于Java和Spring Boot框架，采用MVC架构。

## 功能特点

- 用户认证和权限管理
- 讲座创建和管理
- 内容上传和处理（支持文本、PPT、PDF等格式）
- AI自动生成测验题目
- 实时测验通知和参与
- 测验结果统计和分析

## 技术栈

- **后端**: Java 11, Spring Boot 2.7.5, Spring Security, JPA/Hibernate
- **数据库**: MySQL 8.0
- **前端**: React, Material-UI
- **AI集成**: HuggingFace API, deepseek-llm-7b-chat模型
- **通信**: RESTful API, WebSocket

## 快速开始

### 前置条件

- JDK 11或更高版本
- Maven 3.6或更高版本
- MySQL 8.0

### 数据库设置

1. 创建MySQL数据库:
   ```sql
   CREATE DATABASE popquiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. 导入数据库结构:
   ```bash
   mysql -u 用户名 -p popquiz < popquiz.sql
   ```

### 配置

1. 编辑`src/main/resources/application.properties`文件，配置数据库连接和其他设置:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/popquiz?useSSL=false&serverTimezone=Asia/Shanghai
   spring.datasource.username=你的数据库用户名
   spring.datasource.password=你的数据库密码
   
   # HuggingFace API配置
   huggingface.api.key=你的API密钥
   ```

### 运行应用

Windows系统:
```
run.bat
```

Linux/MacOS系统:
```bash
./mvnw clean spring-boot:run
```

应用将在 http://localhost:8080/api 启动

### 默认用户

- 管理员: admin / admin123
- 组织者: organizer / organizer123
- 演讲者: speaker / speaker123
- 参与者: user / user123

## 项目结构

```
popquiz/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── popquiz/
│   │   │           ├── config/      # 配置类
│   │   │           ├── controller/  # REST控制器
│   │   │           ├── dto/         # 数据传输对象
│   │   │           ├── exception/   # 异常处理
│   │   │           ├── model/       # 实体类
│   │   │           ├── repository/  # 数据访问层
│   │   │           ├── security/    # 安全相关
│   │   │           ├── service/     # 业务逻辑
│   │   │           └── util/        # 工具类
│   │   └── resources/
│   │       ├── application.properties  # 应用配置
│   │       └── static/                 # 静态资源
│   └── test/                           # 测试代码
└── pom.xml                             # Maven配置
```

## API文档

启动应用后，可通过以下URL访问API文档:
```
http://localhost:8080/api/swagger-ui/index.html
```
