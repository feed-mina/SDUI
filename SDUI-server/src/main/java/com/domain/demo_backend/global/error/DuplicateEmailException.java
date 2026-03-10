package com.domain.demo_backend.global.error;

import com.domain.demo_backend.global.error.BusinessException;

public class DuplicateEmailException extends BusinessException {
    public DuplicateEmailException() {
        super(ErrorCode.EMAIL_NOT_VERIFIED); // 이전에 만든 '이미 가입된 이메일' 코드 사용
    }
}