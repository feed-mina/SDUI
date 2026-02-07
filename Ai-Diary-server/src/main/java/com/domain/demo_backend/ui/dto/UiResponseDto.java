// @@@@ 2026-02-07 추가
// 동적 ui 렌더링 > 빅오 값으로 로직 변경 (트리구조에서 부모가 있을때 자식 조회, 아니면 말단노드 조회)

package com.domain.demo_backend.ui.dto;

import com.domain.demo_backend.ui.domain.UiMetadata;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class UiResponseDto {
    // 식별자 및 계층 정보
    private String componentId; // 컴포넌트 고유 ID
    private String parentGroupId; // 부모그룹 Id( 트리 구성의 기준)

    // UI 표시 관련 데이터
    private String labelText; // 화면에 표시될 라벨
    private String componentType; // 컴포넌트 유형
    private Integer sortOrder; // 정렬 순서

    // 상태 및 제약조건
    private Boolean isRequired; // 필수 입력 여부
    private Boolean isReadonly;  // 읽기 전용 여부
    private String isVisible; //  표시 여부 (조건부 로직 포함 가능)

    // 스타일 및 액션
    private String cssClass; // 적용할 CSS 클래스
    private String actionType; // 클릭 등 이벤트 발생 시 액션타입
    private String actionUrl; // 액션 수행 URL

    // 트리 구조의 핵심 ㅣ 자식 노드 리스트
    @JsonInclude(JsonInclude.Include.NON_EMPTY) // 자식이 없을 때 필드 자체를 숨기고 싶다면 사용
    private List<UiResponseDto> children = new ArrayList<>();

    // Entity를 DTO로 변환하는 생성자
    public UiResponseDto(UiMetadata entity) {
        this.componentId = entity.getComponentId();
        this.parentGroupId = entity.getParentGroupId();
        this.labelText = entity.getLabelText();
        this.componentType = entity.getComponentType();
        this.sortOrder = entity.getSortOrder();
        this.isRequired = entity.getIsRequired();
        this.isReadonly = entity.getIsReadonly();
        this.isVisible = entity.getIsVisible();
        this.cssClass = entity.getCssClass();
        this.actionType = entity.getActionType();
        this.actionUrl = entity.getActionUrl();
        // children은 트리 구성 로직에서 별도로 채워짐
    }
}
