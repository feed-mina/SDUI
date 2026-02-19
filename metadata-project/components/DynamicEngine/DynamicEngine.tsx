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

    // 1. 파라미터 타입을 Metadata[] | null | undefined 로 확장
    const renderNodes = (nodes?: Metadata[] | null, rowData: any = null) => {
        // 2. nodes가 없으면 즉시 null 반환 (런타임 에러 방지)
        if (!nodes) return null;

        return nodes.map((node) => {
            const isVisible = node.isVisible !== false && node.isVisible !== "false" &&
                node.is_visible !== false && node.is_visible !== "false";
            if (!isVisible) return null;

            const rawId = node.componentId || node.component_id || node.uiId;
            const uId = String(rawId);
            const isGroup = node.children && node.children.length > 0;

            if (isGroup) {
                const classList = [];
                const refId = node.refDataId || node.ref_data_id;
                const isRepeater = !!refId;
                const cid = node.componentId || node.component_id;
                const customClass = node.cssClass || node.css_class;

                if (cid) {
                    classList.push(`group-${cid}`);
                }

                if (customClass) {
                    classList.push(customClass);
                } else if (cid && !classList.includes(cid)) {
                    classList.push(cid);
                }

                const directionClass = node.groupDirection === "ROW" ? "flex-row-layout" : "flex-col-layout";
                classList.push(directionClass);

                const combinedClassName = Array.from(new Set(classList))
                    .filter(Boolean)
                    .join(' ')
                    .trim();

                const hasAction = !!node.actionType;

                if (isRepeater) {
                    const list = pageData?.[refId];
                    if (!list || !Array.isArray(list)) {
                        console.warn(`[DynamicEngine] ${refId} 데이터가 배열이 아닙니다.`, list);
                        return null;
                    }

                    return list.map((item: any, idx: number) => {
                        // 3. 리피터 내의 개별 아이템 클릭 핸들러
                        const handleClick = hasAction ? () => onAction(node, item) : undefined;

                        return (
                            <div
                                key={`${uId}-${idx}`}
                                className={combinedClassName}
                                style={{ cursor: hasAction ? 'pointer' : 'default' }}
                                onClick={handleClick}
                            >
                                {renderNodes(node.children, item)}
                            </div>
                        );
                    });
                }

                // 4. 일반 그룹의 클릭 핸들러 (rowData 전달)
                const handleGroupClick = hasAction ? () => onAction(node, rowData) : undefined;
                return (
                    <div
                        key={uId}
                        className={combinedClassName}
                        style={{ cursor: hasAction ? 'pointer' : 'default' }}
                        onClick={handleGroupClick}
                    >
                        {renderNodes(node.children, rowData)}
                    </div>
                );
            }

            const typeKey = (node.componentType || node.component_type || "").toUpperCase();
            const Component = componentMap[typeKey];

            if (!Component || typeKey === "DATA_SOURCE") return null;

            const finalData = getComponentData(node, rowData);

            return (
                <Component
                    key={uId}
                    id={uId}
                    meta={node}
                    data={finalData}
                    onChange={onChange}
                    onAction={onAction}
                    {...rest}
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