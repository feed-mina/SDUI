package com.domain.demo_backend.time.service;

import com.domain.demo_backend.query.service.QueryMasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
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

    public String getGoalTime(String userId){
        // 1. Rddis에서 사용자의 목표 시간이 이미 계산되어 있는지 확인
        if (userId == null || userId.isEmpty()) return "";

        String cacheKey = "USER_GOAL:"+userId;
        System.out.println("@@@ cacheKey: " + cacheKey);

        String cachedTime = redisTemplate.opsForValue().get(cacheKey);
        System.out.println("@@@ cachedTime: " + cachedTime);

        if(cachedTime != null) return cachedTime;

        // 2. Redis에 없다면 QueryMasterService를 통해 SQL문장을 가져온다.
        // DB의 query_master 테이블에 GET_USER_GOAL_TIME 키가 등록되어 있어야 한다.
        String sql = queryMasterService.getQuery("GET_USER_GOAL_TIME");
        System.out.println("@@@ sql: " + sql);

        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        try{

            // 3. 갸져온 SQL 실행 (userId 파라미터 바인딩)
            String targetTime = namedParameterJdbcTemplate.queryForObject(sql, params, String.class);            System.out.println("@@@ cacheKey: " + cacheKey);
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
}
