'use client';

import {useEffect, useState} from "react";

// 필요한 props(meta, data, onChange, onAction)를 명시적으로 추가한다
function InputField({ id, meta, data, onChange, onAction, pwType,showPassword, ...rest}) {
    const safeId = String(id || "");

    // 초기값은 data 객체 안에서 내 id(safeId)에 해당하는 값을 찾아온다
    const [localValue, setLocalValue] = useState(data?.[safeId] || "");
    const isPasswordVisible = showPassword;

    useEffect(() => {
        // 서버에서 데이터가 뒤늦게 들어오거나 부모 데이터가 바뀌었을 때를 위한 동기화 로직
        const serverValue = data?.[safeId] || "";
        if (serverValue !== localValue) {
            setLocalValue(serverValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, safeId]);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        // 부모에게 값이 바뀌었다고 알려준다
        if (onChange) {
            onChange(safeId, newValue);
        }
    }

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
            {meta?.labelText && <label htmlFor={safeId}>{meta.labelText}</label>}
            <input
                {...rest}
                id={safeId}
                // id에 'pw'가 포함되어 있으면 password 타입으로 강제한다
                type={safeId.includes('pw') ? (isPasswordVisible ? 'text' : 'password') : 'text'}
                value={localValue}
                onChange={handleInputChange}
                onKeyDown={onKeyDown}
            />
        </div>
    );
}

export default InputField;