-- 创建数据库（如已存在可跳过）
-- CREATE DATABASE IF NOT EXISTS popquiz DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE popquiz;

-- 1. 删除所有表（防止重复导入报错）
DROP TABLE IF EXISTS user_response_options;
DROP TABLE IF EXISTS user_responses;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quiz;
DROP TABLE IF EXISTS contents;
DROP TABLE IF EXISTS lecture_audience;
DROP TABLE IF EXISTS lectures;
DROP TABLE IF EXISTS feedbacks;
DROP TABLE IF EXISTS discussion_comments;
DROP TABLE IF EXISTS user_badge;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS user_role;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS user;

-- 2. 用户表
CREATE TABLE `user` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100),
    `nickname` VARCHAR(50),
    `profile_image` VARCHAR(255),
    `bio` TEXT,
    `enabled` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP,
    `updated_at` TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 角色表
CREATE TABLE `role` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 用户-角色关联表
CREATE TABLE `user_role` (
    `user_id` BIGINT NOT NULL,
    `role_id` INT NOT NULL,
    PRIMARY KEY (`user_id`, `role_id`),
    CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 徽章表
CREATE TABLE `badges` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `description` VARCHAR(255),
    `icon_url` VARCHAR(255),
    `type` VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 用户-徽章关联表
CREATE TABLE `user_badge` (
    `user_id` BIGINT NOT NULL,
    `badge_id` BIGINT NOT NULL,
    PRIMARY KEY (`user_id`, `badge_id`),
    CONSTRAINT `fk_user_badge_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_badge_badge` FOREIGN KEY (`badge_id`) REFERENCES `badges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 讲座表
CREATE TABLE `lectures` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `organizer_id` BIGINT NOT NULL,
    `presenter_id` BIGINT NOT NULL,
    `scheduled_time` TIMESTAMP NOT NULL,
    `start_time` TIMESTAMP,
    `end_time` TIMESTAMP,
    `status` VARCHAR(20) NOT NULL,
    `access_code` VARCHAR(255),
    `quiz_interval` INT NOT NULL DEFAULT 10,
    `auto_generate_quiz` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP,
    `updated_at` TIMESTAMP,
    CONSTRAINT `fk_lectures_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `user` (`id`),
    CONSTRAINT `fk_lectures_presenter` FOREIGN KEY (`presenter_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 讲座-观众关联表
CREATE TABLE `lecture_audience` (
    `lecture_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    PRIMARY KEY (`lecture_id`, `user_id`),
    CONSTRAINT `fk_lecture_audience_lecture` FOREIGN KEY (`lecture_id`) REFERENCES `lectures` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_lecture_audience_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 内容表
CREATE TABLE `contents` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `lecture_id` BIGINT NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `title` VARCHAR(255),
    `text_content` TEXT,
    `file_path` VARCHAR(255),
    `original_filename` VARCHAR(255),
    `mime_type` VARCHAR(255),
    `file_size` BIGINT,
    `process_status` VARCHAR(20) NOT NULL,
    `extracted_text` TEXT,
    `error_message` VARCHAR(255),
    `created_at` TIMESTAMP,
    `updated_at` TIMESTAMP,
    `process_start_time` TIMESTAMP,
    `process_end_time` TIMESTAMP,
    CONSTRAINT `fk_contents_lecture` FOREIGN KEY (`lecture_id`) REFERENCES `lectures` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 测验表
CREATE TABLE `quiz` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `lecture_id` BIGINT NOT NULL,
    `title` VARCHAR(255),
    `sequence_number` INT NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP NOT NULL,
    `published_at` TIMESTAMP,
    `expires_at` TIMESTAMP,
    `time_limit` INT NOT NULL DEFAULT 30,
    CONSTRAINT `fk_quiz_lecture` FOREIGN KEY (`lecture_id`) REFERENCES `lectures` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 问题表
CREATE TABLE `questions` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `quiz_id` BIGINT NOT NULL,
    `content` TEXT NOT NULL,
    `sequence_number` INT NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `explanation` VARCHAR(255),
    `difficulty_level` INT NOT NULL DEFAULT 2,
    `created_at` TIMESTAMP,
    CONSTRAINT `fk_questions_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quiz` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. 选项表
CREATE TABLE `options` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `question_id` BIGINT NOT NULL,
    `content` VARCHAR(255) NOT NULL,
    `is_correct` BOOLEAN NOT NULL DEFAULT FALSE,
    `option_label` CHAR(1) NOT NULL,
    `selected_count` INT DEFAULT 0,
    CONSTRAINT `fk_options_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. 用户响应表
CREATE TABLE `user_responses` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `quiz_id` BIGINT NOT NULL,
    `question_id` BIGINT NOT NULL,
    `text_response` TEXT,
    `correct` BOOLEAN,
    `submitted_at` TIMESTAMP NOT NULL,
    `response_time_ms` BIGINT,
    CONSTRAINT `fk_user_responses_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_responses_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quiz` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_responses_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. 用户响应选项关联表
CREATE TABLE `user_response_options` (
    `user_response_id` BIGINT NOT NULL,
    `option_id` BIGINT NOT NULL,
    PRIMARY KEY (`user_response_id`, `option_id`),
    CONSTRAINT `fk_user_response_options_response` FOREIGN KEY (`user_response_id`) REFERENCES `user_responses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_response_options_option` FOREIGN KEY (`option_id`) REFERENCES `options` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. 反馈表
CREATE TABLE `feedbacks` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `lecture_id` BIGINT,
    `quiz_id` BIGINT,
    `type` VARCHAR(20),
    `rating` INT,
    `comment` TEXT,
    `created_at` TIMESTAMP NOT NULL,
    CONSTRAINT `fk_feedbacks_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_feedbacks_lecture` FOREIGN KEY (`lecture_id`) REFERENCES `lectures` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_feedbacks_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quiz` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. 讨论评论表
CREATE TABLE `discussion_comments` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `question_id` BIGINT NOT NULL,
    `content` TEXT NOT NULL,
    `parent_id` BIGINT,
    `created_at` TIMESTAMP NOT NULL,
    `updated_at` TIMESTAMP,
    `likes` INT DEFAULT 0,
    CONSTRAINT `fk_discussion_comments_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_discussion_comments_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_discussion_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `discussion_comments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入初始角色
INSERT INTO `role` (`name`) VALUES ('ROLE_ADMIN'),('ROLE_ORGANIZER'),('ROLE_SPEAKER'),('ROLE_USER');

-- 插入初始用户（密码均为123456，BCrypt加密：$2a$10$Dow1QwQwQwQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQwQ）
INSERT INTO `user` (`username`, `email`, `password`, `full_name`, `enabled`) VALUES
('admin', 'admin@popquiz.com', '$2a$10$Dow1QwQwQwQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQwQ', '管理员', TRUE),
('organizer', 'organizer@popquiz.com', '$2a$10$Dow1QwQwQwQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQwQ', '组织者', TRUE),
('speaker', 'speaker@popquiz.com', '$2a$10$Dow1QwQwQwQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQwQ', '演讲者', TRUE),
('user', 'user@popquiz.com', '$2a$10$Dow1QwQwQwQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQwQ', '普通用户', TRUE);

-- 分配角色
INSERT INTO `user_role` (`user_id`, `role_id`) SELECT u.id, r.id FROM `user` u, `role` r WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN';
INSERT INTO `user_role` (`user_id`, `role_id`) SELECT u.id, r.id FROM `user` u, `role` r WHERE u.username = 'organizer' AND r.name = 'ROLE_ORGANIZER';
INSERT INTO `user_role` (`user_id`, `role_id`) SELECT u.id, r.id FROM `user` u, `role` r WHERE u.username = 'speaker' AND r.name = 'ROLE_SPEAKER';
INSERT INTO `user_role` (`user_id`, `role_id`) SELECT u.id, r.id FROM `user` u, `role` r WHERE u.username = 'user' AND r.name = 'ROLE_USER';

-- 插入一个讲座
INSERT INTO `lectures` (`title`, `description`, `organizer_id`, `presenter_id`, `scheduled_time`, `status`, `quiz_interval`, `auto_generate_quiz`, `created_at`) 
SELECT 'AI入门讲座', '介绍人工智能基础知识', o.id, s.id, NOW(), 'SCHEDULED', 10, TRUE, NOW()
FROM `user` o, `user` s WHERE o.username = 'organizer' AND s.username = 'speaker' LIMIT 1;

-- 插入一个测验
INSERT INTO `quiz` (`lecture_id`, `title`, `sequence_number`, `status`, `created_at`, `time_limit`) 
SELECT l.id, 'AI基础测验', 1, 'DRAFT', NOW(), 60 FROM `lectures` l WHERE l.title = 'AI入门讲座' LIMIT 1;

-- 插入一个问题
INSERT INTO `questions` (`quiz_id`, `content`, `sequence_number`, `type`, `difficulty_level`, `created_at`) 
SELECT q.id, '下列哪一项不是机器学习的主要范式？', 1, 'MULTIPLE_CHOICE', 2, NOW() FROM `quiz` q WHERE q.title = 'AI基础测验' LIMIT 1;

-- 插入选项
INSERT INTO `options` (`question_id`, `content`, `is_correct`, `option_label`) 
SELECT q.id, '监督学习', FALSE, 'A' FROM `questions` q WHERE q.content = '下列哪一项不是机器学习的主要范式？';
INSERT INTO `options` (`question_id`, `content`, `is_correct`, `option_label`) 
SELECT q.id, '无监督学习', FALSE, 'B' FROM `questions` q WHERE q.content = '下列哪一项不是机器学习的主要范式？';
INSERT INTO `options` (`question_id`, `content`, `is_correct`, `option_label`) 
SELECT q.id, '面向对象', TRUE, 'C' FROM `questions` q WHERE q.content = '下列哪一项不是机器学习的主要范式？';
INSERT INTO `options` (`question_id`, `content`, `is_correct`, `option_label`) 
SELECT q.id, '强化学习', FALSE, 'D' FROM `questions` q WHERE q.content = '下列哪一项不是机器学习的主要范式？';

-- 插入一个徽章
INSERT INTO `badges` (`name`, `description`, `icon_url`, `type`, `created_at`) VALUES ('首测达人', '完成首次测验', NULL, 'ACHIEVEMENT', NOW());

-- 给user分配徽章
INSERT INTO `user_badge` (`user_id`, `badge_id`) SELECT u.id, b.id FROM `user` u, `badges` b WHERE u.username = 'user' AND b.name = '首测达人'; 