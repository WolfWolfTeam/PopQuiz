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

- **后端**: Java 21, Spring Boot 2.7.5, Spring Security, JPA/Hibernate
- **数据库**: MySQL 8.0
- **前端**: React, Material-UI
- **AI集成**: HuggingFace API, deepseek-llm-7b-chat模型
- **通信**: RESTful API, WebSocket

## 快速开始

### 前置条件

- JDK 21
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

前端：
npm start
或者
npx serve -s build -l 3000 --single

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

- 管理员: admin / 123456
- 组织者: organizer / 123456
- 演讲者: speaker / 123456
- 参与者: user / 123456

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

## API Key 配置说明

项目中调用 AI 模型需要使用 API Key，请按照以下步骤进行配置：

1. 打开项目 `src/main/resources/application.properties` 文件。

2. 找到或新增以下配置项：

   ```properties
   huggingface.api-key=你的真实API密钥
   ```

4. 或使用环境变量覆盖：

   ```bash
   export HUGGINGFACE_API_KEY=你的真实API密钥
   ```

5. 修改后，重启应用生效。

### 备注

* 代码中使用 Spring 的 `@Value("${huggingface.api-key}")` 注解读取该配置。
* 请务必妥善保管 API Key，**不要将真实密钥直接提交到公共仓库**，避免泄露造成安全风险。

