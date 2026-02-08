 // 2026-02-07 추가 데이터 가공 및 트리 생성 로직
 import { useMemo } from "react";
 import { Metadata } from "@/components/DynamicEngine/type"



 // @@@@ 2026-02-07 주석 추가
 // useDynamicEngine 역할 : 메타데이터를 트리(부모-자식) 구조로 바꾸고 데이터를 매핑함
 export const useDynamicEngine = (metadata: Metadata[], pageData: any) => {
  // 트리 생성 로직
  const treeData = useMemo(() => {
   const buildTree = (data: Metadata[], parentId: string | null = null, depth = 0): Metadata[] => {
    if (depth > 5) return [];
    return data
        .filter(item => {
        // @@@@ 2026-02=08 추가 백엔드 키값 componentId, parentGroupId에 맞게 수정
         const itemParentId = item.parentGroupId || item.parent_group_id ||  null;
         // const currentId = item.groupId || item.group_id || null;

         // @@@@ 2026-02-08 수정 최상위 노드 부모가 없거나 내 부모 ID가 전체 목록의 어떤 ID 와도 일치하지 않을때
         // 1. 최상위 노드 찾기: 부모 ID가 없거나, 부모 ID가 리스트에 존재하지 않을 때만 Root로 인정
         if (parentId === null) {
          const parentExists = data.some(d => (d.component_id || d.componentId) === itemParentId);
          return itemParentId === null || !parentExists;
         }
         return itemParentId === parentId;
        })
        .map(item => {
            // @@@@ 2026-02-08 내 ID를 추출할때 componentId를 우선 참조
         const currentId = item.componentId || item.component_id ||item.groupId || item.group_id;
         //  @@@@ 2026-02-08 만약 이미 자식(childeren)이 있다면 그걸 쓰고 없으면 재귀적으로 찾음 재귀적으로 트리를 구성
         const children = (item.children && item.children.length > 0)
             ? item.children
             : (currentId? buildTree(data, currentId, depth + 1):[]);
             // currentId ? buildTree(data, currentId, depth + 1) : [];
         return { ...item, children: children.length > 0 ? children : null };
        });
   };
   return buildTree(metadata);
  }, [metadata]);

  // 데이터 추출 로직
  const getComponentData = (node: Metadata, rowData: any) => {
      // rowData (리피터에서 넘겨준 개별 아이템)가 있으면 최 우선
   if (rowData) return rowData;
      const refId = node.refDataId || node.ref_data_id;
// 특정 데이터 소스를 참조하는 경우
   if (refId && pageData && pageData[refId]) {
    const remote = pageData[refId];
// @@@@ 2026-02-08 추가 리스트면 첫 번째 항목을 아니면 데이터 전체를 반환
    return (Array.isArray(remote.data)) ? (remote.data[0] || {}) : (remote.data || remote );
   }
// @@@@ 2026-02-09 MAIN_PAGE처럼 데이터 소스가 없는 경우 전체 pageData (또는 빈 객체)를 반환
   return pageData || {};
  };

  return { treeData, getComponentData };
 };