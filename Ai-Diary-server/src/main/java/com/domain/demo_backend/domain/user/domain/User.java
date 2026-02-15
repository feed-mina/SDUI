package com.domain.demo_backend.domain.user.domain;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users") // DB의 user 테이블과 매핑
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // PostgreSQL의 SERIAL 자동생성
    @Column(name = "user_sqno")
    private Long userSqno;         // user_sqno

    @Column(name = "user_id", length = 50)
    private String userId;              // user_id

    private String password;            // password

    @Column(name = "hashed_password")
    private String hashedPassword;

    private String role;                // role
    private String username;            // username
    private String phone;               // phone
    private String email;               // email

    @Transient // DB에는 저장하지 않은 필드
    private String repassword;          // repassword

    private String nickname;

    @Column(name = "del_yn")
    private String delYn = "N"; // 기본값 설정

    @Column(name = "verify_yn")
    private String verifyYn = "N";

    @Column(name = "social_type")
    private String socialType;

    @Column(name = "verification_code")
    private String verificationCode;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "withdraw_at")
    private LocalDateTime withdrawAt;

    // DB업데이트 시 SQL을 직접 지정하고 싶을때 Repository에서 사용
    @Column(name = "verification_expired_at")
    private LocalDateTime verificationExpiredAt;


    @Column(name = "sleep_using_type")
    private String sleepUsingType;

    @Column(name = "drug_using_type")
    private String drugUsingType;

    @Builder
    public User(String userId, String password, String hashedPassword, String role, String username, String delYn, String phone, String email, String verifyYn, String socialType, LocalDateTime createdAt, LocalDateTime updatedAt, String verificationCode, LocalDateTime withdrawAt, String sleepUsingType, String drugUsingType) {
        this.userId = userId;
        this.password = password;
        this.hashedPassword = hashedPassword;
        this.role = role;
        this.username = username;
        this.delYn = delYn;
        this.phone = phone;
        this.email = email;
        this.verifyYn = verifyYn;
        this.socialType = socialType;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.verificationCode = verificationCode;
        this.withdrawAt = withdrawAt;
        this.sleepUsingType = sleepUsingType;
        this.drugUsingType = drugUsingType;
    }

    // JPA가 insert 하기 전 자동으로 시간을 넣어주는 기능
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
