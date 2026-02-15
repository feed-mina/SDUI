package com.domain.demo_backend.domain.query.controller;

import com.domain.demo_backend.global.security.CustomUserDetails;
import com.domain.demo_backend.domain.query.domain.QueryMaster;
import com.domain.demo_backend.domain.query.repository.DynamicExecutor;
import com.domain.demo_backend.domain.query.service.QueryMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/execute")
public class CommonQueryController {
    private final QueryMasterService queryMasterService;
    private final DynamicExecutor dynamicExecutor; // 실행기 추가

    @Autowired
    public CommonQueryController(QueryMasterService queryMasterService, DynamicExecutor dynamicExecutor) {
        this.queryMasterService = queryMasterService;
        this.dynamicExecutor = dynamicExecutor;
    }

    @PostMapping("/{sqlKey}")
    public ResponseEntity<?> execute(@PathVariable String sqlKey, @RequestBody Map<String, Object> params, Authentication authentication) {
        System.out.println("@@@ 공통 실행기 진입 sqlkey: " + sqlKey);
        // 1. 설계도 전체 (Entity)를 가져온다
        QueryMaster queryMaster = queryMasterService.getQueryInfo(sqlKey);
        if (queryMaster == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "등록되지 않은 SQL 키 입니다"));
        }
        // todo : 동적 쿼리 실행기 (DynamicExecutor) 호출 로직이 들어간다
        // 서비스 로부터 SQL 설계도(Query text)를 가져온다. (Redis 또는 DB)
//        String query = queryMasterService.getQuery(sqlKey);

        String query = queryMaster.getQueryText();
        String returnType = queryMaster.getReturnType();
        // 로그인한 사용자의 정보를 파라미터에 자동으로 추가
        // 프론트에서 실수로 빼먹더라도 서버에서 보안상 안전하게 넣는다.
        if (authentication != null) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            params.put("userSqno", userDetails.getUserSqno()); // 토큰의 sqno를 파라미터에 주입
            params.put("userId", userDetails.getUserId());
        }

        // 실제 실행 : 로그로 쿼리가 잘 가져옸는지 확인
        System.out.println("@@@ 실행할 쿼리 : " + query);
        System.out.println("@@@ 더미 query 날림_20260115 Mockito 테스트@@@@");

        // returnType에 따른 분기 처리
        Object result;
        try {
            if ("COMMAND".equals(returnType)) {
                // INSERT, UPDATE, DELETE인 경우
                result = dynamicExecutor.executeUpdate(query, params);
            } else {
                // SELECT인 경우 (SINGLE, MULTI등)
                List<Map<String, Object>> list = dynamicExecutor.executeList(query, params);

                if ("SINGLE".equals(returnType)) {
                    //
                    if (list != null && !list.isEmpty()) {
                        result = list.get(0);
                    } else {
                        // 결과가 없으면 null 혹은 빈 객체 반환
                        result = null;
                    }
                } else {
                    // MULTI 타입인 경우 리스트 통째로 반환
                    result = list;
                }

            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "쿼리 실행 중 오류가 발생했습니다.", "error", e.getMessage()));
        }

        return ResponseEntity.ok().body(Map.of(
                "status", "success", "sqlKey", sqlKey, "data", result != null ? result : Map.of()
        ));
    }
}
