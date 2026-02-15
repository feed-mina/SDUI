'use client';

import React from "react";

// 2. 컴포넌트 Props 타입 정의
interface ButtonFieldProps {
    meta: any;
    data?: any; // 행 데이터 또는 현재 폼 데이터
    onAction: (meta: any, data?: any) => void;
    [key: string]: any;
}

const ButtonField: React.FC<ButtonFieldProps> = ({ meta, data, onAction }) => {

    // DB와 API 응답에 따라 다른 속성명을 모두 체크
    const label = meta.labelText || meta.label_text || "버튼";
    const className = meta.cssClass || meta.css_class || "diary-btn";
    const styleStr = meta.inlineStyle || meta.inline_style || "{}";

    // 인라인 스타일 안전하게 파싱
    const getInlineStyle = () => {
        try {
            return JSON.parse(styleStr);
        } catch (e) {
            console.error("스타일 파싱 중 오류 발생:", e);
            return {};
        }
    };

    return (
        <button
            className={className}
            style={getInlineStyle()}
            onClick={() => onAction(meta, data)} // meta와 data를 함께 전달
        >
            {label}
        </button>
    );
};

export default ButtonField;