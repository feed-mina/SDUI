'use client';

import React from "react";
// DynamicEngine 폴더에 만든 타입을 가져와서 쓰자
import {Metadata} from "../DynamicEngine/type";

interface TextAreaFieldProps {
    id: string;
    meta: Metadata; // 개별 정의 대신 Metadata 타입을 그대로 사용
    data?: any;
    value?: string;
    onChange: (id: string, value: string) => void;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({ id, meta, data, value, onChange }) => {
    // 1. 스타일 파싱 로직 (안전하게)
    let customStyle: React.CSSProperties = {};
    try {
        customStyle = typeof meta.inlineStyle === 'string'
            ? JSON.parse(meta.inlineStyle)
            : (meta.inlineStyle || {});
    } catch (e) {
        customStyle = {};
    }

    // 2. 키 매핑 및 값 결정
    const targetKey = meta.ref_data_id || meta.refDataId || meta.componentId;
    const finalValue = value || (data && targetKey && data[targetKey]) || "";

    // 3. 읽기 전용 여부 판단 (문자열 "true"도 불리언으로 변환)
    const isReadOnly = meta.isReadonly === true || meta.isReadonly === "true";

    return (
        <div className="testfield" style={{ width: '100%' }}>
            {meta.labelText && <label style={{ display: 'block', marginBottom: '5px' }}>{meta.labelText}</label>}
            <textarea
                id={id}
                className={meta.cssClass}
                style={{
                    width: '100%',
                    minHeight: '150px',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    ...customStyle
                }}
                value={finalValue}
                placeholder={meta.placeholder}
                // HTML textarea의 readOnly는 boolean을 기대하므로 변환된 값을 넣어줌
                readOnly={isReadOnly}
                onChange={(e) => onChange(id, e.target.value)}
            />
        </div>
    );
};

export default TextAreaField;