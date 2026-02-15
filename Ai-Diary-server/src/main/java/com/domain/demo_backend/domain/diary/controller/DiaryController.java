package com.domain.demo_backend.domain.diary.controller;

import com.domain.demo_backend.diary.domain.Diary;
import com.domain.demo_backend.diary.dto.DiaryRequest;
import com.domain.demo_backend.diary.dto.DiaryResponse;
import com.domain.demo_backend.domain.diary.service.DiaryService;
import com.domain.demo_backend.domain.user.service.UserInfoHelper;
import com.domain.demo_backend.global.security.CustomUserDetails;
import com.domain.demo_backend.service.KakaoService;
import com.domain.demo_backend.util.JwtUtil;
import com.github.pagehelper.PageInfo;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/diary")
public class DiaryController {
    private final DiaryService diaryService;

    private final KakaoService kakaoService;
    private final JwtUtil jwtUtil;

    @Autowired
    public DiaryController(DiaryService diaryService, KakaoService kakaoService,JwtUtil jwtUtil) {
        this.diaryService = diaryService;
        this.kakaoService = kakaoService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/viewDiaryItem/{diaryId}")
    @ResponseBody
    public ResponseEntity<?> viewDiaryItem(@PathVariable("diaryId") Long diaryId, @RequestParam(value = "userId", required = false) String userId,  @RequestHeader(value = "X-Current-User-Id", required = false) String currentUserId,  @RequestHeader(value = "Authorization", required = false) String authorizationHeader, HttpServletRequest request) {
//        String userId = userIds != null && !userIds.isEmpty() ? userIds.get(0) : null;

        System.out.println("@@@@@@ viewDiaryItem diaryId"+diaryId);
        System.out.println("@@@ viewDiaryItem userId"+userId);
        System.out.println("@@@ viewDiaryItem currentUserId"+currentUserId);
        System.out.println("@@@ viewDiaryItem request"+request);

        if (userId == null) {
            return ResponseEntity.badRequest().body("userId가 필요합니다."); // userId 없으면 오류 응답
        }

        String token = authorizationHeader.substring(7);
        Claims claims = jwtUtil.validateToken(token);
        currentUserId = claims.get("userId", String.class);
        System.out.println("@@@ viewDiaryItem authorizationHeader"+authorizationHeader);
        System.out.println("@@@ viewDiaryItem token"+token);
        System.out.println("@@@ viewDiaryItem claims"+claims);
   /*
        if (currentUserId == null && authorizationHeader == null && !authorizationHeader.startsWith("Bearer ")) {
            currentUserId = claims.get("userId", String.class);
            System.out.println("@@@ viewDiaryItem currentUserId"+currentUserId);
        }else {
            System.out.println("@@@ 로그인 정보가 없습니다");
        }
    */
        DiaryRequest diaryReq = new DiaryRequest();
        // userId랑 diaryId랑 diaryReq로 받는다
        diaryReq.setDiaryId(diaryId);
        diaryReq.setUserId(userId);

        System.out.println("@@@viewDiaryItem 다이어리  로직 진입");
        System.out.println("@@@5--diaryReq:: " + diaryReq);
        try {
            System.out.println("@@@viewDiaryItem 서비스 로직 진입");
            Optional<Diary> diaryItem = diaryService.viewDiaryItem(diaryReq);
            System.out.println("@@@6--selectDiaryList 서비스:: " + diaryItem);
            Map<String, Object> response = new HashMap<>();
            response.put("diaryItem", diaryItem);
            System.out.println("@@@7--selectDiaryList diaryItem:: " + diaryItem);
            System.out.println("@@@7--selectDiaryListresponse:: " + response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }

    }

    @PostMapping("/addDiaryList")
    @ResponseBody
    public ResponseEntity<?> addDiaryList(
            HttpServletRequest request,
            HttpServletResponse response,
            @RequestBody DiaryRequest diaryRequest, Authentication authentication
    ) {
        // 1) 헤더에서 IP 가져오기
        String ip = request.getHeader("X-Forwarded-For");
        System.out.println("@@@addDiaryList request" + request);
        System.out.println("@@@addDiaryList request.getHeader(\"X-Forwarded-For\")" + request.getHeader("X-Forwarded-For"));
        // 2) 없으면 request.getRemoteAddr() 사용
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        System.out.println("@@@클라이언트 IP: " + ip);
        // 2. 현재 로그인한 사용자 정보 꺼내기
        CustomUserDetails currentUser = UserInfoHelper.getMemberInfo();
        System.out.println("@@@currentUser 값: " + currentUser);

        diaryRequest.setUserSqno(currentUser.getUserSqno());
        diaryRequest.setUserId(currentUser.getUserId());
        diaryRequest.setEmail(currentUser.getUsername());
        diaryRequest.setAuthor(currentUser.getUserId());

        System.out.println("@@@ [안전하게 세팅된] diaryRequest: " + diaryRequest);

        try {
            diaryService.addDiary(diaryRequest, ip, SecurityContextHolder.getContext().getAuthentication());

            return ResponseEntity.ok().body(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("유효하지 않은 요청입니다");
        } catch (Exception e) {
            System.err.println("서버 오류: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버에서 오류가 발생했습니다.");
        }

    }
// 보안컨텍스트 SecurityContextHolder에 담긴 검증된 유저 정보를 사용
    @GetMapping("/member-diaries")
    public ResponseEntity<?> getMemberDiaries(@RequestParam(value = "pageNo", defaultValue = "1") int pageNo, @RequestParam(value = "pageSize", defaultValue = "5") int pageSize) {
        // 현재 인증된 유저 정보 가져오기
        System.out.println("@@@ 다이어리 불러오기 시작");
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        try{
            PageInfo<DiaryResponse> diaryList = diaryService.selectMemberDiaryList(authentication, pageNo, pageSize);
            return ResponseEntity.ok(diaryList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

}