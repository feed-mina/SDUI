package com.domain.demo_backend.ui.controller;

import com.domain.demo_backend.ui.dto.UiResponseDto;
import com.domain.demo_backend.ui.service.UiService;
import com.domain.demo_backend.util.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ui")
public class UiController {

    private final UiService uiService;
/*
* @@@@ 2026-02-08 추가
* ui컨트롤러 리팩토링 > ui서비스로직 적용
* */
    public UiController(UiService uiService) {
        this.uiService = uiService;
    }

    @GetMapping("/{screenId}")
    public ApiResponse<List<UiResponseDto>> getUiMetadataList(@PathVariable String screenId){
        // 서비스에서 가공된 트리 구조 데이터를 받아서 응답
        System.out.println("@@@UiController 시작!");
        System.out.println("screenId: " + screenId);
        List<UiResponseDto> treeList = uiService.getUiTree(screenId);

        System.out.println("treeList: " + treeList);
        return ApiResponse.success(treeList);
    }

}
