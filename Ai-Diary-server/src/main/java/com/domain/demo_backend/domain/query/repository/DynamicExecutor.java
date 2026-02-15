package com.domain.demo_backend.domain.query.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class DynamicExecutor {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    // 스프링이 자동으로 DB연결 도구(jdbcTemplate)를 주입
    public DynamicExecutor(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> executeList(String sql, Map<String, Object> params) {
        System.out.println("@@@ DynamicExecutor 실제 DB 쿼리를 실행");

        System.out.println("@@@ 실행 SQL : " + sql);
        System.out.println("@@@ 바인딩 파라미터 : " + params);

        // 1. 파라미터 를 만들고 Map에 있는 모든 값을 넣는다
        // 이때 값이 없는 것은 NULL로 들어간다
        MapSqlParameterSource paramSource = new MapSqlParameterSource();
        if (params != null) {
            params.forEach(paramSource::addValue);
        }
        // 2. 쿼리를 실행하여 결과를 리스트로 받는다.
        return jdbcTemplate.queryForList(sql, paramSource);
    }

    // INSERT, UPDATE, DELETE 처리가 필요할때 사용할 메서드
    public int executeUpdate(String sql, Map<String, Object> params) {
        MapSqlParameterSource paramSource = new MapSqlParameterSource();
        if (params != null) {
            params.forEach(paramSource::addValue);
        }
        // 2. 쿼리를 실행하여 결과를 리스트로 받는다.
        return jdbcTemplate.update(sql, paramSource);
    }
//
//    @Autowired
//    private CommonMapper commonMapper;
//
//    public List<Map<String, Object>> executeList(String sql, Map<String, Object> params){
//        return commonMapper.executeDynamicQuery(sql, params);
//    }
}
