package com.domain.demo_backend.query.service;

import com.domain.demo_backend.query.domain.QueryMaster;
import com.domain.demo_backend.query.repository.QueryMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class QueryMasterService {
    private final QueryMasterRepository queryMasterRepository;
    private final RedisTemplate<String, String> redisTemplate;

    @Autowired
    public QueryMasterService(QueryMasterRepository queryMasterRepository, RedisTemplate<String, String> redisTemplate) {
        this.queryMasterRepository = queryMasterRepository;
        this.redisTemplate = redisTemplate;
    }

    public QueryMaster getQueryInfo(String sqlKey){
        // DB에서 해당 키의 전체 정보를 찾아서 반환한다.
        // 필요하다면 여기에서 Redis에 객체 자체를 저장하는 로직 추가 하기
        return queryMasterRepository.findBySqlKey(sqlKey).orElseThrow(() -> new RuntimeException("등록되지 않은  sql_key입니다: " + sqlKey));
    }

    public String getQuery(String sqlKey){
        // 먼저 Redis에서 해당 키의 SQL이 있는지 확인
        String cachedQuery = redisTemplate.opsForValue().get("SQL:" + sqlKey);
        if (cachedQuery != null) {
            System.out.println("Redis 캐시에서 쿼리를 찾았습니다 : " + sqlKey);
            return cachedQuery;
        }

        // Redis에 없다면 DB에서 찾는다
        System.out.println("DB에서 쿼리를 조회합니다: " + sqlKey);
        QueryMaster queryMaster = queryMasterRepository.findBySqlKey(sqlKey)
                .orElseThrow(() -> new RuntimeException("등록되지 않은  sql_key입니다: " + sqlKey));


        // 찾은 쿼리를 다음에 빨리 쓰기 위해 Redis에 저장(캐싱)한다.
        redisTemplate.opsForValue().set("SQL:" + sqlKey, queryMaster.getQueryText());
        return queryMaster.getQueryText();


    }
}
