package com.domain.demo_backend.domain.token.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED) // 보안을 위해서...
// 20260125 Redis 로직 추가
@RedisHash(value = "refreshToken", timeToLive = 60 * 60 * 3)
public class RefreshToken {

    @Id
    private Long userSqno;
    private String email;

    private String refreshToken;

    private LocalDateTime expiration;

    public RefreshToken(Long userSqno, String email, String refreshToken, LocalDateTime expiration) {
        this.userSqno = userSqno;
        this.email = email;
        this.refreshToken = refreshToken;
        this.expiration = expiration;
    }

}
