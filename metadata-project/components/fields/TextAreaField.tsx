'use client';

import React from "react";

interface TextAreaFieldProps {
    id: string;
    meta: {
        componentId: string;
        labelText?: string;
        placeholder?: string;
        cssClass?: string;
        inlineStyle?: string;
        isReadonly?: boolean;
    };
    onChange: (id: string, value: string) => void;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({ id, meta, onChange }) => {    // console.log(`[${meta.componentId}] 배달된 상자의 열쇠들:`, data ? Object.keys(data) : "데이터 없음");
    // console.log(`[${meta.componentId}] 내가 가진 열쇠(refDataId):`, meta.ref_data_id);

    let customStyle: React.CSSProperties = {};
    try {
        customStyle = JSON.parse(meta.inlineStyle || "{}");
    } catch (e) {
        customStyle = {};
    }

    return (<div className="field-container" style={{ width: '100%' }}>
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
                placeholder={meta.placeholder}
                readOnly={meta.isReadonly}
                // 글자가 바뀔 때마다 부모(usePageActions)의 formData를 업데이트함
                onChange={(e) => onChange(id, e.target.value)}
            />
        </div>
    );
};

export default TextAreaField;