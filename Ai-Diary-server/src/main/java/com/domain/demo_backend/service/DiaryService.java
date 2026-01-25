package com.domain.demo_backend.service;

import com.domain.demo_backend.diary.domain.Diary;
import com.domain.demo_backend.diary.domain.DiaryRepository;
import com.domain.demo_backend.diary.dto.DiaryRequest;
import com.domain.demo_backend.diary.dto.DiaryResponse;
import com.domain.demo_backend.user.domain.User;
import com.domain.demo_backend.user.domain.UserRepository;
import com.domain.demo_backend.util.CustomUserDetails;
import com.domain.demo_backend.util.JwtUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import jakarta.servlet.http.HttpServletRequest;
import io.jsonwebtoken.Claims;
import org.apache.ibatis.javassist.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;


@Service
public class DiaryService {
    @Autowired
    private DiaryRepository diaryRepository;
    private UserRepository userRepository;

    private final JwtUtil jwtUtil;


    public DiaryService(DiaryRepository diaryRepository, UserRepository userRepository,JwtUtil jwtUtil) {
        this.diaryRepository = diaryRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public PageInfo<DiaryResponse> selectDiaryList(String userId, int pageNo, int pageSize) {
        System.out.println("@@@다이어리 서비스 selectDiaryList진입");
//        PageHelper.startPage(pageNo, pageSize);

        int totalCount = diaryRepository.countByUserId(userId);

        List<Diary> diaries;
        int offset = (pageNo - 1) * pageSize; //  OFFSET 미리 계산
        System.out.println("@@@offset: " + offset);
        try {
           // 일기 목록 가져오기
//            diaryResponseList = diaryRepository.selectDiaryList(userId, pageSize, offset) ;
            diaries = diaryRepository.findByDiaryListCustom(userId, pageSize, offset) ;
//            System.out.println("@@@1--diaries:: " + diaries);
            // 2. 엔티티 목록을 DTO(DiaryResponse) 목록으로 변환한다.
            List<DiaryResponse> diaryResponseList = diaries.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            // PageInfo 객체로 페이징 결과를 반환
            PageInfo<DiaryResponse> pageInfo = new PageInfo<>(diaryResponseList);
            pageInfo.setPageNum(pageNo);
            pageInfo.setPageSize(pageSize);
            pageInfo.setTotal(totalCount);  //  전체 일기 개수 꼭 넣기!

            return pageInfo;
        } catch (Exception e) {
            System.err.println("Error fetching diary list: " + e.getMessage());
            throw new RuntimeException("일기를 조회하는 도중 오류가 발생했습니다.", e);
        }
    }
     public Set<DiaryResponse> findDiaryById(DiaryRequest diaryReq) {

        System.out.println("@@@@@@findDiaryById 서비스 로직 진입 diaryReq:: " + diaryReq);

        System.out.println("@@@findDiaryItemById sql시작" + diaryReq);
        // 1. diaryReq 에서 필요한 값을 꺼내서 변수에 담는다.
         String userId = diaryReq.getUserId();
         int pageSize = 10; // 만약 요청이 없다면 임시로 10개
         int offset = 0; // 첫 페이지부터
//     return diaryMapper.selectDiaryItem(diaryReq)
         return diaryRepository.findByDiaryListCustom(userId, pageSize, offset) // 1. List를 받는다
                 .stream()                                               // 2. 하나씩 꺼낸다 .map(this::convertToDto)
                 .map(diary -> {
                     // Diary 엔티티를 DiaryResponse로 바꾸는 과정이 필요
                     DiaryResponse res = new DiaryResponse();
                     res.setDiaryId(BigInteger.valueOf(diary.getDiaryId()));
                     res.setTitle(diary.getTitle());
                     return res;
                 }) // 3. 모양을 바꾼다
                 .collect(Collectors.toSet());

    }

    private DiaryResponse convertToDto(Diary diary) {
        DiaryResponse dto = new DiaryResponse();
        dto.setDiaryId(BigInteger.valueOf(diary.getDiaryId()));
        dto.setTitle(diary.getTitle());
        dto.setContent(diary.getContent());
        dto.setRegDt(diary.getRegDt());
        dto.setUserId(diary.getUserId());
        // dto.setUserId(diary.getUser().getUserId());
        dto.setAuthor(diary.getAuthor());
        return dto;
    }

    @Transactional(readOnly = true)
    public Optional<Diary> viewDiaryItem(DiaryRequest diaryReq) {

        System.out.println("@@@viewDiaryItem 서비스 로직 진입 diaryReq:: " + diaryReq);
        System.out.println("@@@selectDiaryItem sql시작" + diaryReq);
        Long diaryId = diaryReq.getDiaryId().longValue();
        System.out.println("userId: " + diaryReq.getUserId());
        String userId = diaryReq.getUserId();
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("userId 값이 올바르지 않습니다.");
        }
        try {
            // 일기 조회
            Optional<Diary> diary= diaryRepository.findByDiaryIdAndUserIdAndDelYn(diaryId, userId,"N");

            //  조회된 데이터가 없을 경우 예외 처리 추가
            if (diary == null) {
                throw new NotFoundException("해당 일기를 찾을 수 없습니다.");
            }

            return diary;
        } catch (Exception e) {
            System.err.println("Error fetching diary item: " + e.getMessage());
            throw new RuntimeException("일기를 조회하는 도중 오류가 발생했습니다.", e);
        }

    }


