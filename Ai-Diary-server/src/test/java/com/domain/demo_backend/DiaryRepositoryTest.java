package com.domain.demo_backend;

import com.domain.demo_backend.domain.diary.domain.Diary;
import com.domain.demo_backend.domain.diary.domain.DiaryRepository;
import com.domain.demo_backend.domain.user.domain.User;
import com.domain.demo_backend.domain.user.domain.UserRepository;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
public class DiaryRepositoryTest {

    @Autowired
    private DiaryRepository diaryRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("일기 저장 및 조회 테스트")
    public void diary_create_test() {
        // 1.Given 사용자 준비 : 외래키 제약조건 때문
        User user = User.builder()
                .email("test@test.com")
                .build();
        userRepository.save(user);

        // 2. Given : 다이어리 객체 생성
        Diary diary = Diary.builder()
                .user(user) // 위에서 저장한 유저 객체를 넣어준다.
                .title("오늘의 일기")
                .content("JPA 테스트 중입니다")
                .author("민아")
                .delYn("N")
                .build();

        // 3. When 저장 실행
        Diary savedDiary = diaryRepository.save(diary);

        // 4. Then : 검증
        // 무엇과 무엇을 비교하면 좋을까? savedDiary의 ID가 null이 아닌지 제목이 일치한지 확인하기
        // 4. Then : 검증
// 1) DB가 생성해준 ID가 정말 존재하는지 확인
        assertThat(savedDiary.getDiaryId()).isNotNull();

// 2) 내가 저장한 제목이 가져온 데이터의 제목과 같은지 확인
        assertThat(savedDiary.getTitle()).isEqualTo("오늘의 일기");

// 3) 연결된 유저의 이메일이 맞는지 확인 (객체 그래프 탐색)
        assertThat(savedDiary.getUser().getEmail()).isEqualTo("test@test.com");

        System.out.println("테스트 성공! 생성된 다이어리 ID: " + savedDiary.getDiaryId());
    }

    @Test
    @DisplayName("다이어리 페이징 및 최신순 정렬 테스트")
    public void diary_paging_test() {
        // 1. Given :사용자 준비
        User user = User.builder()
                .email("paging@test.com")
                .build();
        userRepository.save(user);

        // 2. Given : 다이어리 3개 저장(제목에 번호를 붙어서 구분)
        for (int i = 1; i <= 3; i++) {
            diaryRepository.save(Diary.builder()
                    .user(user)
                    .title("일기 " + i)
                    .content("내용 " + i)
                    .delYn("N")
                    .build());
        }

        // 3. When : 첫번째 페이지에서 2개인 조회 요청 (0번 페이지, 크기 2)
        Pageable pageable = PageRequest.of(0, 2);
        Page<Diary> diaryPage = diaryRepository.findByUserAndDelYnOrderByRegDtDesc(user, "N", pageable);

        // 4   Then : 검증
        // 1) 한 페이지 크기가 2인지 확인
        assertThat(diaryPage.getSize()).isEqualTo(2);
        // 2) 전체 데이터 개수가 3개인지 확인 (Page 객체가 계산)
        assertThat(diaryPage.getTotalElements()).isEqualTo(3);
        // 3) 최신순(DESC) 정렬이므로 가장 나중에 저장한 "일기 3"이 첫번째 인지 확인
        assertThat(diaryPage.getContent().get(0).getTitle()).isEqualTo("일기 3");

        System.out.println("현재 페이지 데이터 수 :" + diaryPage.getNumberOfElements());
        System.out.println("ㅎ전체 페이지 수 :" + diaryPage.getTotalPages());

    }
}
