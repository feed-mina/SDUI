'use client';

import React from "react";
import {Metadata} from "../DynamicEngine/type";

interface TextAreaFieldProps {
    id: string;
    meta: Metadata;
    data?: any;
    onChange: (id: string, value: string) => void;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({id, meta, data, onChange}) => {
    const targetKey = meta.ref_data_id || meta.refDataId || meta.componentId;

    // 엔진에서 평탄화된 데이터가 오므로 data가 문자열이면 바로 사용
    const value = (typeof data === 'string' || typeof data === 'number')
        ? data
        : (data?.[targetKey] || "");

    const isReadOnly = meta.isReadonly === true || meta.isReadonly === "true" ||
        meta.is_readonly === true || meta.is_readonly === "true";

    return (
        <div className={meta.css_class || "textarea-field-wrap"}>
            {meta.labelText && <label>{meta.labelText}</label>}
            <textarea
                id={id}
                className="common-textarea"
                value={value}
                placeholder={meta.placeholder}
                readOnly={isReadOnly}
                onChange={(e) => !isReadOnly && onChange(targetKey, e.target.value)}
            />
        </div>
    );
};

export default TextAreaField;