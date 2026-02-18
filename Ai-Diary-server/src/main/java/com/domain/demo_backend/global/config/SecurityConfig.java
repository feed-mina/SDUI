package com.domain.demo_backend.global.config;

import com.domain.demo_backend.domain.token.domain.RefreshTokenRepository;
import com.domain.demo_backend.domain.user.domain.UserRepository;
import com.domain.demo_backend.global.common.util.MockAuthFilter;
import com.domain.demo_backend.global.security.JwtAuthenticationFilter;
import com.domain.demo_backend.global.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.Http403ForbiddenEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity


public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final RefreshTokenRepository refreshTokenRepository;
    @Autowired
    private CustomUserDetailsService customUserDetailsService;


    @Autowired(required = false)
    private MockAuthFilter mockAuthFilter; // 테스트 프로필일 때만 주입됨

    @Autowired
    public SecurityConfig(JwtUtil jwtUtil, RefreshTokenRepository refreshTokenRepository) {
        this.jwtUtil = jwtUtil;
        this.refreshTokenRepository = refreshTokenRepository;
    }


    // 비밀번호 암호화 설정
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtUtil jwtUtil, UserRepository userRepository) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // CORS 설정 적용
                .csrf(csrf -> csrf.disable())  // CSRF 비활성화
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 인증 없이 접근 가능한 '화이트리스트' 설정
                        .requestMatchers(
                                "/api/auth/me",
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/kakao/**",
                                "/api/ui/**",
                                "/api/goalTime/**"
                        ).permitAll()
                        //  반드시 인증이 필요한 서비스 주소
                        .requestMatchers(
                                "/api/diary/**"
                        ).authenticated()
                        .anyRequest().permitAll()
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(new Http403ForbiddenEntryPoint()) //  403 Forbidden 반환 (Redirect 방지)
                )
                // 핵심 수정: MockAuthFilter가 null이 아니면(test 프로필이면) JWT 필터 앞에 추가 [cite: 2026-02-18]
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtUtil, refreshTokenRepository, userRepository),
                        UsernamePasswordAuthenticationFilter.class
                );

        if (mockAuthFilter != null) {
            http.addFilterBefore(mockAuthFilter, JwtAuthenticationFilter.class);
        }
        http.formLogin(f -> f.disable())
                .logout(l -> l.disable());
        return http.build();
    }

    // CORS 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:8080",
                "http://web-2025-version1.s3-website.ap-northeast-2.amazonaws.com",
                "https://justsaying.co.kr", "http://justsaying.co.kr"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowCredentials(true); // 쿠키 허용
        configuration.setMaxAge(10800L); // preflight 캐시 3 * 60 (분) * 60(초)
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }


}