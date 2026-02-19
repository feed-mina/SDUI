'use client';

import React from "react";

interface TextFieldProps {
    meta: {
        componentId: string; // any -> string으로 변경 권장 (중요)
        ref_data_id?: string;
        refDataId?: string;
        labelText?: string;
        cssClass?: string;
        inlineStyle?: any;
        isVisible?: any;
        isReadonly?: any;
    };
    data?: any;
    value?: string;
}

const TextField: React.FC<TextFieldProps> = ({meta, data, value}) => {
    let parsedStyle = {};
    try {
        if (meta.inlineStyle) {
            if (typeof meta.inlineStyle === 'string') {
                parsedStyle = JSON.parse(meta.inlineStyle);
            } else {
                parsedStyle = meta.inlineStyle;
            }
        }
    } catch (e) {
        console.error(`[TextField] 스타일 파싱 에러 (${meta.componentId}):`, meta.inlineStyle);
    }
    const isVisible = meta.isVisible !== false && meta.isVisible !== "false";
    const customStyle = {
        ...parsedStyle,
        // visibility: (isVisible? "hidden" : "visible") as "visible" | "hidden"
        visibility: (isVisible ? "visible" : "hidden") as "visible" | "hidden"
    };

    // [핵심 수정 1] key가 절대 undefined가 되지 않도록 '내 이름(componentId)'을 방어막으로 둡니다.
    // ref_data_id(스네이크) -> refDataId(카멜) -> componentId(내 이름) 순서
    const targetKey = meta.ref_data_id || meta.refDataId || meta.componentId || "0218";

    // [핵심 수정 2] 최종 값 결정 로직 통합
    // 1. 엔진이 준 value가 있으면 최우선
    // 2. 없으면 data에서 targetKey로 찾음
    // 3. 그것도 없으면 빈 문자열
    let finalValue = value || "";
    if (!finalValue && data) {
        if (typeof data !== 'object') {
            finalValue = data;
        } else if (targetKey && data[targetKey] !== undefined) {
            finalValue = data[targetKey]; // 객체에서 꺼내야 하는 경우
        }
    }
    //  [분기 처리] 읽기 전용(isReadonly)이거나, 리스트처럼 단순히 보여주는 경우
    if (meta.isReadonly === true || meta.isReadonly === "true") {
        return (
            <div
                className={meta.cssClass}
                style={customStyle}
            >
                {/* 값이 없을 때 높이가 무너지는 것을 방지하기 위해 공백 문자(\u00A0) 추가 */}
                {finalValue || "\u00A0"}
            </div>
        );
    }

    //   [분기 처리] 입력 가능한 Input (나중에 확장성을 위해 남겨둠)
    // 현재는 Readonly가 아니어도 div로 보여주는 구조라면 아래를 유지.
    // 만약 input 입력창이 필요하다면 여기에 <input ... /> 로직 추가.
    return (
        <div className={meta.cssClass} style={customStyle}>
            {finalValue}
        </div>
    );
};

export default TextField;