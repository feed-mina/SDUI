package com.domain.demo_backend.domain.diary.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@ToString
@EqualsAndHashCode
public class DiaryRequest {

    //현재 페이지 번호
    private int pageNo = 1;
    // 페이지 크기
    private int pageSize = 10;
    private Long diaryId;
    // 검색 타입(ID, Name, Title)
    private String searchType;
    // 검색어
    private String searchText;

    private String diaryStatus;
    // 사용자 일련번호
    private Long userSqno;
    // 글쓴이
    private String userId;
    private String email;
    // 최초 등록 IP
    private String frstRegstIp;

    // 최중 수정 IP
    private String lastUpdtIp;

    // 최종 수정 일시
    @JsonFormat(pattern = "yyyy-MM-dd")
    private String lastUpdtDt;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private String regDt;
    // 삭제 여부
    private String delYn = "N";

    private String diaryTitle;
    private String diaryContent;
    private Map<String, String> tags;
    // 테그1, 테그2, 테그3
    private String tag1;
    private String tag2;
    private String tag3;
    private Integer diaryEmotion;

    private String diaryType;

    @JdbcTypeCode(SqlTypes.JSON) // Hibernate 6 이상에서 JSONB 매핑 방식
    @Column(name = "selected_times")
    private List<Integer> selectedTimes; // [22, 23, 0, 1] 형태로 자동 매핑

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "daily_slots")
    private Map<String, String> dailySlots; // {"morning": "...", "lunch": "..."} 형태로 매핑

}
