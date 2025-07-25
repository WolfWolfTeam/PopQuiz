package com.popquiz.mapper;

import com.popquiz.model.Lecture;
import com.popquiz.dto.LectureDto;

import java.util.List;
import java.util.stream.Collectors;

public class LectureMapper {

    public static LectureDto toDto(Lecture lecture) {
        LectureDto dto = new LectureDto();
        dto.setId(lecture.getId());
        dto.setTitle(lecture.getTitle());
        dto.setDescription(lecture.getDescription());
        dto.setOrganizerUsername(lecture.getOrganizer().getUsername());
        dto.setPresenterUsername(lecture.getPresenter().getUsername());
        dto.setScheduledTime(lecture.getScheduledTime());
        dto.setStatus(lecture.getStatus().name());
        return dto;
    }

    public static List<LectureDto> toDtoList(List<Lecture> lectures) {
        return lectures.stream()
                .map(LectureMapper::toDto)
                .collect(Collectors.toList());
    }
}
