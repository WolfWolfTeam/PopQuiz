package com.popquiz.repository;

import com.popquiz.model.Lecture;
import com.popquiz.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LectureRepository extends JpaRepository<Lecture, Long> {
    
    List<Lecture> findByOrganizer(User organizer);
    
    List<Lecture> findByPresenter(User presenter);
    
    @Query("SELECT l FROM Lecture l JOIN l.audience a WHERE a = ?1")
    List<Lecture> findByAudience(User audience);
    
    @Query("SELECT l FROM Lecture l JOIN l.audience a WHERE a = ?1 ORDER BY l.scheduledTime DESC")
    List<Lecture> findByAudienceContainingOrderByScheduledTimeDesc(User audience);
    
    @Query("SELECT l FROM Lecture l WHERE l.organizer = :organizer OR l.presenter = :presenter ORDER BY l.scheduledTime DESC")
    List<Lecture> findByOrganizerOrPresenterOrderByScheduledTimeDesc(@Param("organizer") User organizer, @Param("presenter") User presenter);
    
    List<Lecture> findByScheduledTimeBetween(LocalDateTime start, LocalDateTime end);
    
    List<Lecture> findByStatus(Lecture.LectureStatus status);
    
    List<Lecture> findByAccessCode(String accessCode);

    @Query("SELECT l FROM Lecture l WHERE l.organizer = :organizer OR l.presenter = :presenter")
    List<Lecture> findByOrganizerOrPresenter(@Param("organizer") User organizer, @Param("presenter") User presenter);
} 