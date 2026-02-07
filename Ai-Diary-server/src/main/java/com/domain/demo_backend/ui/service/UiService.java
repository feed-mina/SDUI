package com.domain.demo_backend.ui.service;

import com.domain.demo_backend.ui.domain.UiMetadata;
import com.domain.demo_backend.ui.domain.UiMetadataRepository;
import com.domain.demo_backend.ui.dto.UiResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
/*
@@@@ 2026-02-08 추가
- 동적 ui구성 성능 최적화
- ui_metadata 테이블을 DTO 변환 및 Map 구성
-  LinkedHashMap을 사용하여 DB 정렬 순서를 Map에서도 유지 (O(n))
-  중복 ID 처리 : 중복 ID가 발생하면 기존 값을 유지하고 로그를 남김
-  정합성 체크 : 부모 ID가 존재하지만 실제 데이터가 없는 경우 (고아 노드) 처리
 */

@Service
public class UiService {
    private final UiMetadataRepository uiMetadataRepository;
    public UiService( UiMetadataRepository uiMetadataRepository) {
        this.uiMetadataRepository = uiMetadataRepository;
    }

    @Transactional(readOnly = true)
    public List<UiResponseDto> getUiTree(String screenId) {
    // 모든 엔티티를 DTO로 변환하고 Map에 저장
    // Collectors.toMap(key 추출, value추출, 중복키처리) 중복 방지 + 정렬 보장 + 정합성 체크
    //  DTO 변환 및 Map 구성
    //  LinkedHashMap을 사용하여 DB 정렬 순서를 Map에서도 유지 (O(n))

        // DB에서 정렬된 상태로 전체 데이터 조회
        List<UiMetadata> entities = uiMetadataRepository.findByScreenIdOrderBySortOrderAsc(screenId);

        // 엔티티를 DTO로 변환하며 LinkedHashMap에 저장 (순서 유지및 O(1) 조회)
    Map<String, UiResponseDto> lookup =
            entities.stream()
                    .map(UiResponseDto::new)
                    .collect(Collectors.toMap(
                    UiResponseDto::getComponentId, // Key
                    dto -> dto, // Value
                            (existing, replacement) -> { // Merge Function (중복처리)
                                System.out.println("Duplicate ID Detected: " + existing.getComponentId());
                                return existing;
                            },
                            LinkedHashMap::new // Map Supplier (구현체 지정)
            ));

    //  트리 재구성 (O(n)) 및 정합성 체크
    List<UiResponseDto> rootNodes = new ArrayList<>();
    for (UiResponseDto node : lookup.values()) {
        String parentId = node.getParentGroupId();
        // 최상위 노드인 경우 (부모 ID가 없는 경우)
        if (parentId == null || parentId.isEmpty()) {
            rootNodes.add(node);
        } else {
            // 부모 노드 찾기
            UiResponseDto parent = lookup.get(parentId);
            if (parent != null) {
                // 부모가 존재하면 자식 리스트에 추가 (이미 정렬된 순서대로 추가됨)
                parent.getChildren().add(node);
            } else {
                // 정합성 체크 : 부모 ID는 있는데 실제 Map(데이터)가 없는 경우 (고아 노드)
    // 이 경우 최상위로 올리거나, 버리거나, 에러를 던질 수 있다
                System.out.println("데이터 Integrity Warning: Parent" + parentId +" not found for "+ node.getComponentId());
                rootNodes.add(node);
            }
        }
    }

    return rootNodes;
}

}
