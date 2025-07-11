package com.popquiz.repository;

import com.popquiz.model.Content;
import com.popquiz.model.Lecture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ContentRepository extends JpaRepository<Content, Long> {
    
    List<Content> findByLecture(Lecture lecture);
    
    List<Content> findByLectureAndType(Lecture lecture, Content.ContentType type);
    
    List<Content> findByLectureAndProcessStatus(Lecture lecture, Content.ProcessStatus processStatus);
} 