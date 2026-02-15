package com.domain.demo_backend.domain.diary.domain;

import com.domain.demo_backend.domain.user.domain.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigInteger;
import java.time.LocalDateTime;

@Entity
@Table(name = "diary")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor // 빌더를 위해 추가
@Builder // 클래스 위에 붙으면 모든 빌드에 대해 빌더가 생긴다.
public class Diary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "diary_id")
    private Long diaryId;

    private String title;
    private String content;
    // 문자열 userId 필드
    @Column(name = "user_id")
    private String userId;
    // 실제 연관관계 필드(DB의  user_sqno 칼럼을 실제로 관리함)
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @JoinColumn(name = "user_sqno")
    private User user;

    // 숫자 PK 값만 따로 확인하고 싶은 경우
    // insertable=false, updatable=false를 넣어야 중복 매핑 에러가 사라진다.
    @Column(name = "user_sqno", insertable = false, updatable = false)
    private Long userSqno;

//    @JsonProperty("tags")
//    private Map<String, String> tags;

    private String tag1;
    private String tag2;
    private String tag3;
    private String date;
    private String email;
    private String username;
    private String sbsceDt;

    @Column(name = "last_updt_dt")
    private String lastUpdtDt;

    private LocalDateTime regDt;
    private String diaryStatus;

    @Column(name = "frst_reg_ip")
    private String frstRegIp;

    @Column(name = "frst_rgst_usps_sqno")
    private BigInteger frstRgstUspsSqno;

    private String author; // 작성자 추가
    private Integer emotion; // 감정지수 추가

    @Column(name = "updt_dt")
    private LocalDateTime updtDt;

    @Column(name = "diary_type")
    private String diaryType;

    @Column(name = "del_yn")
    private String delYn = "N";

    @Column(name = "del_dt")
    private LocalDateTime delDt;

    @Column(name = "frst_dt")
    private LocalDateTime frstRegDt;

    @Column(name = "role_cd")
    private String roleCd;

    @Column(name = "role_nm")
    private String roleNm;

    @Column(name = "last_updt_ip")
    private String lastUpdtIp;

    @Column(name = "last_updt_usps_sqno")
    private BigInteger lastUpdtUspsSqno;

    @Column(name = "selected_times")
    private String selectedTimes;

    @Column(name = "drug_morning")
    private String drugMorning;

    @Column(name = "drug_lunch")
    private String drugLunch;

    @Column(name = "drug_dinner")
    private String drugDinner;

    @PrePersist
    public void prePersist() {
        this.regDt = LocalDateTime.now();
        this.updtDt = LocalDateTime.now();
    }
}
