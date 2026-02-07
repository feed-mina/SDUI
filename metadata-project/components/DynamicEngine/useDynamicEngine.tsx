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

         const itemParentId = item.parent_group_id || item.parentGroupId || null;
         const currentId = item.groupId || item.group_id || null;

         // 부모 ID와 내 그룹 ID가 같으면 자식으로 간주하지 않음
         if(parentId !== null && parentId === currentId) return false;

         // 1. 최상위 노드 찾기: 부모 ID가 없거나, 부모 ID가 리스트에 존재하지 않을 때만 Root로 인정
         if (parentId === null) {
          const parentExists = data.some(d => (d.group_id || d.groupId) === itemParentId);
          return itemParentId === null || !parentExists;
         }
         return itemParentId === parentId;
        })
        .map(item => {
         const currentId = item.group_id || item.groupId || null;
         // 자식이 있다면 재귀적으로 트리를 구성
         const children = currentId ? buildTree(data, currentId, depth + 1) : [];
         return { ...item, children: children.length > 0 ? children : null };
        });
   };
   return buildTree(metadata);
  }, [metadata]);

  // 데이터 추출 로직
  const getComponentData = (node: Metadata, rowData: any) => {
   if (rowData) return rowData;

   // ref_data_id가 있으면 특정 슬라이스를, 없으면 전체 pageData(formData 포함)를 넘겨준다.
   const refId = node.refDataId || node.ref_data_id;
   if (refId && pageData && pageData[refId]) {
    const remote = pageData[refId];
    return (remote.data && Array.isArray(remote.data)) ? (remote.data[0] || {}) : (remote.detail_source || remote || {});
   }

   return pageData || {}; // 여기가 핵심이야. 데이터가 없으면 전체를 다 줘버려.
  };

  return { treeData, getComponentData };
 };