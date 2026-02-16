package com.domain.demo_backend.global.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;


@Getter
@Setter
public class CustomUserDetails extends User {
    // Spring Security의 SecurityContextHolder에서 인증 정보 가져오기
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    private Long userSqno;
    private String email;
    private String hashedPassword;
    private String userId;

    // Constructor for CustomUserDetails
    public CustomUserDetails(String email, Long userSqno, String userId, Collection<? extends GrantedAuthority> authorities) {
        // Call the superclass (User) constructor
        super(email, "dummy_password", authorities);
        this.email = email;
        this.userId = userId;
        this.userSqno = userSqno;
    }

    public Long getUserSqno() {
        return this.userSqno;
    }
}
