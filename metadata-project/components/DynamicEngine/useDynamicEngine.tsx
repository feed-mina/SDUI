// 2026-02-07 추가 데이터 가공 및 트리 생성 로직
import {Metadata} from "@/components/DynamicEngine/type"

// @@@@ 2026-02-07 주석 추가
 // useDynamicEngine 역할 : 메타데이터를 트리(부모-자식) 구조로 바꾸고 데이터를 매핑함, 데이터바인딩 (pageData에서 필드로 연결)
 export const useDynamicEngine = (metadata: Metadata[], pageData: any) => {

     const treeData = metadata;

  // 데이터 추출 로직
  const getComponentData = (node: Metadata, rowData: any) => {
      // rowData (리피터에서 넘겨준 개별 아이템)가 있으면 최 우선
      const refId = node.refDataId || node.ref_data_id;

      // 1. 리피터 내부(rowData가 있을 때, 리스트의 개별 항목을 그릴 때) 처리
      if (rowData) {
          // 내 refId(예: 'title')에 해당하는 값이 rowData 안에 있으면 그 값만 반환
          if (refId && rowData[refId] !== undefined) {
              return rowData[refId];// 문자열만 반환
          }
          // 필드명이 없으면 객체 전체를 반환 (이미지 컴포넌트 등에서 활용)
          return rowData;
      }
      //  리피터 외부 (전역 데이터 창고 참조)
   if (refId && pageData && pageData[refId]) {
    const remote = pageData[refId];
// @@@@ 2026-02-08 추가 리스트면 첫 번째 항목을 아니면 데이터 전체를 반환
       return Array.isArray(remote) ? (remote[0] || {}) : remote;
   }
// @@@@ 2026-02-09 MAIN_PAGE처럼 데이터 소스가 없는 경우 전체 pageData (또는 빈 객체)를 반환
   return pageData || {};
  };

  return { treeData, getComponentData };
 };