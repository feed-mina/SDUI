package com.domain.demo_backend.time.controller;


import com.domain.demo_backend.time.service.GoalTimeQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;


/*
 * @@@@ 2026-01-26 생성
 * 목표시간 controller / redis 사용
 *
 *  */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GoalTimeController {
    private final GoalTimeQueryService goalTimeQueryService;

    @GetMapping("/goalTime")
    public ResponseEntity<Map<String, String>> getGoalTime(@RequestParam(required = false) String userId){
        String targetTime = goalTimeQueryService.getGoalTime(userId);
        System.out.println("@@@ targetTime: " + targetTime);
        if(targetTime == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("goalTime", targetTime));
    }
}
