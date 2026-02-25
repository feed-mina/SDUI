'use client';

import React, { memo } from 'react';
import { cn } from "@/components/utils/cn";

const ImageField = memo(({ meta, pageData, ...rest }: any) => {
    // 1. HTML 태그에 전달되면 안 되는 커스텀 속성들을 rest에서 분리합니다.
    const {
        onAction,
        pwType,
        showPassword,
        className: ignoredClassName, // rest에 포함된 className은 아래에서 mergedClassName으로 처리하므로 제외
        ...domSafeRest
    } = rest;

    // 2. 읽기 전용 여부 판단
    const isReadOnly = meta?.isReadonly === true || meta?.isReadonly === "true" ||
        meta?.is_readonly === true || meta?.is_readonly === "true";

    // 3. 이미지 경로 및 파일명 처리
    const label = meta?.label_text || meta?.labelText || "";
    const imagePath = label ? `/img/${label}` : "/img/default.png";

    // 4. 인라인 스타일 안전하게 파싱
    let customStyle = {};
    try {
        customStyle = typeof meta?.inlineStyle === 'string'
            ? JSON.parse(meta.inlineStyle)
            : (meta?.inlineStyle || {});
    } catch (e) {
        customStyle = {};
    }

    // 5. 클래스 병합
    const mergedClassName = cn(
        "ui-image-element",
        meta?.cssClass,
        meta?.css_class,
        rest.className,
        isReadOnly && "is-readonly"
    );

    return (
        <div style={{ ...customStyle, width: "100%", height: "auto" }} className="image-field-wrapper">
            <img
                {...domSafeRest} // 걸러진 안전한 속성들만 전달
                src={imagePath}
                className={mergedClassName}
                alt={meta?.altText || "ui-element"}
                style={{ width: "100%", height: "auto", display: "block" }}
            />
        </div>
    );
});

ImageField.displayName = "ImageField";
export default ImageField;