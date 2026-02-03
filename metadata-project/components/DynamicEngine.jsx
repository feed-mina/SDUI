// src/components/DynamicEngine.js
'use client'
import InputField from "./fields/InputField";
import ButtonField from "./fields/ButtonField";
import ImageField from "./fields/ImageField";
import TextField from "./fields/TextField";
import SelectField from "./fields/SelectField";
import PasswordField from "@/components/fields/PasswordField";
import Pagination from "@/components/Pagination";
import TextAreaField from "@/components/fields/TextAreaField";
import EmailSelectField from "./fields/EmailSelectField";
import EmotionSelectField from "./fields/EmotionSelectField";
import RecordTimeComponent from "./fields/RecordTimeComponent";
import DateTimePicker from "./fields/DateTimePicker";
import React, {useMemo} from "react";

const componentMap = {
    INPUT: InputField,
    TEXT: TextField,
    PASSWORD: PasswordField,
    BUTTON: ButtonField,
    SNS_BUTTON: ButtonField,
    LINK_BUTTON: ButtonField,
    IMAGE: ImageField,
    EMAIL_SELECT: EmailSelectField,
    EMOTION_SELECT: EmotionSelectField,
    SELECT: SelectField,
    GROUP: (props) => <div>{props.children}</div>,
    TEXTAREA : TextAreaField,
    TIME_RECORD_WIDGET : RecordTimeComponent,
    DATETIME_PICKER : DateTimePicker,
};

