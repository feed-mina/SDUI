package com.domain.demo_backend.integration;

import com.domain.demo_backend.domain.diary.dto.DiaryRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class DiaryWriteIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "testUser")
    void saveDiary_Integration_Success() throws Exception {
        // Given: 실제 전송될 JSON 구조와 동일한 DTO 준비
        DiaryRequest request = new DiaryRequest();
        request.setTitle("통합 테스트");
        request.setSelectedTimes(List.of(22, 23, 0));
        request.setDailySlots(Map.of("morning", "운동"));

        // When & Then: 실제 API 호출 및 상태 코드 검증
        mockMvc.perform(post("/api/diary/addDiaryList")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}