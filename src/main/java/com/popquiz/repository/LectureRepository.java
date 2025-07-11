package com.popquiz.repository;

import com.popquiz.model.Lecture;
import com.popquiz.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LectureRepository extends JpaRepository<Lecture, Long> {
    
    List<Lecture> findByOrganizer(User organizer);
    
    List<Lecture> findByPresenter(User presenter);
    
    @Query("SELECT l FROM Lecture l JOIN l.audience a WHERE a = ?1")
    List<Lecture> findByAudience(User audience);
    
    List<Lecture> findByScheduledTimeBetween(LocalDateTime start, LocalDateTime end);
    
    List<Lecture> findByStatus(Lecture.LectureStatus status);
    
    List<Lecture> findByAccessCode(String accessCode);
} 