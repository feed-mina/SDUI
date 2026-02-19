package com.domain.demo_backend.domain.diary.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@ToString
@EqualsAndHashCode
public class DiaryRequest {

    private int pageNo = 1;
    private int pageSize = 10;
    private Long diaryId;
    private String searchType;
    private String searchText;
    private String diaryStatus;
    private Long userSqno;
    private String userId;
    private String email;
    private String frstRegstIp;
    private String lastUpdtIp;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private String lastUpdtDt;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private String regDt;
    private String delYn = "N";

    private String diaryTitle;
    private String diaryContent;
    private Map<String, String> tags;
    private String dayTag1;
    private String dayTag2;
    private String dayTag3;
    private Integer diaryEmotion;
    private String diaryType;

    @JsonProperty("selected_times")
    private List<Integer> selectedTimes;

    @JsonProperty("daily_slots")
    private Map<String, Object> dailySlots;
}