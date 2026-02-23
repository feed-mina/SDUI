package com.domain.demo_backend.page;

import com.domain.demo_backend.domain.user.controller.AuthController;
import com.domain.demo_backend.domain.user.dto.RegisterRequest;
import com.domain.demo_backend.domain.user.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;


import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("회원가입 시 주소 정보가 포함되면 성공해야 한다")
    void registerWithAddressSuccess() throws Exception {
        // Given: 테스트용 회원가입 데이터 생성
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setZipCode("06164");
        request.setRoadAddress("서울특별시 강남구 영동대로 513");
        request.setDetailAddress("코엑스 2층");

        String content = objectMapper.writeValueAsString(request);

        // When & Then: POST 요청 후 201(Created) 혹은 200(OK) 응답 확인
        mockMvc.perform(post("/api/auth/register")
                        .content(content)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andDo(print());
    }

    @Test
    @DisplayName("주소 정보가 누락되면 400 에러를 반환해야 한다")
    void registerWithAddressFail() throws Exception {
        // Given: 주소 정보가 없는 데이터
        RegisterRequest request = new RegisterRequest();
        request.setEmail("fail@example.com");

        String content = objectMapper.writeValueAsString(request);

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                        .content(content)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andDo(print());
    }
}