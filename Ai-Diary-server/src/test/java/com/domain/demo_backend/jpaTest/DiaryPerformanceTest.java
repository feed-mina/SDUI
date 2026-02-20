package com.domain.demo_backend.jpaTest;

import com.domain.demo_backend.domain.diary.service.DiaryService;
import com.domain.demo_backend.domain.user.domain.User;
import com.domain.demo_backend.global.common.util.JpaCountUtils;
import com.domain.demo_backend.global.common.util.TestResultLogger;
import com.domain.demo_backend.global.security.CustomUserDetails;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.Session;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest // 서비스 빈을 주입받기 위해 전체 컨텍스트 로드
@ActiveProfiles("test")
//@Transactional // 테스트 후 데이터 롤백을 위해 추가
public class DiaryPerformanceTest {

    @Autowired
    private DiaryService diaryService;

    @PersistenceContext
    private EntityManager em;

    @Test
    void 일기_조회_성능_테스트() {
        //   하이버네이트로부터 현재 세션을 꺼내온다.
        Session session = em.unwrap(Session.class);
        //   쿼리 실행 횟수를 기록하는 통계 기능을 가져온다.
        Statistics stats = session.getSessionFactory().getStatistics();
        //   통계 수집을 활성화한다.
        stats.setStatisticsEnabled(true);
        //   이전 기록을 지우고 0부터 시작한다.
        stats.clear();

        //  가짜 유저 및 인증 객체 생성
        // 서비스 로직에서 사용하는 CustomUserDetails 구조에 맞춘다.
        User mockUser = User.builder()
                .userSqno(1L)
                .userId("pagingmina")
                .role("USER")
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(mockUser);

        // 신분증(Token) 제작: 주체(userDetails), 비밀번호(null), 권한목록
        Authentication auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

        //   서비스 호출: null 대신 생성한 auth 객체 전달
        diaryService.selectMemberDiaryList(auth, 1, 10);

        //   실행된 전체 쿼리 수를 가져온다.
        long queryCount = stats.getPrepareStatementCount();
        // @@@@ 로그 기록 호출: 테스트 이름과 측정된 쿼리 수를 보낸다. [cite: 2026-02-20]
        TestResultLogger.log("일기_조회_성능_테스트", queryCount);
        //  쿼리 (Fetch Join 적용 시) 개수 확인.
        JpaCountUtils.assertQueryCount(stats, 2);
    }
}
