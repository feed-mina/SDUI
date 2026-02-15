package com.domain.demo_backend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class RegisterRequest {
    private String userId;
    @NotBlank(message = "이름은 필수입니다.")
    private String username;
    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;
    // private String hashedPassword;
    private String role;
    private String phone;

    @Email(message = "유효한 이메일을 입력하세요.")
    private String email;
    // private String nickname;
    private LocalDate createdAt;
    private String updatedAt;

    private String accessToken;
    //이메일 인증 코드
    private String code;
}
