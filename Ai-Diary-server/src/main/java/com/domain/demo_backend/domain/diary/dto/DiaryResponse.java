package com.domain.demo_backend.diary.dto;


import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.math.BigInteger;
import java.time.LocalDateTime;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class DiaryResponse {
    private BigInteger diaryId;
    private Long userSqno;
    private String userId;
    private String author;
    private String title;
    private String content;
    private String tag1;
    private String tag2;
    private String tag3;
    private String username;
    private String diaryStatus;
    private Integer emotion;
    private String delYn;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDateTime date;

    // 최종 수정 일시
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDateTime regDt;

    // 최종 수정 일시
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDateTime lastUpdtDt;


    // 기존 기본 생성자가 있을 수도 있음
    public DiaryResponse() {
    }

    // 필요한 생성자 추가
    public DiaryResponse(BigInteger diaryId, String title, String content, LocalDateTime regDt) {
        this.diaryId = diaryId;
        this.title = title;
        this.content = content;
        this.regDt = regDt;
    }


//    public Diary toDiary() {
//        return Diary.builder()
//                .userSqno(this.userSqno)
//                .userId(this.userId)
//                .title(this.title)
//                .content(this.content)
//                .tag1(this.tag1)
//                .tag2(this.tag2)
//                .tag3(this.tag3)
//                .diaryStatus(this.diaryStatus)
//                .author(this.author)
//                .emotion(this.emotion)
//                .regDt(this.regDt)
//                .build();
//    }


}
