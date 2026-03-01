package com.domain.demo_backend.domain.user.service;

import com.domain.demo_backend.domain.token.domain.RefreshTokenRepository;
import com.domain.demo_backend.domain.token.domain.TokenResponse;
import com.domain.demo_backend.domain.user.domain.User;
import com.domain.demo_backend.domain.user.domain.UserRepository;
import com.domain.demo_backend.domain.user.dto.KakaoUserInfo;
import com.domain.demo_backend.global.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.Map;
import java.util.Optional;

@Service
public class KakaoService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final Logger log = LoggerFactory.getLogger(KakaoService.class);

    public KakaoService(RefreshTokenRepository refreshTokenRepository, JwtUtil jwtUtil, UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public KakaoUserInfo getKakaoUserInfo(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        HttpEntity<HttpHeaders> request = new HttpEntity<>(headers);

        log.info("KAKAOSERVICE-@@@@@@@@@@@@@@@@@@@@@@@@");
        log.info("KAKAOSERVICE-getKakaoUserInfo");
        log.info("KAKAOSERVICE-accessToken : " + accessToken);
        log.info("KAKAOSERVICE-request : " + request);

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://kapi.kakao.com/v2/user/me",
                HttpMethod.GET,
                request,
                Map.class
        );

        Map<String, Object> body = response.getBody();

        if (body == null) {
            throw new RuntimeException("카카오에서 사용자 정보를 받지 못했어요!");
        }

        log.info("KAKAOSERVICE-body : " + body);
        log.info("KAKAOSERVICE-response : " + response);

        try {
            Map<String, Object> kakaoAccount = (Map<String, Object>) response.getBody().get("kakao_account");
            Map<String, Object> properties = (Map<String, Object>) body.get("properties");

            log.error("@@@@@kakaoAccount", kakaoAccount);
            log.error("@@@@@properties", properties);

            Long id = ((Number) body.get("id")).longValue();
            String connectedAt = (String) body.get("connected_at");
            String nickname = (String) properties.get("nickname");
//        String email = (kakaoAccount.get("email") != null) ? kakaoAccount.get("email").toString() : null;
            String email = (kakaoAccount.get("email") != null) ? kakaoAccount.get("email").toString() : null;
            if (email == null || email.isBlank()) {
                email = "kakao_" + id + "@noemail.kakao"; // 가짜 이메일 생성
            }

            String userId = email != null && email.contains("@") ? email.split("@")[0] : "kakao_user";

            boolean hasEmail = (Boolean) kakaoAccount.getOrDefault("has_email", false);
            boolean isEmailValid = (Boolean) kakaoAccount.getOrDefault("is_email_valid", false);
            boolean isEmailVerified = (Boolean) kakaoAccount.getOrDefault("is_email_verified", false);
            boolean hasAgeRange = (Boolean) kakaoAccount.getOrDefault("has_age_range", false);
            boolean hasBirthday = (Boolean) kakaoAccount.getOrDefault("has_birthday", false);
            boolean hasGender = (Boolean) kakaoAccount.getOrDefault("has_gender", false);
            if (email == null || email.isBlank()) {
                log.error("카카오에서 이메일 정보를 받아오지 못했습니다.");
                throw new RuntimeException("카카오에서 이메일 정보를 받아오지 못했습니다.");
            }

            log.info("KAKAOSERVICE-kakaoAccount : " + kakaoAccount);
            log.info("KAKAOSERVICE-properties : " + properties);

            log.info("KAKAOSERVICE-nickname : " + nickname);

        } catch (Exception e) {
            log.error(" 카카오 사용자 정보 가져오기 실패", e);
            throw new RuntimeException("카카오 사용자 정보 가져오기 실패: " + e.getMessage());
        }
        return KakaoUserInfo.fromMap(body, accessToken);
    }

    @Transactional
    public TokenResponse registerKakaoUser(KakaoUserInfo kakaoUserInfo, String accessToken) {
        log.info("KAKAOSERVICE-사용자 확인: {}", kakaoUserInfo.getEmail());


        User user = userRepository.findByEmail(kakaoUserInfo.getEmail())
                .map(existingUser -> {
                    // 탈퇴한 유저라면 재활성화
                    if ("Y".equals(existingUser.getDelYn())) {
                        existingUser.setDelYn("N");
                        existingUser.setUpdatedAt(LocalDateTime.now());
                    }
                    return existingUser;
                })
                .orElseGet(() -> {
                    log.info("KAKAOSERVICE-신규 카카오 유저 가입");
                    return userRepository.save(User.builder()
                            .userId(kakaoUserInfo.getEmail().split("@")[0])
                            .password("") // 소셜 로그인은 비밀번호가 의미 없음
                            .hashedPassword("")
                            .email(kakaoUserInfo.getEmail())
                            .phone("111-111-111")
                            .role("ROLE_USER")
                            .verifyYn("Y")
                            .socialType("K")
                            .delYn("N")
                            .createdAt(LocalDateTime.now())
                            .build());
                });

        // 2. 토큰 발행 (딱 한 번만 호출!)

        // 5. JWT 발급
        return jwtUtil.generateTokens(user);
    }
}