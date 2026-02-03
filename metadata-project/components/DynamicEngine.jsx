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

// [추가됨] 토큰 파싱 함수 (컴포넌트 밖에 둡니다)
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

function DynamicEngine({ metadata, onChange, onAction, pageData , pwType, showPassword}) {

    // [추가됨] 쿠키 가져오는 함수
    const getCookie = (name) => {
        if (typeof document === "undefined") return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    // [추가됨] 토큰에서 유저 정보 추출하여 변수 정의
    const token = getCookie("accessToken");
    const payload = token ? getPayloadFromToken(token) : null;
    const currentUserId = payload?.userId || "";
    const currentUserSqno = payload?.userSqno || "";
    console.log("토큰에서 뽑은 유저 ID:", currentUserId);
    console.log("토큰에서 뽑은 유저 Sqno:", currentUserSqno);
    // @@@2026-01-26 추가 트리 구조 생성을 메모제이션하여 성능을 최적화
    const treeData = useMemo(() => {
        console.log("엔진이 받은 원본 metadata:", metadata);
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
                    const children = (currentId && currentId  !== parentId)? buildTree(data, currentId, depth + 1) : [];
                    return {
                        ...item,
                        children: children.length > 0 ? children : null
                    };
                });
        };
        return buildTree(metadata, null);
    }, [metadata]);


    console.log('엔진창고(pageData):', pageData);

    const renderNodes = (nodes, rowData = null, rowIndex = 0) =>{
        return nodes.map((node) =>{
            // 가시성 판단
            const visibility = node.is_visible !== undefined ? node.is_visible : (node.isVisible !== undefined ? node.isVisible: true);
            if (visibility === false || String(visibility).toLowerCase() === "false") {
                return null;
            }

            const cId = node.componentId;
            const uniqueId = rowData ? `${cId}_${rowIndex}` : cId;
            const uId = node.uiId|| cId  || Math.random();
            const rDataId = node.refDataId || "";

            // A. 자식이 있다면 그룹(GROUP)으로 처리
            if (node.children && node.children.length > 0){
                const remoteData = (pageData && pageData[rDataId]) ? pageData[rDataId] : { status: "success", data: [] };

                // [수정됨] 문법 에러 수정 (= 하나 제거)
                const realData = (Array.isArray(remoteData.data)) ? remoteData.data : [];

                // 데이터가 있으면 그 데이터를 사용, 없으면 DIARY_CARD는 빈배열, 나머지는 [null]
                const dataList = (realData.length > 0)
                    ? realData
                    : (node.componentId === "DIARY_CARD" ? [] : [null]);

                // 데이터 없음 안내 문구
                if (node.componentId === "DIARY_CARD" && dataList.length === 0) {
                    console.log(` [${node.componentId}]가 찾는 키: "${node.refDataId}"`);
                    console.log(`   실제 그 키에 들어있는 것:`, pageData?.[node.refDataId]);
                    return (
                        <div key={`empty-${uId}`} style={{ padding: "50px 0", textAlign: "center", color: "#bbb", width: "100%" }}>
                            작성된 일기가 없습니다.
                        </div>
                    );
                }

                const groupStyle = {
                    display: "flex",
                    flexDirection: node.groupDirection === "ROW" ? "row" : "column",
                    width: "100%",
                    gap: "10px",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    position: node.componentId ==="PW_SUB_GROUP" ? "relative" : "static",
                    flexWrap: "nowrap",
                };

                return dataList.map((row, index) => (
                    <div key={`group-${uId}-${index}`} className={`group-${cId}`} style={groupStyle}
                         onClick={() => {
                             if (node.actionType) {
                                 onAction(node, row); // 메타정보와 현재 줄의 데이터(row)를 같이 넘깁니다.
                             }
                         }}
                    >
                        {renderNodes(node.children, row)}
                    </div>
                ));
            }

            // B. 개별 컴포넌트 렌더링
            const typeKey = (node.componentType || node.component_type || "").toUpperCase();
            const Component = componentMap[typeKey];

            if (typeKey === "DATA_SOURCE") return null;
            if (Component) {
                return (
                    <Component
                        key={uniqueId}
                        id={uniqueId}
                        meta={node}
                        metadata={metadata}
                        // [수정됨] 이제 currentUserId가 정의되어 에러가 나지 않습니다.
                        data={rowData ? { ...rowData } : {
                            user_id: currentUserId,
                            user_sqno: currentUserSqno
                        }}
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