package com.domain.demo_backend.time.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalSettingRepository extends JpaRepository<GoalSetting, Long> {

    // 사용자 ID로 모든 목표 설정 기록을 가져오는 메서드
    List<GoalSetting> findByUserSqno(Long userSqno);

    // 가장 최근에 등록된 기록 하나를 가져오고 싶을 때 사용
    GoalSetting findFirstByUserSqnoOrderByCreatedAtDesc(Long userSqno);
}