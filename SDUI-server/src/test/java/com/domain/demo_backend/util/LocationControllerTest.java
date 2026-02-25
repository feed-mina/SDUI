package com.domain.demo_backend.util;

import com.domain.demo_backend.domain.Location.controller.LocationController;
import com.domain.demo_backend.domain.Location.dto.LocationRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessageSendingOperations;

import static org.mockito.Mockito.*;
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class LocationControllerTest {

    @MockBean
    private SimpMessageSendingOperations messagingTemplate;

    @Autowired
    private LocationController locationController;

    @Test
    @DisplayName("위치 업데이트 메시지를 받으면 관리자 채널로 중계해야 한다")
    void testUpdateLocationRouting() {
        // 1. 테스트용 위치 데이터 생성
        LocationRequest request = new LocationRequest();
        request.setUserSqno(String.valueOf(12345));
        request.setLat(37.5665);
        request.setLng(126.9780);

        // 2. 컨트롤러 메서드 직접 호출 (또는 StompClient 이용)
        locationController.updateLocation(request);

        // 3. messagingTemplate이 특정 경로(/sub/admin/locations)로 데이터를 보냈는지 검증
        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/sub/admin/locations"), any(LocationRequest.class));
    }
}
