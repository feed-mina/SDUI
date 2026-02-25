'use client';

import React, { memo } from "react";
import { cn } from "@/components/utils/cn";

interface TextFieldProps {
    meta: {
        componentId: string;
        ref_data_id?: string;
        refDataId?: string;
        labelText?: string;
        cssClass?: string;
        inlineStyle?: any;
        isVisible?: any;
        isReadonly?: any;
        is_readonly?: any;
    };
    data?: any;
    value?: string;
    [key: string]: any;
}

const TextField = memo(({ meta, data, value, ...rest }: TextFieldProps) => {
    // [핵심] div 태그가 인식하지 못하는 모든 '엔진용' 프롭을 여기서 걸러냄
    const {
        showPassword,
        onAction,
        onChange,
        pwType,
        className: externalClassName,
        ...domProps // 순수한 div 속성들
    } = rest;

    const isReadOnly = meta?.isReadonly === true || meta?.isReadonly === "true" ||
        meta?.is_readonly === true || meta?.is_readonly === "true";
    const isVisible = meta?.isVisible !== false && meta?.isVisible !== "false";

    const targetKey = meta?.ref_data_id || meta?.refDataId || meta?.componentId || "0218";

    let finalValue = value || "";
    if (!finalValue && data) {
        if (typeof data !== 'object') {
            finalValue = data;
        } else if (targetKey && data[targetKey] !== undefined) {
            finalValue = data[targetKey];
        }
    }

    let parsedStyle = {};
    try {
        if (meta?.inlineStyle) {
            parsedStyle = typeof meta.inlineStyle === 'string'
                ? JSON.parse(meta.inlineStyle)
                : meta.inlineStyle;
        }
    } catch (e) {
        console.error(`[TextField] 스타일 파싱 에러:`, e);
    }

    const customStyle = {
        ...parsedStyle,
        visibility: (isVisible ? "visible" : "hidden") as "visible" | "hidden"
    };

    const mergedClassName = cn(
        "ui-text-field",
        meta?.cssClass,
        externalClassName,
        isReadOnly && "is-readonly"
    );

    if (!isVisible && meta?.isVisible === false) return null;

    return (
        <div
            {...domProps} // 이제 showPassword 같은 값이 div에 들어가지 않음
            className={mergedClassName}
            style={customStyle}
        >
            {finalValue || "\u00A0"}
        </div>
    );
});

TextField.displayName = "TextField";
export default TextField;