    @Transactional
    public void addDiary(DiaryRequest diaryRequest, String ip, Authentication authentication) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        System.out.println("@@@diaryRequest-다이어리서비스: " + diaryRequest);
        String email = userDetails.getUsername();
        HttpServletRequest request;
        ObjectMapper objectMapper = new ObjectMapper();
        String selectedTimesJson = "";
        try {
            selectedTimesJson = objectMapper.writeValueAsString(diaryRequest.getSelectedTimes());
        } catch (JsonProcessingException e) {
            e.printStackTrace(); // 또는 로깅 처리
        }

        // 1. 먼저 DB에서 유저를 찾는다.
        User user = userRepository.findByUserSqno(diaryRequest.getUserSqno()).orElseThrow(()-> new IllegalArgumentException("존재하지 않은 사용자입니다."));
        // 안전한 ID 만들기 (User 엔티티 활용)
                String safeUserId = user.getUserId(); // 1순위: DB에 저장된 ID
                if (safeUserId == null || safeUserId.isEmpty()) {
                    // 2순위: DB ID가 없으면 이메일(@앞부분)을 ID처럼 사용
                    safeUserId = user.getEmail().split("@")[0];
                }
        // 2.빌더를 사용해 다이어리를 만든다
        Diary diary = Diary.builder()
                .user(user) // userSqno 대신 객체 자체를 넣어준다.
                .title(diaryRequest.getDiaryTitle() != null ? diaryRequest.getDiaryTitle() : "Untitled")
                .author(diaryRequest.getAuthor() != null ? diaryRequest.getAuthor() : "Undefined")
                .userId(safeUserId)
                .content(diaryRequest.getDiaryContent() != null ? diaryRequest.getDiaryContent() : "")
                .tag1(diaryRequest.getTag1() != null ? diaryRequest.getTag1() : "")
                .tag2(diaryRequest.getTag2() != null ? diaryRequest.getTag2() : "")
                .tag3(diaryRequest.getTag3() != null ? diaryRequest.getTag3() : "")
                .emotion(diaryRequest.getDiaryEmotion() != null ? diaryRequest.getDiaryEmotion() : 0)
                .diaryStatus(diaryRequest.getDiaryStatus() != null ? diaryRequest.getDiaryStatus() : "true")
                .diaryType(diaryRequest.getDiaryType() != null ? diaryRequest.getDiaryType() : "N")
                .frstRegIp(ip != null ? ip : "127.0.0.1")
                .selectedTimes(selectedTimesJson) // → DB에 저장할 수 있도록 문자열로 바꾸는 처리도 고려
                .drugMorning(diaryRequest.getDrugMorning() != null ? diaryRequest.getDrugMorning() : "")
                .drugLunch(diaryRequest.getDrugLunch() != null ? diaryRequest.getDrugLunch() : "")
                .drugDinner(diaryRequest.getDrugDinner() != null ? diaryRequest.getDrugDinner() : "")
                .build();


        System.out.println("@@@Diary 객체 생성 값: " + diary);

//        diaryRepository.insertDiary(diary);
        diaryRepository.save(diary);
    }
    public PageInfo<DiaryResponse> selectMemberDiaryList(Authentication authentication, int pageNo, int pageSize) {
        // 1. 현재 로그인한 사용자 정보 가져오기
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String email = userDetails.getUsername(); // email추출
        // 2. DB에서 유저 객체 찾기
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        // 3. 페이징 설정 및 해당 유저의 데이터만 조회
        Pageable pageable = PageRequest.of(pageNo -1, pageSize);
        List<Diary> diaries = diaryRepository.findMemberDiaryList(user.getUserSqno(), "N", pageable);
        int totalCount = diaryRepository.countByUserAndDelYn(user, "N");
        // 4. DTO 변환 및 결과 반환
        List<DiaryResponse> diaryResponseList = diaries.stream().map(this::convertToDto).collect(Collectors.toList());
        PageInfo<DiaryResponse> pageInfo = new PageInfo<>(diaryResponseList);
        pageInfo.setTotal(totalCount);
        return pageInfo;
    }
}