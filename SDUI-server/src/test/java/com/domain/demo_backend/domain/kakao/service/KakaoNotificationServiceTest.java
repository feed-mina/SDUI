package com.domain.demo_backend.domain.kakao.service;

import com.domain.demo_backend.domain.time.domain.GoalSetting;
import com.domain.demo_backend.domain.user.domain.User;
import com.domain.demo_backend.domain.user.service.KakaoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("KakaoNotificationService 단위 테스트")
class KakaoNotificationServiceTest {

    @Mock
    private KakaoService kakaoService;

    @InjectMocks
    private KakaoNotificationService kakaoNotificationService;

    private User user;
    private GoalSetting goal;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .userSqno(1L)
                .userId("testUser")
                .kakaoAccessToken("valid-access-token")
                .kakaoTokenExpiresAt(LocalDateTime.now().plusHours(1)) // 유효 토큰
                .build();

        goal = new GoalSetting();
        goal.setId(1L);
        goal.setUserSqno(1L);
        // UTC 05:00 기준으로 저장 (KST 14:00 으로 표시됨)
        goal.setTargetTime(LocalDateTime.of(2026, 3, 18, 5, 0));
    }

    // ── 정상 발송 케이스 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("30분 전 알림: RestTemplate.postForEntity 가 1회 호출되어야 함")
    void sendReminder_30min_shouldCallPostForEntity() {
        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.postForEntity(anyString(), any(), eq(String.class)))
                        .thenReturn(ResponseEntity.ok("success")))) {

            kakaoNotificationService.sendReminder(user, goal, 30);

            assertThat(mocked.constructed()).hasSize(1);
            verify(mocked.constructed().get(0)).postForEntity(anyString(), any(), eq(String.class));
        }
    }

    @Test
    @DisplayName("90분 전 알림: RestTemplate.postForEntity 가 1회 호출되어야 함")
    void sendReminder_90min_shouldCallPostForEntity() {
        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.postForEntity(anyString(), any(), eq(String.class)))
                        .thenReturn(ResponseEntity.ok("success")))) {

            kakaoNotificationService.sendReminder(user, goal, 90);

            assertThat(mocked.constructed()).hasSize(1);
        }
    }

    @Test
    @DisplayName("180분 전 알림: RestTemplate.postForEntity 가 1회 호출되어야 함")
    void sendReminder_180min_shouldCallPostForEntity() {
        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.postForEntity(anyString(), any(), eq(String.class)))
                        .thenReturn(ResponseEntity.ok("success")))) {

            kakaoNotificationService.sendReminder(user, goal, 180);

            assertThat(mocked.constructed()).hasSize(1);
        }
    }

    @Test
    @DisplayName("메모(todaysMessage)가 있으면 HTTP 요청이 실행되어야 함")
    void sendReminder_withMemo_shouldSendMessage() {
        goal.setTodaysMessage("오늘도 화이팅!");

        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.postForEntity(anyString(), any(), eq(String.class)))
                        .thenReturn(ResponseEntity.ok("success")))) {

            kakaoNotificationService.sendReminder(user, goal, 30);

            assertThat(mocked.constructed()).hasSize(1);
        }
    }

    @Test
    @DisplayName("메모가 null 이면 HTTP 요청이 실행되어야 함 (메모 없이 발송)")
    void sendReminder_nullMemo_shouldSendWithoutMemo() {
        goal.setTodaysMessage(null);

        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.postForEntity(anyString(), any(), eq(String.class)))
                        .thenReturn(ResponseEntity.ok("success")))) {

            kakaoNotificationService.sendReminder(user, goal, 30);

            assertThat(mocked.constructed()).hasSize(1);
        }
    }

    @Test
    @DisplayName("메모가 빈 문자열이면 HTTP 요청이 실행되어야 함 (메모 없이 발송)")
    void sendReminder_blankMemo_shouldSendWithoutMemo() {
        goal.setTodaysMessage("   ");

        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.postForEntity(anyString(), any(), eq(String.class)))
                        .thenReturn(ResponseEntity.ok("success")))) {

            kakaoNotificationService.sendReminder(user, goal, 30);

            assertThat(mocked.constructed()).hasSize(1);
        }
    }

    // ── 토큰 관련 케이스 ────────────────────────────────────────────────────────

    @Test
    @DisplayName("카카오 토큰이 null 이면 HTTP 호출 없이 즉시 반환해야 함")
    void sendReminder_nullToken_shouldSkipHttpCall() {
        user.setKakaoAccessToken(null);

        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class)) {
            kakaoNotificationService.sendReminder(user, goal, 30);

            assertThat(mocked.constructed()).isEmpty();
        }
    }

    @Test
    @DisplayName("토큰 만료 5분 이내이면 refreshKakaoToken 을 호출해야 함")
    void sendReminder_tokenExpiringWithin5min_shouldRefresh() {
        user.setKakaoTokenExpiresAt(LocalDateTime.now().plusMinutes(3)); // 3분 후 만료
        when(kakaoService.refreshKakaoToken(user)).thenReturn("new-access-token");

        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.postForEntity(anyString(), any(), eq(String.class)))
                        .thenReturn(ResponseEntity.ok("success")))) {

            kakaoNotificationService.sendReminder(user, goal, 30);

            verify(kakaoService, times(1)).refreshKakaoToken(user);
            assertThat(mocked.constructed()).hasSize(1);
        }
    }

    @Test
    @DisplayName("토큰 갱신 후 새 토큰이 null 이면 HTTP 호출 없이 반환해야 함")
    void sendReminder_refreshReturnsNull_shouldSkipHttpCall() {
        user.setKakaoTokenExpiresAt(LocalDateTime.now().plusMinutes(3));
        when(kakaoService.refreshKakaoToken(user)).thenReturn(null);

        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class)) {
            kakaoNotificationService.sendReminder(user, goal, 30);

            verify(kakaoService, times(1)).refreshKakaoToken(user);
            assertThat(mocked.constructed()).isEmpty();
        }
    }

    @Test
    @DisplayName("토큰이 충분히 유효하면 refreshKakaoToken 을 호출하지 않아야 함")
    void sendReminder_validToken_shouldNotRefresh() {
        // 1시간 후 만료 → 갱신 불필요
        user.setKakaoTokenExpiresAt(LocalDateTime.now().plusHours(1));

        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.postForEntity(anyString(), any(), eq(String.class)))
                        .thenReturn(ResponseEntity.ok("success")))) {

            kakaoNotificationService.sendReminder(user, goal, 30);

            verify(kakaoService, never()).refreshKakaoToken(any());
        }
    }

    // ── 예외 케이스 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("REST 호출 실패 시 RuntimeException('카카오 알림 발송 실패')을 던져야 함")
    void sendReminder_httpError_shouldThrowRuntimeException() {
        try (MockedConstruction<RestTemplate> ignored = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.postForEntity(anyString(), any(), eq(String.class)))
                        .thenThrow(new RuntimeException("Connection refused")))) {

            assertThatThrownBy(() -> kakaoNotificationService.sendReminder(user, goal, 30))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("카카오 알림 발송 실패");
        }
    }
}
