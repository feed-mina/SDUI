package com.domain.demo_backend.time.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "goal_settings")
@Getter
@Setter
public class GoalSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_sqno", nullable = false)
    private Long userSqno;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "target_time", nullable = false)
    private LocalDateTime targetTime;

    @Column(name = "recorded_time")
    private LocalDateTime recordedTime;

    @Column(name = "todays_message")
    private String todaysMessage;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}