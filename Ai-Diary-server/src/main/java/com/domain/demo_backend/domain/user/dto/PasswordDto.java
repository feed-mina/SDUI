package com.domain.demo_backend.user.dto;

import lombok.Data;

@Data
public class PasswordDto {
    private String newPassword;
    private String checkNewPassword;
    private String token;
    private String email;
}
