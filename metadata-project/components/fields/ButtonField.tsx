'use client';

import React from "react";

interface ButtonFieldProps {
    meta: any;
    data?: any;
    onAction: (meta: any, data?: any) => void;
}

const ButtonField: React.FC<ButtonFieldProps> = ({ meta, data, onAction }) => {
    const label = meta.labelText || meta.label_text || "버튼";
    const className = meta.cssClass || meta.css_class || "diary-btn";

    // 읽기 전용 여부 판단
    const isReadOnly = meta.isReadonly === true || meta.isReadonly === "true" ||
        meta.is_readonly === true || meta.is_readonly === "true";

    return (
        <button
            className={className}
            disabled={isReadOnly} // 읽기 전용일 때 버튼 비활성화
            onClick={() => !isReadOnly && onAction(meta, data)}
        >
            {label}
        </button>
    );
};

export default ButtonField;