package com.domain.demo_backend.domain.user.service;


import com.domain.demo_backend.global.error.DuplicateEmailException;
import com.domain.demo_backend.global.error.ErrorCode;
import com.domain.demo_backend.global.security.PasswordUtil;
import com.domain.demo_backend.global.error.BusinessException;
import com.domain.demo_backend.domain.token.domain.TokenResponse;
import com.domain.demo_backend.domain.user.domain.User;
import com.domain.demo_backend.domain.user.domain.UserRepository;
import com.domain.demo_backend.domain.user.dto.LoginRequest;
import com.domain.demo_backend.domain.user.dto.PasswordDto;
import com.domain.demo_backend.domain.user.dto.RegisterRequest;
import com.domain.demo_backend.global.security.JwtUtil;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Random;

@Service
public class AuthService {
    private final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Autowired
    private JavaMailSender mailSender;


    public AuthService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public TokenResponse login(LoginRequest loginRequest) {
        // 탈퇴한 유저가 delYn ='N' 이면 계정정보가 없다 . 또는 에러가 나면 계정정보가 없다라고 떠야한다.

        //  이메일로 사용자 조회
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));


        //  이메일 인증 여부 확인 (verifyYn 필드 사용)
        if (!"Y".equals(user.getVerifyYn())) {
            throw new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED); // 에러코드 추가 필요
        }


        //  비밀번호 검증 (PasswordUtil 사용)
        String encryptedInputPw = PasswordUtil.sha256(loginRequest.getPassword());
        if (!user.getHashedPassword().equals(encryptedInputPw)) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }


        // 로그인 시각 갱신 (더티 체킹에 의해 자동 업데이트됨)
        user.setUpdatedAt(LocalDateTime.now());
        // 5. JWT 발급
        return jwtUtil.generateTokens(
                user.getEmail(),
                user.getUserSqno(),
                String.valueOf(user.getUserId())
        );
    }


    // 새 사용자 정보를 해시처리 후 데이터베이스에 저장
    // 이미 존재하는 사용자 아이디인지 확인하고 중복되면 예외 발생
    @Transactional
    public void register(RegisterRequest registerRequest) {

        // 1. 중복 체크인 먼저 수행
        userRepository.findByEmail(registerRequest.getEmail()).ifPresent(u -> {
            throw new DuplicateEmailException();
        });

        Date date = new Date();
        LocalDateTime ldt = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        User reactiveUser = userRepository.findByEmail(registerRequest.getEmail()).orElse(null);

        if (reactiveUser != null) {
            if ("Y".equals(reactiveUser.getDelYn())) {
                // 기존 탈퇴 유저 - 재가입 처리
                LocalDate withdrawDate = reactiveUser.getWithdrawAt().toLocalDate();
                LocalDate now = LocalDate.now();

                if (ChronoUnit.DAYS.between(withdrawDate, now) < 7) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "탈퇴 후 7일이 지나야 재가입이 가능합니다.");
                } else {
                    User user = User.builder()
                            .userId(registerRequest.getEmail().split("@")[0])
                            .password(registerRequest.getPassword())
                            .hashedPassword(PasswordUtil.sha256(registerRequest.getPassword()))
                            .phone(registerRequest.getPhone())
                            .email(registerRequest.getEmail())
                            .delYn("N")
                            .verifyYn("Y") // 다시 인증했음으로 변경
                            .socialType("N") // 일반가입은 N!
                            .updatedAt(ldt)
                            .withdrawAt(LocalDateTime.parse("2100-12-31 24:59:59"))
                            .build();
                    // 재가입 허용 update
                    userRepository.save(user); // delYn을 'N'으로 , verifyYn 을 'Y'로 바꾸고 새로 정보 업데이트
                    return;
                }
            } else {
                throw new DuplicateEmailException();
            }
        }
        if (userRepository.findByEmail(registerRequest.getEmail()) != null) {
            throw new DuplicateEmailException();
        }
        if (userRepository.findByPhone(registerRequest.getPhone()) != null) {
            log.info("  250527_회원가입 핸드폰 실패");
            throw new IllegalArgumentException("이미 존재하는 핸드폰 번호입니다.");
        }

        if (userRepository.findByEmailAndDelYn(registerRequest.getEmail(), "Y").isPresent()) {
            log.info("  250527_탈퇴한 유저");
            throw new IllegalArgumentException("탈퇴한 계정은 7일 동안 재가입할 수 없습니다..");
        }
        log.info("  250527_유효성 통과");
        User user = User.builder()
                .userId(registerRequest.getEmail().split("@")[0])
                .password(registerRequest.getPassword())
                .hashedPassword(PasswordUtil.sha256(registerRequest.getPassword()))
                .phone(registerRequest.getPhone())
                .email(registerRequest.getEmail())
                .role("ROLE_USER")
                .verifyYn("N") // 카카오는 인증 완료니까 Y!
                .socialType("N") // 일반가입은 N!
                .createdAt(ldt)
                .build();
        log.info("  250527_user: " + user);
        log.info("  250527_user Mapper insertUser 시작");
