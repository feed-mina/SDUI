package com.domain.demo_backend.service;

import com.domain.demo_backend.token.domain.RefreshTokenRepository;
import com.domain.demo_backend.token.domain.TokenResponse;
import com.domain.demo_backend.user.domain.User;
import com.domain.demo_backend.user.domain.UserRepository;
import com.domain.demo_backend.user.dto.KakaoUserInfo;
import com.domain.demo_backend.util.JwtUtil;
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

    public KakaoUserInfo getKakaoUserInfo(String accessToken){
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
            System.out.println("KAKAOSERVICE-@@@email: " + email);
            System.out.println("KAKAOSERVICE-@@@userId: " + userId);
        log.info("KAKAOSERVICE-email : " + email);
            System.out.println("KAKAOSERVICE-@@@KakaoUserInfo.fromMap(body, accessToken): " + KakaoUserInfo.fromMap(body, accessToken));
            log.info("KAKAOSERVICE-최종 email: " + email);
            log.info("KAKAOSERVICE-최종 userInfo: " + KakaoUserInfo.fromMap(body, accessToken));

        } catch (Exception e) {
            log.error(" 카카오 사용자 정보 가져오기 실패", e);
            throw new RuntimeException("카카오 사용자 정보 가져오기 실패: " + e.getMessage());
        }
        return KakaoUserInfo.fromMap(body, accessToken);
    }

    @Transactional
    public TokenResponse registerKakaoUser(KakaoUserInfo kakaoUserInfo, String accessToken){
        Date date = new Date();
        LocalDateTime ldt = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        log.info("KAKAOSERVICE-registerKakaoUser 진입 , 이메일이 있는지 확인 : " );
        // DB에서 같은 이메일이 있는지 확인해
        if(userRepository.findByEmail(kakaoUserInfo.getEmail()) != null){
            log.info("KAKAOSERVICE-카카오 사용자 이메일: " + kakaoUserInfo.getEmail());

            // 이미 존재하는 경우 updated_at 갱신
//            userRepository.updateUpdatedAt(kakaoUserInfo.getEmail());

            Optional<User> extiUser = userRepository.findByEmail(kakaoUserInfo.getEmail());
            System.out.println("KAKAOSERVICE-@@@@@@@@@useruserRepositorydByUSerEmail"+extiUser);

            TokenResponse tokenResponse  =  jwtUtil.generateTokens(
                    kakaoUserInfo.getEmail(),
                    kakaoUserInfo.getUserSqno(),
                    String.valueOf(kakaoUserInfo.getUserId())
            );
            log.info("KAKAOSERVICE-카카오 사용자 이메일: " + kakaoUserInfo.getEmail());

            // JWT 토큰을 생성해 반환해
            String jwtToken = "Bearer " + tokenResponse.getAccessToken();
            log.info("KAKAOSERVICE-jwtToken: " + jwtToken);
            System.out.println("KAKAOSERVICE-@@@@@@@@@jwtToken"+jwtToken);
//            return jwtToken;
return tokenResponse;
        }
        // 새로운 사용자 객체 생성 (빌더 패턴 사용)
        User user = User.builder()
                .userId(kakaoUserInfo.getEmail().split("@")[0])
                .password(accessToken)
                .hashedPassword(kakaoUserInfo.getHashedPassword())
                .email(kakaoUserInfo.getEmail())
                .phone("111-111-111")
                .verificationCode("K" + kakaoUserInfo.getPassword())
                .username(kakaoUserInfo.getNickname())
                .role("ROLE_USER")
                .verifyYn("Y") // 카카오는 이미 인증이 완료됐으니까 'Y'를 설정해
                .socialType("K") // 카카오의 소셜 타입은 'K'
                .createdAt(ldt)
                .sleepUsingType("N")
                .drugUsingType("N")
                .build();

        System.out.println("KAKAOSERVICE-@@@ kakao_login_user.getUserSqno() != null"  + user.getUserSqno() != null);
        System.out.println("KAKAOSERVICE-@@@ kakao_user!" + user);
        // DB에 저장 후 자동 생성된 사용자 고유 번호(userSqno)가 있으면
        if(user.getUserSqno() != null) {
            // 사용자 정보를 DB에 저장해
            userRepository.save(user);

            // JWT 토큰을 생성해 반환해
            TokenResponse tokenResponse  =  jwtUtil.generateTokens(user.getEmail(),user.getUserSqno(), user.getUserId() );
            String jwtToken = "Bearer " + tokenResponse.getAccessToken();
            log.info("KAKAOSERVICE-jwtToken: " + jwtToken);
            return tokenResponse;
        } else {
            log.info("KAKAOSERVICE-user: " + user);
            log.info("KAKAOSERVICE-user Mapper insertUser 시작");
            // 사용자 정보를 DB에 저장해
            userRepository.save(user);
            // JWT 토큰을 생성해 반환해
            TokenResponse tokenResponse  =  jwtUtil.generateTokens(user.getEmail(),user.getUserSqno(), user.getUserId() );
            String jwtToken = "Bearer " + tokenResponse.getAccessToken();
            log.info("KAKAOSERVICE-jwtToken: " + jwtToken);
            return tokenResponse ;
        }
    }

}