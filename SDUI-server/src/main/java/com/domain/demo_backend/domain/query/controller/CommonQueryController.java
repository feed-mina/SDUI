package com.domain.demo_backend.domain.query.controller;

import com.domain.demo_backend.domain.query.domain.QueryMaster;
import com.domain.demo_backend.domain.query.repository.DynamicExecutor;
import com.domain.demo_backend.domain.query.service.QueryMasterService;
import com.domain.demo_backend.global.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
    // GET과 POST를 모두 수용하도록 변경
    @RequestMapping(value = "/{sqlKey}", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> execute(
            @PathVariable String sqlKey,
            @RequestParam(required = false) Map<String, Object> queryParams, // GET 파라미터
            @RequestBody(required = false) Map<String, Object> bodyParams,  // POST 파라미터
            Authentication authentication) {

        System.out.println("@@@ 공통 실행기 진입 sqlkey: " + sqlKey);

        //  파라미터 통합 처리 (GET과 POST 데이터 합치기)
        Map<String, Object> params = new HashMap<>();
        if (queryParams != null) params.putAll(queryParams);
        if (bodyParams != null) params.putAll(bodyParams);

        QueryMaster queryMaster = queryMasterService.getQueryInfo(sqlKey);
        if (queryMaster == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "등록되지 않은 SQL 키 입니다"));
        }

        // todo : 동적 쿼리 실행기 (DynamicExecutor) 호출 로직이 들어간다
        // 서비스 로부터 SQL 설계도(Query text)를 가져온다. (Redis 또는 DB)
        String query = queryMaster.getQueryText();
        String returnType = queryMaster.getReturnType();

        System.out.println("@@@ 실행할 쿼리 : " + query);
        //  보안 파라미터 주입
        if (authentication != null) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            params.put("userSqno", userDetails.getUserSqno());
            params.put("userId", userDetails.getUserId());
        }

        System.out.println("@@@ 최종 바인딩 파라미터 : " + params);

        try {
            Object result;
            if ("COMMAND".equals(returnType)) {
                // INSERT, UPDATE, DELETE인 경우
                result = dynamicExecutor.executeUpdate(query, params);
            } else {
                // SELECT인 경우 (SINGLE, MULTI등)
                List<Map<String, Object>> list = dynamicExecutor.executeList(query, params);
                // SINGLE 타입이면 첫 번째 객체만, MULTI면 리스트 전체 반환

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

            return ResponseEntity.ok().body(Map.of(
                    "status", "success", "sqlKey", sqlKey, "data", result != null ? result : List.of()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "쿼리 실행 중 오류가 발생했습니다.", "error", e.getMessage()));
        }
    }
}
