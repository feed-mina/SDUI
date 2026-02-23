package com.domain.demo_backend.domain.diary.dto;


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
    private String title;
    private String content;
    private String dayTag1;
    private String dayTag2;
    private String dayTag3;
    private String diaryStatus;
    private Integer emotion;
    private String delYn;
    private String date;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDateTime regDt;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDateTime lastUpdtDt;



}
