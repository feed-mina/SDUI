'use client';

import React, { memo } from "react";

// props의 타입을 정확하게 정의해주자. (object라고 퉁치면 안 돼)
interface InputFieldProps {
    id: string;
    meta: any;
    data: any;
    onChange: (id: string, value: any) => void;
    onAction?: (action: any) => void;
    showPassword?: boolean;
    pwType?: string; // rest에서 분리하기 위해 추가
    [key: string]: any;
}

const InputField = memo(({ id, meta, data, onChange, onAction, showPassword,pwType, ...rest }: InputFieldProps) => {
    // 1. 데이터를 매핑할 키 결정
    const targetKey = meta?.refDataId || meta?.ref_data_id || String(id || "");
    // 부모가 관리하는 formData와 서버 데이터를 합친 값이 직접 들어온다
    const value = data?.[targetKey] || "";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (onChange) {
            // 부모의 formData를 즉시 업데이트함
            onChange(targetKey, newValue);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onAction && meta?.actionType === "SUBMIT") {
            onAction({
                actionType: "SUBMIT",
                actionUrl: meta.actionUrl,
                componentId: meta.componentId
            });
        }
    };

    return (
        <div className="inputfield">
            {meta?.labelText && <label htmlFor={targetKey}>{meta.labelText}</label>}
            <input
                {...rest}
                id={targetKey}
                type={targetKey.toLowerCase().includes('pw') ? (showPassword ? 'text' : 'password') : 'text'}
                value={value} // 부모가 준 값을 직접 사용
                onChange={handleInputChange}
                onKeyDown={onKeyDown}
            />
        </div>
    );
});

InputField.displayName = "InputField";
export default InputField;