function DynamicEngine({ metadata, onChange, onAction, pageData , pwType, showPassword}) {
    // console.log("현재 엔진이 들고 있는 전체 창고(pageData):", pageData);

    // @@@2026-01-26 추가 트리 구조 생성을 메모제이션하여 성능을 최적화
    const treeData = useMemo(() => {
        console.log("엔진이 받은 원본 metadata:", metadata); // 여기서 해당 항목의 is_visible을 확인!
        const buildTree = (data, parentId = null, depth = 0) => {
            if (depth > 5) return [];
            return data
                .filter(item => {
                    const itemParentId = item.parent_group_id || item.parentGroupId || null;

                    // parentId가 null일 때: 실제 null이거나,
                    //    데이터 전체를 뒤져봐도 해당 부모 ID를 가진 항목이 '컴포넌트'로 존재하지 않을 때 최상위로 간주
                    if (parentId === null) {
                        // console.log('data', data);

                        const parentExists = data.some(d => (d.group_id || d.groupId) === itemParentId);
                        return itemParentId === null || !parentExists;
                    }

                    // 2. parentId가 있을 때: 정확히 일치하는 자식들만 찾음
                    return itemParentId === parentId;
                })
                .map(item => {
                    const currentId = item.group_id || item.groupId || null;
                    // console.log("currentId: ", currentId);

                    // 현재 자식의 id와 부모가 같으면 자식을 찾지 않는다
                    const children = (currentId && currentId  !== parentId)? buildTree(data, currentId, depth + 1) : [];
                    return {
                        ...item,
                        children: children.length > 0 ? children : null
                    };
                });
        };
        return buildTree(metadata, null);
    }, [metadata]);
    // 1. groupid로 트리 구조 생성 함수

    // 2, 계층 구조를 화면에 그리는 재귀함수
    const renderNodes = (nodes,rowData = null, rowIndex = 0) =>{
        return nodes.map((node) =>{
            // @@@@ 2026-01-26 수정 : 보이는 여부 체크를 가장 먼저 해서 불필요한 로직 실행을 막는다

            // console.log('node: ', node);
            // 가시성 판단 isVisible 처리
            const visibility = node.is_visible !== undefined ? node.is_visible : (node.isVisible !== undefined ? node.isVisible: true);
            if (visibility === false || String(visibility).toLowerCase() === "false") {
                // console.log(`[숨김 처리] ID: ${node.componentId}`);
                return null;
            }
            console.log('현재 그리는 노드:', node.componentId, '가시성:', visibility);
            // rowData가 있으면(리스트 반복 중) ID 뒤에 인덱스를 붙여 고유하게 만들고(예: title_0, title_1),
            // rowData가 없으면(로그인 폼 등) 원래 ID를 그대로 사용합니다(예: email).
            const cId = node.componentId;
            const uniqueId = rowData ? `${cId}_${rowIndex}` : cId;
            const uId = node.uiId|| cId  || Math.random();
            const rDataId = node.refDataId || "";

            // @@@@ 2026-01-26 수정 : 그룹 노드 렌더링

            // A. 자식이 있다면 그룹(GROUP)으로 처리
            if (node.children && node.children.length > 0){

                const remoteData = (pageData && pageData[rDataId]) ? pageData[rDataId] : { status: "success", data: [] };

                const dataList = (Array.isArray(remoteData.data) && remoteData.data.length > 0)
                    ? remoteData.data
                    : [null];

                const groupStyle = {
                    display: "flex",
                    flexDirection: node.groupDirection === "ROW" ? "row" : "column",
                    width: "100%",
                    gap: "10px",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    position:node.componentId ==="PW_SUB_GROUP" ? "relative" : "static",
                    flexWrap: "nowrap",

                };

                return dataList.map((row, index) => (
                    <div key={`group-${uId}-${index}`} className={`group-${cId}`} style={groupStyle}>
                        {/* 자식들에게 현재 줄의 데이터(row)를 넘겨줍니다. */}
                        {renderNodes(node.children, row)}
                    </div>
                ));
            }


            // 자식은 없지만 타입이 GROUP인 경우 (빈 상자 방지)
            // if (node.componentType === "GROUP" && node.refDataId) {
            //     const listData = pageData[node.refDataId]?.data || [];
            //     return listData.map((rowData) => (
            //         <div key={rowData.diary_id} style={node.inlineStyle}>
            //             {/* 자식 컴포넌트들을 돌며 rowData[field] 값을 매핑 */}
            //         </div>
            //     ));
            // }

            // 최상위 (parentId가 null인것) 부터 렌더링 시작
            //  B.   개별 컴포넌트 렌더링 자식이 없다면 실제 컴포넌트(INPUT, BUTTON 등) 그리기
            const typeKey = (node.componentType || node.component_type || "").toUpperCase();
            const Component = componentMap[typeKey];

            // console.log(`컴포넌트[${node.componentId}]가 찾는 상자: "${rDataId}"`);
            // console.log(`[검사] 컴포넌트: ${node.componentId}, 타입: ${node.componentType}, 찾는키: ${node.refDataId}`);
            // console.log("엔진이 컴포넌트에 전달하는 데이터:", remoteData);
            if (typeKey === "DATA_SOURCE") return null;
            if (Component) {
                // rowData가 있으면 그것을 쓰고, 없으면 pageData에서 찾거나 빈값
                //  const finalData = rowData ? rowData : (pageData && pageData[rDataId]?.data?.[0] || pageData[rDataId]);

                // rowData가 있으면 넘겨주고, 없으면 null (로그인 폼은 null 받음 -> InputField 내부 로직 따름)
                return (
                    <Component
                        key={uniqueId}      // React 리렌더링용 고유 키
                        id={uniqueId}
                        meta={node}
                        metadata={metadata} // 전체 설계도를 넘겨 자식들을 찾게 함
                        data={rowData ? { ...rowData } : null} // 찾은 데이터(일기 5개)를 넘겨줌
                        onChange={onChange}
                        onAction={onAction}
                    />

                );
            }
            return <div key={uId} style={{ color: "red" }}>알 수 없는 타입: {typeKey}</div>;
        });
    };

    return(
        <div className="engine-container"  style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {renderNodes(treeData)}
        </div>
    );
}

export default DynamicEngine;