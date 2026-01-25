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
};

function DynamicEngine({ metadata, onChange, onAction, pageData , pwType, showPassword}) {
    // console.log("현재 엔진이 들고 있는 전체 창고(pageData):", pageData);

    // 1. groupid로 트리 구조 생성 함수
    const buildTree = (data, parentId = null, depth = 0) => {
        if (depth > 5) return [];

        return data
            .filter(item => {
                const itemParentId = item.parent_group_id || item.parentGroupId || null;

                // 1. parentId가 null일 때: 실제 null이거나,
                //    데이터 전체를 뒤져봐도 해당 부모 ID를 가진 항목이 '컴포넌트'로 존재하지 않을 때 최상위로 간주
                if (parentId === null) {
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
    // 2, 계층 구조를 화면에 그리는 재귀함수
    const renderNodes = (nodes,rowData = null, rowIndex = 0) =>{
        return nodes.map((node) =>{

            // [중요 수정 1] ID 생성 로직 변경
            // rowData가 있으면(리스트 반복 중) ID 뒤에 인덱스를 붙여 고유하게 만들고(예: title_0, title_1),
            // rowData가 없으면(로그인 폼 등) 원래 ID를 그대로 사용합니다(예: email).
            const cId = node.componentId;
            const uniqueId = rowData ? `${cId}_${rowIndex}` : cId;
            const uId = node.uiId || Math.random();

            const rDataId = node.refDataId || "";


            const remoteData = (pageData && pageData[rDataId]) ? pageData[rDataId] : { status: "success", data: [] };

            const dataList = (Array.isArray(remoteData.data) && remoteData.data.length > 0)
                ? remoteData.data : [null];

            // A. 자식이 있다면 그룹(GROUP)으로 처리
            if (node.children && node.children.length > 0){
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



            // [중요 수정 2] isVisible 처리 강화
            // false(불리언)와 "FALSE"(문자열) 모두 처리하여 숨김 적용
            const rawVisible = node.isVisible ?? node.is_visible ?? true;
            if (rawVisible === false || String(rawVisible).toUpperCase() === "FALSE") {
                console.log('rawVisible', rawVisible);
                return null;
            }

            //  B.   자식이 없다면 실제 컴포넌트(INPUT, BUTTON 등) 그리기
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


    const containerStyle = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        gap: "10px"
    };
    if (!metadata || metadata.length === 0) {
        return <div style={containerStyle}>표시할 정보가 없습니다.</div>;
    }

    // 3, 최상위 (parentId가 null인것) 부터 렌더링 시작
    const treeData = buildTree(metadata, null);
    return(
        <div className="engine-container" style={containerStyle}>
            {renderNodes(treeData)}
        </div>
    );

}

export default DynamicEngine;