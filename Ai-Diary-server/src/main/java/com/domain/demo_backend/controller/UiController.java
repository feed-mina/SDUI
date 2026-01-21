package com.domain.demo_backend.controller;

import com.domain.demo_backend.ui.domain.UiMetadata;
import com.domain.demo_backend.ui.domain.UiMetadataRepository;
import com.domain.demo_backend.util.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ui")
public class UiController {

    private final UiMetadataRepository uiMetadataRepository;

    public UiController(UiMetadataRepository uiMetadataRepository) {
        this.uiMetadataRepository = uiMetadataRepository;
    }

    @GetMapping("/{screenId}")
    public ApiResponse<List<UiMetadata>> getUiMetadataList(@PathVariable String screenId){
        System.out.println("@@@UiController 시작!");
        System.out.println("screenId: " + screenId);
        List<UiMetadata> list = uiMetadataRepository.findByScreenIdOrderBySortOrderAsc(screenId);
        return ApiResponse.success(list);
    }

}
