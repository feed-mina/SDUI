package com.domain.demo_backend.domain.admin.controller;

import com.domain.demo_backend.domain.admin.dto.AdminUserResponse;
import com.domain.demo_backend.domain.admin.dto.UpdateUserRoleRequest;
import com.domain.demo_backend.domain.admin.service.AdminUserService;
import com.github.pagehelper.PageInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    private static final Logger log = LoggerFactory.getLogger(AdminUserController.class);
    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    // 사용자 목록 조회 (keyword: userId/email 검색, role: 권한 필터)
    @GetMapping("/users")
    public ResponseEntity<?> getUserList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            PageInfo<AdminUserResponse> result = adminUserService.getUserList(keyword, role, page, size);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("사용자 목록 조회 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "사용자 목록 조회 중 오류가 발생했습니다."));
        }
    }

    // 사용자 권한 변경 (최소 1명, 최대 5명)
    @PutMapping("/users/role")
    public ResponseEntity<?> updateUserRole(@RequestBody UpdateUserRoleRequest request) {
        try {
            adminUserService.updateUserRole(request.getUserIds(), request.getNewRole());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("권한 변경 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "권한 변경 중 오류가 발생했습니다."));
        }
    }
}
