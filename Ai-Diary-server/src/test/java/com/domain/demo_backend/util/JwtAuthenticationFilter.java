package com.domain.demo_backend.util;

import com.domain.demo_backend.global.security.CustomUserDetails;
import com.domain.demo_backend.global.security.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Date;
import java.util.List;

@RequiredArgsConstructor
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    //    cloundfront 적용 후 프록시 설정으로 추가
    private static final List<String> EXCLUDE_URLS = List.of(
            "/api/auth/login",
            "/api/kakao/login"
    );
    private final JwtUtil jwtUtil;
    // 2026-01-25 RefreshTokenRepository 주입 성능개선
    private final com.domain.demo_backend.domain.token.domain.RefreshTokenRepository refreshTokenRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return EXCLUDE_URLS.stream().anyMatch(path::startsWith);
    }



    /*
     * @@@ 2026-01-25 사용자가 요청을 보낼때마다 만료시간을 3시간 뒤로 미루는 (슬라이딩 만료) 방법 추가
     * 필터 내에서 RefreshTokenRepository 주입받아 저장 > TTL 초기화
     * */


    @Override
    public void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authorizationHeader = request.getHeader("Authorization");
        System.out.println("@@@@Authorization Header: " + authorizationHeader);

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7);

            System.out.println("@@@@token : " + token);
            try {
                Claims claims = jwtUtil.validateToken(token); // 토큰 검증
                // 유효하지 않은 토큰 예외 처리
                System.out.println("@@@@claims: " + claims);
                String email = claims.getSubject();
                System.out.println("@@@@email : " + email);
                String userId = claims.get("userId", String.class);
                Long userSqno = claims.get("userSqno", Long.class);
                System.out.println("@@@@실제 userSqno : " + userSqno);

                if (email != null) {
                    /*
                     * @@@ 2026-01-25 RefreshTokenRepository 주입받아 저장 > TTL 초기화
                     * 슬라이딩 만료 최적화
                     * */
                    Date issuedAt = claims.getIssuedAt();
                    long now = System.currentTimeMillis();
                    long passedTime = now - issuedAt.getTime();

                    // 2026-01-25 로그인(토큰 발행)한지 30분이 지났는지 확인
                    if (passedTime > 1000L * 60 * 30) {
                        // 2026-01-25 Redis 갱신 (findById 후 save 할때 TTL 이 다시 3시간ㄴ으로 초기화)
                        // 30분 이후 요청에 대해서만 Redis 에 접근
                        refreshTokenRepository.findByEmail(email).ifPresent(existingToken -> {
                            refreshTokenRepository.save(existingToken);
                        });
                    }
                    List<GrantedAuthority> authorities = List.of(() -> "ROLE_USER");
                    System.out.println("@@@@authorities: " + authorities);
                    CustomUserDetails userDetails = new CustomUserDetails(email, userSqno, userId, List.of(new SimpleGrantedAuthority("ROLE_USER")));

                    System.out.println("@@@@userDetails: " + userDetails);
                    // 인증 토큰 생성
                    Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    System.out.println("@@@@authentication: " + authentication);

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                // 유효하지 않은 토큰 예외 처리
                System.err.println("Invalid JWT token: " + e.getMessage());
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401 응답 반환
                response.getWriter().write("Invalid JWT Token");
                return;
            }
        }
        filterChain.doFilter(request, response); // 다음 필터로 이동
        System.out.println("@@@@request: " + request);
        System.out.println("@@@@response: " + response);
    }


}
