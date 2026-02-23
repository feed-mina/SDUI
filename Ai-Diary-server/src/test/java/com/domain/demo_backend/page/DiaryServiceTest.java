package com.domain.demo_backend.page;

import com.domain.demo_backend.domain.diary.domain.Diary;
import com.domain.demo_backend.domain.diary.domain.DiaryRepository;
import com.domain.demo_backend.domain.diary.dto.DiaryRequest;
import com.domain.demo_backend.domain.diary.service.DiaryService;
import com.domain.demo_backend.domain.user.domain.User;
import com.domain.demo_backend.domain.user.domain.UserRepository;
import com.domain.demo_backend.global.security.CustomUserDetails;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.AssertionsForInterfaceTypes.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiaryServiceTest {

    @Mock
    private DiaryRepository diaryRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks
    private DiaryService diaryService;

    @Test
    @DisplayName("새로운 일기 저장 시 JSONB 데이터(수면시간, 일과)가 정상적으로 포함되어야 한다")
    void addDiary_WithJsonbData_Success() {
        // Given: 테스트 데이터 준비 [cite: 2026-02-08, 2026-02-17]
        DiaryRequest request = new DiaryRequest();
        request.settitle("테스트 제목");
        request.setSelectedTimes(List.of(23, 0, 1)); // 수면시간 리스트
        request.setDailySlots(Map.of("morning", "기상", "lunch", "점심식사")); // 일과 맵

        User mockUser = User.builder().userSqno(1L).userId("testUser").build();
        CustomUserDetails userDetails = new CustomUserDetails(mockUser);
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null);

        when(userRepository.findByUserSqno(anyLong())).thenReturn(Optional.of(mockUser));

        // When: 일기 저장 실행
        diaryService.addDiary(request, "127.0.0.1", auth);

        // Then: 저장이 호출되었는지, 데이터가 일치하는지 검증
        ArgumentCaptor<Diary> diaryCaptor = ArgumentCaptor.forClass(Diary.class);
        verify(diaryRepository).save(diaryCaptor.capture());

        Diary savedDiary = diaryCaptor.getValue();
        assertThat(savedDiary.getSelectedTimes()).hasSize(3); // 수면시간 검증
        assertThat(savedDiary.getDailySlots()).containsEntry("morning", "기상"); // 일과 기록 검증
    }

    @Test
    @DisplayName("JSONB 데이터가 포함된 일기 저장 검증")void addDiary_Jsonb_Success() {
        // 1. Mock 유저 및 상세 정보 설정
        Long testUserSqno = 1L; // 고정된 ID 사용
        User mockUser = User.builder()
                .userSqno(testUserSqno)
                .userId("mina94")
                .build();

        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        when(userDetails.getUserSqno()).thenReturn(testUserSqno); // 인증 객체가 1L 반환하도록 설정

        // 2. Repository Mock 설정 (핵심 수정 사항)
        // 서비스 로직 내 findByUserSqno(1L) 호출 시 mockUser를 반환하게 함
        when(userRepository.findByUserSqno(testUserSqno)).thenReturn(Optional.of(mockUser));

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUserSqno()).thenReturn(1L);

        // Given
        DiaryRequest request = new DiaryRequest();
        request.setSelectedTimes(List.of(22, 23, 0));
        request.setDailySlots(Map.of("morning", "운동 완료"));

        // When실행
        diaryService.addDiary(request, "127.0.0.1", authentication);

        // Then 검증
        verify(diaryRepository).save(argThat(diary ->
                diary.getSelectedTimes().contains(22) &&
                        "운동 완료".equals(diary.getDailySlots().get("morning"))
        ));
    }
}