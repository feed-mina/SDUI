'use client';

import React, { useEffect, useState, memo } from "react";

// memo()로 감싸서 props가 변하지 않으면 리렌더링을 막는다
const InputField = memo(({ id, meta, data, onChange, onAction, showPassword, ...rest }) => {
    const targetKey = meta?.refDataId || meta?.ref_data_id || String(id || "");
    const [localValue, setLocalValue] = useState(data?.[targetKey] || "");

    useEffect(() => {
        // 부모로부터 오는 데이터가 확실히 업데이트된 데이터(combinedData)라면 여기서 동기화가 일어남
        const serverValue = data?.[targetKey] || "";
        if (serverValue !== localValue) {
            setLocalValue(serverValue);
        }
    }, [data, targetKey]); // localValue는 의존성에서 빼야 무한 루프 안 생겨

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        if (onChange) {
            onChange(targetKey, newValue);
        }
    };


    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            // 메타데이터에 정의된 액션 타입이 SUBMIT일 경우에만 동작한다
            if (onAction && meta?.actionType === "SUBMIT") {
                onAction({
                    actionType: "SUBMIT",
                    actionUrl: meta.actionUrl,
                    componentId: meta.componentId
                });
            }
        }
    }
    return (
        <div className="inputfield">
            {meta?.labelText && <label htmlFor={targetKey}>{meta.labelText}</label>}
            <input
                {...rest}
                id={targetKey}
                type={targetKey.includes('pw') ? (showPassword ? 'text' : 'password') : 'text'}
                value={localValue}
                onChange={handleInputChange}
            />
        </div>
    );
});

InputField.displayName = "InputField";
export default InputField;