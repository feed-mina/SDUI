package com.domain.demo_backend.helper;

public enum ErrorCode {
    // Auth
    INVALID_CREDENTIALS(401, "AUTH_001", "아이디 또는 비밀번호가 일치하지 않습니다."),
    ACCOUNT_DISABLED(403, "AUTH_002", "계정이 비활성화되었습니다."),
    ACCOUNT_WITHDRAWN(403, "AUTH_003", "이미 탈퇴한 회원입니다."),
    EMAIL_NOT_VERIFIED(403, "AUTH_004", "이메일 인증이 완료되지 않았습니다."),
    // System
    INTERNAL_SERVER_ERROR(500, "SYS_001", "서버 내부 오류가 발생했습니다.");

    private final int status;
    private final String code;
    private final String message;

    ErrorCode(int status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }

    public int getStatus() { return status; }
    public String getCode() { return code; }
    public String getMessage() { return message; }
}
