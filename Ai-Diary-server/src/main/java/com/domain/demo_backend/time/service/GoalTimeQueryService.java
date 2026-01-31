package com.domain.demo_backend.time.service;

import com.domain.demo_backend.query.service.QueryMasterService;
import com.domain.demo_backend.time.domain.GoalSetting;
import com.domain.demo_backend.time.domain.GoalSettingRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/*
 * @@@@ 2026-01-26 생성
 * 목표시간 service / redis 사용
 *
 *  */
@Service
@RequiredArgsConstructor
public class GoalTimeQueryService {
    private final QueryMasterService queryMasterService;
    private final RedisTemplate<String, String> redisTemplate;
    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    private final GoalSettingRepository goalSettingRepository;

//    @PostConstruct
//    public void init() {
//        // 서버 켜질 때 Redis 싹 비우기 (테스트용)
//        redisTemplate.getConnectionFactory().getConnection().flushAll();
//        System.out.println("🔥🔥🔥 Redis 초기화 완료! 🔥🔥🔥");
//    }

    public String getGoalTime(Long userSqno){
        // 1. Rddis에서 사용자의 목표 시간이 이미 계산되어 있는지 확인
        String cacheKey = "USER_GOAL:"+userSqno;
        System.out.println("@@@ cacheKey: " + cacheKey);

        String cachedTime = redisTemplate.opsForValue().get(cacheKey);
        System.out.println("@@@ cachedTime: " + cachedTime);

        if(cachedTime != null) return cachedTime;

        // 2. Redis에 없다면 QueryMasterService를 통해 SQL문장을 가져온다.
        // DB의 query_master 테이블에 GET_USER_GOAL_TIME 키가 등록되어 있어야 한다.
        String sql = queryMasterService.getQuery("GET_USER_GOAL_TIME");
        System.out.println("@@@ sql: " + sql);

        Map<String, Object> params = new HashMap<>();
        params.put("userSqno", userSqno);
        System.out.println("@@@ params: " + params);
        try{

            // 3. 갸져온 SQL 실행 (userId 파라미터 바인딩)
            String targetTime = namedParameterJdbcTemplate.queryForObject(sql, params, String.class);
            System.out.println("@@@ cacheKey: " + cacheKey);
            System.out.println("@@@ targetTime: " + targetTime);
            // 4. 실행 결과를 Redis에 저장 (예 : 1시간 동안 유지)
            if (targetTime != null){
                redisTemplate.opsForValue().set(cacheKey, targetTime, Duration.ofHours(3));
                System.out.println("@@@ 레디스에  targetTime 저장");
            }
            return targetTime;
        } catch (EmptyResultDataAccessException e){
            return "";
        }
    }

    @Transactional
    public GoalSetting saveGoalTime(Long userSqno, LocalDateTime targetTime, String message) {
        GoalSetting goal = new GoalSetting();
        goal.setUserSqno(userSqno);
        goal.setTargetTime(targetTime);
        goal.setTodaysMessage(message);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String formattedTime = targetTime.format(formatter);

        String cacheKey = "USER_GOAL:"+ userSqno;
        redisTemplate.opsForValue().set(cacheKey, formattedTime, Duration.ofHours(3));

        return goalSettingRepository.save(goal);
    }

    // [리스트용] 목표 3개 조회
    public List<String> getGoalList (Long userSqno){

        // SQL 가져오기
        String sql = queryMasterService.getQuery("GET_USER_GOAL_LIST");

        Map<String, Object> params = new HashMap<>();
        params.put("userSqno", userSqno);
        // queryForList 사용, 결과가 없으면 null 이 있다. 비어있는 리스트 ([]) 가 반환되므로 안전하다
        List<String> resultList = namedParameterJdbcTemplate.queryForList(sql, params, String.class);

        return resultList;
    }

    // [도착처리] 결과 업데이트 및 캐시 초기화
    public void updateGoalResult(Long userSqno, String status, LocalDateTime recordedTime){
        // DB 업데이트 실행
        String sql = queryMasterService.getQuery("UPDATE_GOAL_RESULT");
        Map<String, Object> params = new HashMap<>();
        params.put("userSqno", userSqno);
        params.put("status", status);
        params.put("recordedTime", recordedTime);

        int updatedCount = namedParameterJdbcTemplate.update(sql, params);
        // 중요 : 업데이트가 성공했다면 Redis 캐시를 삭제 해야함

        if(updatedCount >0){
            String cacheKey = "USER_GOAL:"+userSqno;
            redisTemplate.delete(cacheKey);
            System.out.println("LOG: 캐시 삭제 완료 -" + cacheKey);
        } else{
            System.out.println("LOG: 업데이트 대상이 없습니다. 이미 처리되었거나 목표가 없음");
        }
    }
}
