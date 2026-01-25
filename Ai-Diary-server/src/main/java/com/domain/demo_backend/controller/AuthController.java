package com.domain.demo_backend.controller;

import com.domain.demo_backend.service.AuthService;
import com.domain.demo_backend.token.domain.RefreshToken;
import com.domain.demo_backend.token.domain.RefreshTokenRepository;
import com.domain.demo_backend.token.domain.TokenResponse;
import com.domain.demo_backend.user.domain.User;
import com.domain.demo_backend.user.dto.*;
import com.domain.demo_backend.util.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "회원 권한 로직 컨트롤러", description = "로그인, 회원가입 (-- 로그아웃, 회원탈퇴, 회원가입, 비밀번호 변경, 이메일 인증/재인증 , 회원탈퇴")
public class AuthController {
    @PostConstruct
    public void init() {
        System.out.println(" refreshTokenRepository: " + refreshTokenRepository);
    }


    private final Logger log = LoggerFactory.getLogger(AuthController.class);
    private Map<String, String> emailVerificationMap = new HashMap<>();
    private JwtUtil jwtUtil;
    private final AuthService authService;
    private User user;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    // 생성자 주입
    @Autowired
    public AuthController(AuthService authService, JwtUtil jwtUtil) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    @Operation(summary = "회원 로그인", description = "id와 password와 haspassword가 일치하다면 로그인, 아니면 팝업 경고창이 뜬다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "일반 회원 로그인 성공"),
            @ApiResponse(responseCode = "401", description = "아이디 또는 비밀번호 불일치"),
            @ApiResponse(responseCode = "403", description = "계정 비 활성화 또는 회원탈퇴"),
            @ApiResponse(responseCode = "500", description = "서버오류"),
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            TokenResponse tokenResponse = authService.login(loginRequest);

           //  실서비스에서는 refreshToken은 HttpOnly + Secure + SameSite=None 쿠키로 가게 해야한다.

            ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
                    .httpOnly(true)
                    .secure(true) // HTTPS 환경에선 반드시 true
                    .path("/")
                    .sameSite("None") // 크로스사이트 허용
//                    .maxAge(7 * 24 * 60 * 60) // 7일
                    .build();
                // @@@@ 2026-01-25 .maxAge 주석 -> refreshToken의 쿠키를 새션 동안만 유효한것으로 인식, 브라우저 창을 완전히 닫으면 쿠키가 자동 파기

            /**
             *
             ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
             .httpOnly(true)
             .secure(false)  //  HTTPS 환경 아니므로 false
             .path("/")
             .sameSite("Lax")  //  로컬 테스트용 (or None도 되지만 Secure false면 무시됨)
             .maxAge(7 * 24 * 60 * 60)
             .build();
             */
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                    .body(Map.of(
                            "accessToken", tokenResponse.getAccessToken(),
                            "refreshToken", tokenResponse.getRefreshToken()
                    ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "로그인 실패",
                    "message", e.getMessage()
            ));
        }
    }

    @Operation(summary = "회원 가입페이지에서 회원가입 로직", description = "users 테이블에 insert한다..")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "users 테이블에 insert 성공"),
            @ApiResponse(responseCode = "400", description = "입력값 오류"),
            @ApiResponse(responseCode = "409", description = "이미 존재하는 사용자"),
            @ApiResponse(responseCode = "500", description = "서버오류"),
    })
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest registerRequest) {
        log.info("registerRequest: " + registerRequest);
        authService.register(registerRequest);
        log.info("register service logic OK");
        return ResponseEntity.ok("User registred successfully!");
    }


    @Operation(summary = "회원 가입 로직 이후 이메일 인증 전송로직", description = "users테이블에 code(인증번호)와 verify(Y) update")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "users테이블에 code(인증번호)와 verify(Y) update 성공"),
            @ApiResponse(responseCode = "400", description = "입력값 오류"),
            @ApiResponse(responseCode = "409", description = "이미 존재하는 사용자"),
            @ApiResponse(responseCode = "500", description = "서버오류"),
    })
    @PostMapping("/signup")
    public  ResponseEntity<?>  sendVerificationCode(@RequestBody RegisterRequest registerRequest, @RequestParam String message) throws MessagingException {

        log.info("유효성 평가 ");
//        authService.beforesendVerificationCode(registerRequest);
        log.info("회원가입 하기 위해 인증코드 전송 ");
        String email = registerRequest.getEmail();
        // 랜덤 인증 코드 생성
        String verificationCode = authService.sendVerificationCode(email);
        // 인증 코드를 Map에 저장
        emailVerificationMap.put(email, verificationCode);

        // 이메일 전송 시뮬레이션(실제 서비스에서는 이메일 전송 API)
        log.info("이메일 전송: " + email);
        log.info("메시지: " + message);

        String savedCode = emailVerificationMap.get(email);
//        return "인증 코드가 다음 이메일로 전송되었습니다." + email;
        return ResponseEntity.ok(Map.of("message", "인증 코드가 이메일로 전송되었습니다.", "email", registerRequest.getEmail()));

    }

    @Operation(summary = "get방식의 /signUp", description = "url에서 signUp이 잘 되는지 테스트.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "성공"),
            @ApiResponse(responseCode = "400", description = "입력값 오류"),
            @ApiResponse(responseCode = "409", description = "이미 존재하는 사용자"),
            @ApiResponse(responseCode = "500", description = "서버오류"),
    })
    @GetMapping("/signUp")
    public  ResponseEntity<?>  sendVerificationCodeByGet(@RequestBody RegisterRequest registerRequest, @RequestParam String message) throws MessagingException {

        log.info("get 테스트 회원가입 하기 위해 인증코드 전송 ");
        String email = registerRequest.getEmail();

        String verificationCode = authService.sendVerificationCode(email);
        emailVerificationMap.put(email, verificationCode);

        return ResponseEntity.ok(Map.of(
                "message", "인증 코드가 이메일로 전송되었습니다.",
                "email", email
        ));
    }


    @Operation(summary = "회원 가입 인증 번호 확인", description = "회원 가입 인증 번호를 확인.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "회원 가입 인증  번호 확인 성공"),
            @ApiResponse(responseCode = "400", description = "입력값 오류"),
            @ApiResponse(responseCode = "409", description = "이미 존재하는 사용자"),
            @ApiResponse(responseCode = "500", description = "서버오류"),
    })
    @PostMapping("/verify-code")
    public ResponseEntity<String> verifyCode(@RequestBody RegisterRequest request){
        if (request.getEmail() == null || request.getCode() == null) {
            return ResponseEntity.badRequest().body("이메일 또는 인증 코드가 누락되었습니다.");
        }

        boolean isValid = authService.verifyCode(request.getEmail(), request.getCode());
        if (isValid) {
            return ResponseEntity.ok("인증 성공!");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("인증 실패! 코드를 다시 확인해주세요.");
        }
    }

    @Operation(summary = "회원 가입 인증  번호 재전송", description = "회원 가입 인증  번호 다시확인한다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "회원 가입 인증  번호 재전송 성공"),
            @ApiResponse(responseCode = "400", description = "입력값 오류"),
            @ApiResponse(responseCode = "409", description = "이미 존재하는 사용자"),
            @ApiResponse(responseCode = "500", description = "서버오류"),
    })
    @PostMapping("/resend-code")
    public ResponseEntity<String> resendVerificationCode(@RequestBody RegisterRequest request) {
        try {
            authService.resendVerification(request.getEmail());
            return ResponseEntity.ok(" 새 인증코드가 이메일로 전송되었습니다!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(" 인증코드 재전송에 실패했습니다.");
        }
    }

    @Operation(summary = "회원 탈퇴", description = "사용자 계정의 del_yn flag를 'Y' -> 'N'로 표시한다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "회원탈퇴 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "사용자 정보 없음"),
            @ApiResponse(responseCode = "500", description = "서버오류"),
    })
    @PostMapping("/non-user")
    public ResponseEntity<String> nonUser(@RequestBody RegisterRequest registerRequest) {
        log.info("회원탈퇴 요청 진입: " + registerRequest);
        log.info("회원탈퇴 진입");
        if (registerRequest.getEmail() == null || registerRequest.getEmail().isEmpty()) {
            log.info("회원탈퇴 실패: userId가 비어 있음");
            return ResponseEntity.badRequest().body("회원 아이디가 필요합니다.");
        }

        try {
            authService.nonMember(registerRequest);
            return ResponseEntity.ok("회원탈퇴 성공");
        } catch (IllegalArgumentException e) {
            log.info("회원탈퇴 실패: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.info("회원탈퇴 실패: 서버 내부 오류");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 오류 발생");
        }
    }


    @Operation(summary = "비밀번호 변경 로직", description = "users테이블에 변경된 비빌번호로 password update")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "users테이블에 비밀번호 변경 성공"),
            @ApiResponse(responseCode = "400", description = "입력값 오류"),
            @ApiResponse(responseCode = "500", description = "서버오류"),
    })
    @PostMapping("/editPassword")
    public ResponseEntity<?> editPassword(@RequestBody PasswordDto passwordDto) {
        log.info("비밀변호 변경 요청 진입: " + passwordDto);
        log.info("비밀변호 변경 진입");
        if (passwordDto.getEmail() == null || passwordDto.getEmail().isEmpty()) {
            log.info("비밀변호 변경 실패: userId가 비어 있음");
            return ResponseEntity.badRequest().body("회원 아이디가 필요합니다.");
        }
        try {
            authService.editPassword(passwordDto);
            return ResponseEntity.ok("비밀변호 변경 성공");
        } catch (IllegalArgumentException e) {
            log.info("비밀변호 변경 실패: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.info("비밀변호 변경 실패: 서버 내부 오류");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 오류 발생");
        }
    }


    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        try {
            if (refreshToken == null || refreshToken.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("쿠키에 refreshToken이 없어요");
            }

            // 1. 토큰 유효성 먼저 검증 (jwtUtil에서 만료 체크)
            log.info("@@@@@  토큰 유효성 먼저 검증 ");
            Claims claims = jwtUtil.validateToken(refreshToken);
            String email = claims.getSubject();
            //  2. DB에 저장된 리프레시 토큰과 비교
            log.info("@@@@@ DB에 저장된 리프레시 토큰과 비교");
        RefreshToken saved = refreshTokenRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("DB에 토큰이 없어요"));

            if (!saved.getRefreshToken().equals(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("리프레시 토큰이 유효하지 않아요");
            }
            //3. 새 Access Token 발급
            log.info("@@@@@  새 Access Token 발급");
            String newAccessToken = jwtUtil.createAccessToken(user);
            return ResponseEntity.ok(Map.of("accessToken", newAccessToken));

        } catch (ExpiredJwtException e) {
            log.info("@@@@@ 리프레시 토큰이 만료");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("리프레시 토큰이 만료됐어요. 다시 로그인 해주세요!");
        } catch (Exception e) {
            log.info("@@@@@ 토큰 오류");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("토큰 오류: " + e.getMessage());
        }
    }
}