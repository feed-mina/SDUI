// 2026-02-07 추가 데이터 가공 및 트리 생성 로직
import {Metadata} from "@/components/DynamicEngine/type"

// @@@@ 2026-02-07 주석 추가
// useDynamicEngine 역할 : 메타데이터를 트리(부모-자식) 구조로 바꾸고 데이터를 매핑함, 데이터바인딩 (pageData에서 필드로 연결)
export const useDynamicEngine = (metadata: Metadata[], pageData: any, formData: any) => {

    const treeData = metadata;

    // @@@@ 데이터 추출 로직 개선: formData(입력값)가 있으면 최우선으로 반환
    const getComponentData = (node: Metadata, rowData: any) => {
        // rowData (리피터에서 넘겨준 개별 아이템)가 있으면 최 우선
        const refId = node.refDataId || node.ref_data_id;

        // 그 다음이 기존 pageData 로직
        // 1. 리피터 내부(rowData가 있을 때, 리스트의 개별 항목을 그릴 때) 처리
        // 사용자가 입력 중인 데이터(formData)가 있으면 그걸 먼저 보여준다.
        if (refId && formData && formData[refId] !== undefined) {
            return formData[refId];
        }

        // [핵심] 리피터 안(목록 페이지 등 rowData가 있을 때)에서는 row 객체 전체를 그냥 넘겨라!
        // 그래야 하위 컴포넌트가 자기가 필요한 키(title, reg_dt 등)를 스스로 꺼낸다.
        if (rowData) {
            return rowData;
        }


        // 필드명이 없으면 객체 전체를 반환 (이미지 컴포넌트 등에서 활용)

        //  리피터 외부 (상세 페이지) 라면 pageData 전체를 넘김
        if (refId && pageData && pageData[refId]) {
// @@@@ 2026-02-08 추가 리스트면 첫 번째 항목을 아니면 데이터 전체를 반환

            // [핵심] 리스트가 아닌 '단일 컴포넌트(TimeSlot 등)'인데 배열로 감싸져 왔다면 0번을 꺼내준다
            // 만약 컴포넌트 자체가 리스트를 다루는 '리피터'라면 배열 그대로를 반환한다
            const isRepeater = node.children && node.children.length > 0;
            if (!isRepeater && Array.isArray(pageData[refId])) {
                return pageData[refId][0] || {};
            }
            return isRepeater ? pageData[refId] : pageData;
        }
// @@@@ 2026-02-09 MAIN_PAGE처럼 데이터 소스가 없는 경우 전체 pageData (또는 빈 객체)를 반환
        return pageData || {};
    };
    return {treeData, getComponentData};
};