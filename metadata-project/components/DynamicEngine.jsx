'use client'
import React, { useMemo } from "react";
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
    TEXTAREA: TextAreaField,
    TIME_RECORD_WIDGET: RecordTimeComponent,
    DATETIME_PICKER: DateTimePicker,
};

// [유틸] 토큰 파싱 함수
const getPayloadFromToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

function DynamicEngine({ metadata, onChange, onAction, pageData, pwType, showPassword }) {

    // [유틸] 쿠키 가져오기
    const getCookie = (name) => {
        if (typeof document === "undefined") return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    // 토큰에서 유저 정보 추출
    const token = getCookie("accessToken");
    const payload = token ? getPayloadFromToken(token) : null;
    const currentUserId = payload?.userId || "";
    const currentUserSqno = payload?.userSqno || "";

    // 트리 구조 생성 (Memoization)
    const treeData = useMemo(() => {
        const buildTree = (data, parentId = null, depth = 0) => {
            if (depth > 5) return [];
            return data
                .filter(item => {
                    const itemParentId = item.parent_group_id || item.parentGroupId || null;
                    if (parentId === null) {
                        const parentExists = data.some(d => (d.group_id || d.groupId) === itemParentId);
                        return itemParentId === null || !parentExists;
                    }
                    return itemParentId === parentId;
                })
                .map(item => {
                    const currentId = item.group_id || item.groupId || null;
                    const children = (currentId && currentId !== parentId) ? buildTree(data, currentId, depth + 1) : [];
                    return {
                        ...item,
                        children: children.length > 0 ? children : null
                    };
                });
        };
        return buildTree(metadata, null);
    }, [metadata]);


    const renderNodes = (nodes, rowData = null, rowIndex = 0) => {
        return nodes.map((node) => {
            // 가시성 판단
            const visibility = node.is_visible !== undefined ? node.is_visible : (node.isVisible !== undefined ? node.isVisible : true);
            if (visibility === false || String(visibility).toLowerCase() === "false") {
                return null;
            }

            const cId = node.componentId;
            const uniqueId = rowData ? `${cId}_${rowIndex}` : cId;
            const uId = node.uiId || cId || Math.random();
            // const rDataId = node.refDataId || ""; // 사용 안 함 (아래 로직으로 대체)

            // A. 자식이 있다면 그룹(GROUP)으로 처리
            if (node.children && node.children.length > 0) {
                const groupStyle = {
                    display: "flex",
                    flexDirection: node.groupDirection === "ROW" ? "row" : "column",
                    width: "100%",
                    gap: "10px",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    position: node.componentId === "PW_SUB_GROUP" ? "relative" : "static",
                    flexWrap: "nowrap",
                };

                // [CASE 1] 리피터(Repeater): DB 데이터와 연결된 그룹 (예: DIARY_CARD)
                // 이 그룹은 데이터를 반복해서 찍어내야 합니다.
                if (node.refDataId && pageData && pageData[node.refDataId]) {
                    const remoteData = pageData[node.refDataId];
                    const realData = (remoteData && Array.isArray(remoteData.data)) ? remoteData.data : [];

                    // 데이터 없음 안내 문구 (DIARY_CARD인 경우만)
                    if (realData.length === 0 && node.componentId === "DIARY_CARD") {
                        return (
                            <div key={`empty-${uId}`} style={{ padding: "50px 0", textAlign: "center", color: "#bbb", width: "100%" }}>
                                작성된 일기가 없습니다.
                            </div>
                        );
                    }

                    // 데이터를 하나씩 꺼내서 자식에게 전달 (row 전달)
                    return realData.map((row, index) => (
                        <div key={`group-${uId}-${index}`} className={`group-${cId}`} style={groupStyle}
                             onClick={() => {
                                 if (node.actionType) {
                                     onAction(node, row);
                                 }
                             }}
                        >
                            {renderNodes(node.children, row, index)}
                        </div>
                    ));
                }

                    // [CASE 2] 레이아웃(Layout): 단순히 묶어주는 그룹 (예: DIARY_CARD_HEADER)
                // 데이터를 새로 찾지 말고, 부모가 준 'rowData'를 그대로 자식에게 토스해야 합니다.
                else {
                    return (
                        <div key={`group-${uId}`} className={`group-${cId}`} style={groupStyle}>
                            {/* rowData를 그대로 전달하는 것이 포인트! */}
                            {renderNodes(node.children, rowData, rowIndex)}
                        </div>
                    );
                }
            }

            // B. 개별 컴포넌트 렌더링
            const typeKey = (node.componentType || node.component_type || "").toUpperCase();
            const Component = componentMap[typeKey];

            if (typeKey === "DATA_SOURCE") return null;

            if (Component) {
                // 1. 기본 데이터 준비
                // rowData가 있으면(리스트) 그걸 쓰고, 없으면(상세/폼) 유저 정보를 기본으로 씀
                let finalData = rowData ? { ...rowData } : {
                    user_id: currentUserId,
                    user_sqno: currentUserSqno
                };

                // 2. 상세 페이지용 데이터 병합 로직
                // 리스트 밖이고(!rowData), 참조할 데이터가 있으면 가져와서 합침
                if (!rowData && node.refDataId && pageData && pageData[node.refDataId]) {
                    const sourceData = pageData[node.refDataId].data?.[0];
                    if (sourceData) {
                        finalData = { ...finalData, ...sourceData };
                    }
                }

                // [디버깅 로그] - 개발 중에만 확인하고 나중에 지우세요
                if (node.componentId === "detail_title") {
                    console.log(" [제목 컴포넌트] 최종 데이터:", finalData);
                }

                return (
                    <Component
                        key={uniqueId}
                        id={uniqueId}
                        meta={node}
                        metadata={metadata}
                        data={finalData} // 중괄호 한 번만! ({finalData} 아님)
                        onChange={onChange}
                        onAction={onAction}
                    />
                );
            }
            return <div key={uId} style={{ color: "red" }}>알 수 없는 타입: {typeKey}</div>;
        });
    };

    return (
        <div className="engine-container" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {renderNodes(treeData)}
        </div>
    );
}

export default DynamicEngine;