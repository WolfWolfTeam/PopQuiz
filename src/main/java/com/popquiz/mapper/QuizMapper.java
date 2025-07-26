package com.popquiz.mapper;

import com.popquiz.dto.QuizDto;
import com.popquiz.model.Quiz;

import java.util.List;
import java.util.stream.Collectors;

public class QuizMapper {

    public static QuizDto toDto(Quiz quiz) {
        QuizDto dto = new QuizDto();
        dto.setId(quiz.getId());
        dto.setTitle(quiz.getTitle());
        dto.setSequenceNumber(quiz.getSequenceNumber());
        dto.setStatus(quiz.getStatus().name());
        dto.setCreatedAt(quiz.getCreatedAt());
        dto.setPublishedAt(quiz.getPublishedAt());
        dto.setExpiresAt(quiz.getExpiresAt());
        dto.setTimeLimit(quiz.getTimeLimit());
        if (quiz.getLecture() != null) {
            dto.setLectureId(quiz.getLecture().getId());
        }

        dto.setQuestionCount(quiz.getQuestions() == null ? 0 : quiz.getQuestions().size());
        return dto;
    }

    public static List<QuizDto> toDtoList(List<Quiz> quizzes) {
        return quizzes.stream()
                .map(QuizMapper::toDto)
                .collect(Collectors.toList());
    }
}
