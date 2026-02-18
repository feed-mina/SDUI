// @@@@ 2026-02-07 변경 DynamicEngine 훅,렌더링,컴포넌트 부분 따로 분리
'use client';
import React from "react";
import {componentMap} from "./componentMap";
import {useDynamicEngine} from "./useDynamicEngine";
import {DynamicEngineProps, Metadata} from "./type";

// @@@@ 2026-02-07 주석 추가
// DynamicEngine 역할 : 분석된 구조를 바탕으로 실제 리액트 컴포넌트를 랜더링
const DynamicEngine: React.FC<DynamicEngineProps> = (props) => {
    const {metadata, pageData, formData, onChange, onAction, ...rest} = props;
    const {treeData, getComponentData} = useDynamicEngine(metadata, pageData, formData);

    const renderNodes = (nodes: Metadata[], rowData: any = null) => {

        if (!nodes) return null;
        return nodes.map((node) => {
            const isVisible = node.isVisible !== false && node.isVisible !== "false" &&
                node.is_visible !== false && node.is_visible !== "false";
            // @@@@  가시성 판단 (isVisible이 false면 렌더링 안 함)
            if (!isVisible) return null;
            // @@@@ id를 반드시 문자열(String)로 보장하여 .includes() 에러 방지
            const rawId = node.componentId || node.component_id || node.uiId;
            const uId = String(rawId);

            // //  @@@@  그룹 또는 리피터 처리
            if (node.children && node.children.length > 0) {
                const refId = node.refDataId || node.ref_data_id;
                // @@@@  데이터가 진짜 '배열'이고, '리스트'를 그려야 하는 컴포넌트일 때만 map 실행
                const isRepeater = refId

                const groupStyle: React.CSSProperties = {
                    display: "flex",
                    flexDirection: node.groupDirection === "ROW" ? "row" : "column",
                    width: "100%",
                    gap: "10px",
                    alignItems: "center"
                };
                // @@@@ 리피터(데이터 목록을 반복해서 그림)
                if (isRepeater) {
                    const list = pageData?.[refId];

                    // 2. 데이터가 없거나 배열이 아니면 아무것도 그리지 않고 탈출 (이게 핵심!)
                    if (!list || !Array.isArray(list)) {
                        console.warn(`[DynamicEngine] ${refId} 에 해당하는 리스트 데이터가 없거나 배열이 아닙니다.`, list);
                        return null;
                    }
                    console.log('DynamicEngine list', list);


                    return list.map((item: any, idx: number) => {
                        // 액션이 있는 경우 클릭 핸들러 생성
                        const hasAction = node.actionType ;
                        const handleClick = hasAction ? () => onAction(node, item) : undefined;

                        return (
                            <div
                                key={`${uId}-${idx}`}
                                className={`group-${node.componentId}`}
                                style={{ ...groupStyle, cursor: hasAction ? 'pointer' : 'default' }}
                                onClick={handleClick} // 이 부분이 핵심!
                            >
                                {renderNodes(node.children!, item)}
                            </div>
                        );
                    });
                }

                // @@@@ 단순 레이아웃 그룹 (부모가 준 rowData를 자식에게 전달)
                const hasGroupAction = node.actionType ;
                return (
                    <div
                        key={uId}
                        className={`group-${node.componentId}`}
                        style={{ ...groupStyle, cursor: hasGroupAction ? 'pointer' : 'default' }}
                        onClick={hasGroupAction ? () => onAction(node, rowData) : undefined}
                    >
                        {renderNodes(node.children, rowData)}
                    </div>
                );
            }

            // @@@@ 개별 컴포넌트(Field) 렌더링
            const typeKey = (node.componentType || node.component_type || "").toUpperCase();
            const Component = componentMap[typeKey];

            //  @@@@  데이터 소스 타입이거나 매핑된 컴포넌트가 없으면 무시
            if (!Component || typeKey === "DATA_SOURCE") return null;

            //  @@@@ 해당 컴포넌트가 사용할 데이터 추출
            const finalData = getComponentData(node, rowData);
            // console.log('DynamicEngine finalData', finalData);

            return (
                <Component
                    key={uId} // 고정된 ID를 사용하여 컴포넌트 재생성 방지
                    id={uId}
                    meta={node}
                    data={finalData}
                    onChange={onChange}
                    onAction={onAction}
                    {...rest} // pwType, showPassword 등 부모의 다른 props 전달
                />
            );
        });
    };

    return (
        <div className="engine-container">
            {renderNodes(treeData)}
        </div>
    );
};

export default DynamicEngine;