package com.popquiz.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 选项实体类
 * 表示问题的选择项
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "options")
public class Option {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private boolean isCorrect = false;

    @Column(nullable = false)
    private char optionLabel; // A, B, C, D 等

    // 该选项被选择的次数
    private Integer selectedCount = 0;

    // 新增：选项在列表中的顺序，从 0 开始
    @Column(nullable = false)
    private Integer sequenceNumber;

    public void incrementSelectedCount() {
        this.selectedCount++;
    }

    public Boolean getCorrect() {
        return isCorrect;
    }

    public void setCorrect(Boolean correct) {
        this.isCorrect = correct;
    }
}
