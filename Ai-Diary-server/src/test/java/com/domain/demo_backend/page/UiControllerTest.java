package com.domain.demo_backend.page;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class UiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("로그인 페이지 메타데이터를 성공적으로 가져오는 테스트")
    void getLoginUiMetadataTest() throws Exception {
        mockMvc.perform(get("/api/ui/LOGIN_PAGE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success")) // 응답구조확인
                .andExpect(jsonPath("$.data[0].screenId").value("LOGIN_PAGE"))
                .andExpect(jsonPath("$.data.length()").isNotEmpty());
    }

    @DisplayName("레디스 캐싱을 포함한 UI메타데이터 조회 테스트")
    void getUiMetaWithCacheTest() throws Exception {
        // 첫번째 호출 : DB에서 가져와서 레디스에 저장
        mockMvc.perform(get("/api/ui/LOGIN_PAGE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.length()").isNotEmpty());
    }
}