//        userRepository.insertUser(user);
    }


    public String sendVerificationCode(String email) throws MessagingException {
        //랜덤 인등코드 생성
        String verificationCode = generateRendomCode();
        // DB에 인증코드, 만료시간 저장
//        userRepository.updateVerificationCode(email, verificationCode);
        // 이메일 작성 및 전송
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");
        helper.setTo(email);
        //  Your GitHub launch code

        helper.setSubject("📨 이메일 인증 코드 발송");

        String emailContent = "<div style='padding:20px; font-family:Arial; text-align:center;'>"
                + "<h2>🚀 회원가입 인증 코드</h2>"
                + "<p>아래 인증 코드를 입력해주세요!</p>"
                + "<h1 style='color:#4CAF50;'>" + verificationCode + "</h1>"
                + "<p>감사합니다 😊</p>"
                + "</div>";

        helper.setText(emailContent, true);   // 여기 true가 HTML이라는 뜻이야!

        mailSender.send(message);

        return verificationCode; // 인증 코드 반환

    }

    private String generateRendomCode() {
        Random random = new Random();
        int code = 1000000 + random.nextInt(10000);
        // 랜덤 6자리 숫자 생성
        return String.valueOf(code);
    }

    // 회원가입 페이지 이후 인증번호 코드 페이지
    @Transactional
    public boolean verifyCode(String email, String code) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("사용자가 없습니다"));

        if (user == null) {
            log.error("사용자를 찾을 수 없음: {}", email);
            return false;
        }

        if (!code.equals(user.getVerificationCode())) {
            log.error(" 인증 실패: 코드 불일치 -> 입력한 코드: {}, 저장된 코드: {}", code, user.getVerificationCode());
            return false;
        }

        // 인증 성공 → verifyYn = 'Y'
//      userRepository.updateVerifyYn(email);
        user.setVerifyYn("Y");
        return true; // 코드가 틀리면 false
    }

    public void resendEmail(String email, String verificationCode) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");

        helper.setTo(email);
        helper.setSubject("📨 이메일 인증 코드 재발송");

        String emailContent = "<div style='padding:20px; font-family:Arial; text-align:center;'>"
                + "<h2>📨 이메일 인증 코드</h2>"
                + "<p>아래 인증 코드를 입력해주세요!</p>"
                + "<h1 style='color:#4CAF50;'>" + verificationCode + "</h1>"
                + "<p>감사합니다 😊</p>"
                + "</div>";

        helper.setText(emailContent, true);

        mailSender.send(message);
    }

    // 인증코드 재발송 로직
    public void resendVerification(String email) throws MessagingException {
        LoginRequest loginRequest = new LoginRequest();
        User user = userRepository.findByEmail(loginRequest.getEmail()).orElse(null);

        if (user == null) {
            throw new IllegalArgumentException("존재하지 않는 사용자입니다: " + email);
        }

        String verificationCode = generateRendomCode();
        user.setVerificationCode(verificationCode);
        resendEmail(email, verificationCode);
    }

    // 이미 존재하는 사용자인지 email(외래키),jwtToken 확인하고  update문으로 delyn,updateAt 값 변경
    @Transactional
    public void nonMember(RegisterRequest registerRequest) {
        Date date = new Date();
        LocalDateTime ldt = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        User existingUser = userRepository.findByEmail(registerRequest.getEmail()).orElseThrow(() -> new IllegalArgumentException("사용자가 없습니다"));
        if (existingUser == null) {
            log.info("  250527_회원탈퇴 실패: 해당 사용자가 존재하지 않습니다.");
            throw new IllegalArgumentException("해당 사용자가 존재하지 않습니다.");
        }
        // 회원탈퇴 처리
        existingUser.setDelYn("Y");
        existingUser.setVerifyYn("N");
        existingUser.setVerificationCode("0000000");
        existingUser.setUpdatedAt(ldt);
        existingUser.setWithdrawAt(ldt);
        log.info("  250527_existingUser : " + existingUser);
        log.info("  250527_user Mapper nonMember 시작");
        log.info("  250527_user 탈퇴 처리 완료: " + existingUser);
    }

    @Transactional
    public void editPassword(PasswordDto passwordDto) {
        Date date = new Date();
        LocalDateTime ldt = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        log.info("  250527_@@@@@비밀변호 변경 서비스 진입 email: " + passwordDto.getEmail());
        User existingUser = userRepository.findByEmail(passwordDto.getEmail()).orElseThrow(() -> new IllegalArgumentException("사용자가 없습니다"));
        if (existingUser == null) {
            log.info("  250527_비밀변호 변경 실패: 해당 사용자가 존재하지 않습니다.");
            throw new IllegalArgumentException("해당 사용자가 존재하지 않습니다.");
        }
        // 비밀변호 변경 처리
        // 현재 있는 비밀번호를 delete 후 값을 새로 insert 해야 할까 아니면
        // update 쿼리를 써야할까
        existingUser.setUpdatedAt(ldt);
        // 비밀번호 암호화
        String newHashedPassword = PasswordUtil.sha256(passwordDto.getNewPassword());

        existingUser.setPassword(passwordDto.getCheckNewPassword());
        existingUser.setHashedPassword(newHashedPassword);
        existingUser.setUpdatedAt(ldt);
        //  userRepository.editPassword(existingUser); // 기존 레코드를 update
        existingUser.setHashedPassword(newHashedPassword);
        System.out.println("existingUser : " + existingUser);
        System.out.println("user Mapper nonMember 시작");
        System.out.println("user 탈퇴 처리 완료: " + existingUser);
    }
}