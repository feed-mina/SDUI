package com.domain.demo_backend.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerificationRequest {
    private String Email;
    private String code;
}
