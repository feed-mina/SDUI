package com.domain.demo_backend.util; // 패키지 경로를 util로 변경

import com.domain.demo_backend.token.domain.RefreshToken;
import com.domain.demo_backend.token.domain.RefreshTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException; // 에러 해결을 위한 임포트
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException; // 에러 해결을 위한 임포트
import java.util.Date;
import java.util.Optional;

// 정적 임포트를 통해 verify, times, any, given을 바로 사용합니다.
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JwtAuthenticationFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    public void setUp() {
        // JwtAuthenticationFilter의 수동 생성자를 지우고 @RequiredArgsConstructor를 사용 중이어야 합니다.
        jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtUtil, refreshTokenRepository);
    }

    @Test
    @DisplayName("로그인 30분 후 요청 시 Redis 갱신 로직이 호출되어야 한다")
        // 이미지 6, 7번의 'unreported exception' 에러를 해결하기 위해 throws를 추가합니다.
    void shouldUpdateRedisTtlAfter30Minutes() throws ServletException, IOException {
        // Given
        String token = "valid-token";
        String email = "paging@test.com";
        Long userSqno = 1L;

        // 35분 전에 발행된 토큰 설정 (passedTime > 30분 조건 충족)
        Date issuedAt = new Date(System.currentTimeMillis() - (1000L * 60 * 35));

        Claims claims = Jwts.claims().setSubject(email);
        claims.setIssuedAt(issuedAt);
        claims.put("userSqno", userSqno);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        given(jwtUtil.validateToken(token)).willReturn(claims);

        // 이미지 5번 관련: findByEmail 호출 시 가짜 객체 반환
        given(refreshTokenRepository.findByEmail(email))
                .willReturn(Optional.of(new RefreshToken(userSqno, email, "refresh-token", null)));

        // When
        // 같은 패키지(util)에 있으므로 protected 메서드인 doFilterInternal을 직접 호출할 수 있습니다.
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        // 30분이 지났으므로 save()가 호출되었는지 검증 (이미지 4번 에러 해결)
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
        verify(filterChain).doFilter(request, response);
    }
}