package com.popquiz.service;

import com.popquiz.model.*;
import com.popquiz.repository.LectureRepository;
import com.popquiz.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class LectureService {
    private final LectureRepository lectureRepository;
    private final UserRepository userRepository;

    public LectureService(LectureRepository lectureRepository, UserRepository userRepository) {
        this.lectureRepository = lectureRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Lecture createLecture(CreateLectureRequest request, String organizerUsername) {
        User organizer = userRepository.findByUsername(organizerUsername)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        User presenter = userRepository.findById(request.getPresenterId())
                .orElseThrow(() -> new RuntimeException("演讲者不存在"));
        Lecture lecture = new Lecture();
        lecture.setTitle(request.getTitle());
        lecture.setDescription(request.getDescription());
        lecture.setOrganizer(organizer);
        lecture.setPresenter(presenter);
        lecture.setScheduledTime(request.getScheduledTime());
        lecture.setStatus(Lecture.LectureStatus.SCHEDULED);
        lecture.setAccessCode(generateAccessCode());
        lecture.setQuizInterval(request.getQuizInterval() != null ? request.getQuizInterval() : 10);
        lecture.setCreatedAt(LocalDateTime.now());
        return lectureRepository.save(lecture);
    }

    public List<Lecture> getLecturesByOrganizer(String organizerUsername) {
        User organizer = userRepository.findByUsername(organizerUsername)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return lectureRepository.findByOrganizer(organizer);
    }

    public List<Lecture> getLecturesByAudience(String audienceUsername) {
        User audience = userRepository.findByUsername(audienceUsername)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return lectureRepository.findByAudience(audience);
    }

    public Optional<Lecture> getLectureById(Long lectureId) {
        return lectureRepository.findById(lectureId);
    }

    @Transactional
    public Lecture joinLecture(String audienceUsername, String accessCode) {
        User audience = userRepository.findByUsername(audienceUsername)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        List<Lecture> lectures = lectureRepository.findByAccessCode(accessCode);
        if (lectures.isEmpty()) {
            throw new RuntimeException("无效的访问代码");
        }
        Lecture lecture = lectures.get(0);
        Set<User> audienceSet = lecture.getAudience();
        audienceSet.add(audience);
        lecture.setAudience(audienceSet);
        return lectureRepository.save(lecture);
    }

    private String generateAccessCode() {
        return String.format("%06d", (int)(Math.random() * 1000000));
    }
} 