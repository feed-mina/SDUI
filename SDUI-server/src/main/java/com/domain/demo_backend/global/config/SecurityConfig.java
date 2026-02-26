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


    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

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
        // 1. JWT 필터 객체 생성 [cite: 2026-02-18]
//        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtUtil, refreshTokenRepository, userRepository);

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/me", "/api/auth/login", "/api/auth/refresh", "/api/kakao/**", "/api/ui/**", "/api/goalTime/**").permitAll()
                        .requestMatchers("/api/diary/**").authenticated()
                        .anyRequest().permitAll()
                )
                .exceptionHandling(exception -> exception.authenticationEntryPoint(new Http403ForbiddenEntryPoint()))
                .formLogin(f -> f.disable())
                .logout(l -> l.disable());


        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        if (mockAuthFilter != null) {
            http.addFilterBefore(mockAuthFilter, JwtAuthenticationFilter.class);
        }

        return http.build();
    }

    // CORS 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("https://sdui-delta.vercel.app", "http://localhost:3000", "http://localhost:8080","http://43.201.237.68","https://justsaying.co.kr", "http://justsaying.co.kr"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowCredentials(true); // 쿠키 허용
        configuration.setMaxAge(10800L); // preflight 캐시 3 * 60 (분) * 60(초)
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }


}