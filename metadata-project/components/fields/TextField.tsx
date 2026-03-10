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

    // ref_data_id가 명시된 경우(리피터 컨텍스트) data 바인딩을 labelText보다 우선
    const explicitRef = meta?.ref_data_id || meta?.refDataId;
    const targetKey = explicitRef || meta?.componentId || "0218";

    let finalValue = value;
    if (!finalValue && data) {
        if (typeof data !== 'object') {
            finalValue = data;
        } else if (explicitRef && data[explicitRef] !== undefined && data[explicitRef] !== null) {
            finalValue = String(data[explicitRef]);
        }
    }
    if (!finalValue) {
        finalValue = meta?.labelText || (meta as any)?.label_text || "";
    }
    // componentId 기반 폴백 (ref_data_id 없을 때)
    if (!finalValue && !explicitRef && data && typeof data === 'object' && targetKey) {
        if (data[targetKey] !== undefined) finalValue = data[targetKey];
    }

    // {key} → data[key] 템플릿 치환
    if (finalValue && typeof finalValue === 'string' && data && typeof data === 'object') {
        finalValue = finalValue.replace(/\{([^}]+)\}/g, (match: string, key: string) =>
            data[key] !== undefined ? String(data[key]) : match
        );
    }
    // DB에서 오는 리터럴 \n → 실제 줄바꿈 변환
    if (typeof finalValue === 'string' && finalValue.includes('\\n')) {
        finalValue = finalValue.replace(/\\n/g, '\n');
    }

    let parsedStyle = {};
    try {
        if (meta?.inlineStyle) {
            parsedStyle = typeof meta.inlineStyle === 'string'
                ? JSON.parse(meta.inlineStyle)
                : meta.inlineStyle;
        }
    } catch (e) {
        // console.error(`[TextField] 스타일 파싱 에러:`, e);
    }

    const customStyle = {
        ...parsedStyle,
        whiteSpace: 'pre-line' as const,
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