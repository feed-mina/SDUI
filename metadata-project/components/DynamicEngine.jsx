// src/components/DynamicEngine.js

import InputField from "./fields/InputField";
import ButtonField from "./fields/ButtonField";
import ImageField from "./fields/ImageField";
import TextField from "./fields/TextField";
import SelectField from "./fields/SelectField";

const componentMap = {
    INPUT: InputField,
    TEXT: TextField,
    PASSWORD: InputField,
    BUTTON: ButtonField,
    SNS_BUTTON: ButtonField,
    LINK_BUTTON: ButtonField,
    IMAGE: ImageField,
    SELECT: SelectField,
    GROUP: (props) => <div>{props.children}</div>,
};

function DynamicEngine({ metadata, onChange, onAction, pageData , pwType, showPassword}) {

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
                console.log("currentId: ", currentId);

                // 현재 자식의 id와 부모가 같으면 자식을 찾지 않는다
                const children = (currentId && currentId  !== parentId)? buildTree(data, currentId, depth + 1) : [];
                return {
                    ...item,
                    children: children.length > 0 ? children : null
                };
            });
    };
    // 2, 계층 구조를 화면에 그리는 재귀함수
    const renderNodes = (nodes) =>{
        return nodes.map((node) =>{
            const uId = node.uiId || Math.random();
            const cId = node.componentId ;
           // 자식이 있다면 그룹 (div)를 먼저 만든다.
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
               return(
                   <div key={`group-${uId}`} className={`group-${cId}`} style={groupStyle}>
                       {renderNodes(node.children)} </div>
               );
        }

           // 자식은 없지만 타입이 GROUP인 경우 (빈 상자 방지)
            if ((node.componentType || "").toUpperCase() === "GROUP" ) {
                return null;
            }

            // 자식이 없다면 실제 컴포넌트를 그립니다.
            const typeKey = (node.componentType || "").toUpperCase();
            const Component = componentMap[typeKey];

            if (typeKey === "DATA_SOURCE") return null;
            if (Component) {
                const rDataId = node.refDataId || "";
                const remoteData = (pageData && pageData[rDataId]) ? pageData[rDataId] : { status: "success", data: [] };

                    return (
                        <Component
                            key={uId}
                            id={cId}
                            meta={node}
                            metadata={metadata}
                            remoteData={remoteData}
                            onChange={onChange}
                            onAction={onAction}
                            pwType={pwType}
                            showPassword={showPassword}
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
    return (
        <div className="engine-container" style={containerStyle}>
            {metadata.map((item) => {
                // 어떤 이름으로 들어와도 값을 꺼낼 수 있게 방어 로직 추가
                const cType = item.componentType || item.componentType || "";
                const cId = item.componentId || item.componentId || "";
                const rDataId = item.ref_data_id || item.refDataId || "";
                const uId = item.uiId || item.uiId || Math.random();

                const typeKey = cType.toUpperCase();
                const Component = componentMap[typeKey];
                console.log("cType: ", cType);
                // pageData가 없거나 해당 ID의 데이터가 없을 때의 기본값
                const remoteData = (pageData && pageData[rDataId])
                    ? pageData[rDataId]
                    : { status: "success", data: [] };

                if (typeKey === "DATA_SOURCE") return null;

                if (Component) {
                    return (
                        <Component
                            key={uId}
                            id={cId}
                            meta={item}
                            metadata={metadata}
                            remoteData={remoteData}
                            onChange={onChange}
                            onAction={onAction}
                        />
                    );
                }

                return (
                    <div  id={cId} key={uId} style={{ color: "red", border: "1px solid red", padding: "5px" }}>
                        알 수 없는 타입: {cType || "타입없음"} (ID: {cId || "ID없음"})
                    </div>
                );
            })}
        </div>
    );
}

export default DynamicEngine;