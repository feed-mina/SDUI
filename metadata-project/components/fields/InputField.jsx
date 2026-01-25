'use client';
// src/components/fields/InputField.js

import {useEffect, useState} from "react";

function InputField({ id,pwType, showPassword, label, className, readOnly, isRequired, onChange, onAction, meta , data}) {
    // 1. label이 있을 때만 <label> 태그를 보여줍니다.
    // 2. id는 COMPONENT_ID가 들어오며, 이는 데이터 저장 키가 됩니다.
    // 3. className에는 DB에서 넘어온 CSS_CLASS 값이 적용됩니다.
    // console.log('id', id);
     // 입력창 스스로 값을 관리하기 위해 상태(state)를 만든다. 초기값은 부모가 준 데이터(data[id])가 있으면 쓰고 없으면 빈 문자열이다.
    const [localValue, setLocalValue] = useState(data?.[id] || "");
    const customClass = meta?.cssClass || "";
    const customPlaceholder = meta?.placeholder || "";
    const serverValue = data?.[id];
    useEffect(() => {
        // 내 로컬 값과 서버 값이 다를 때만 업데이트 (타이핑 중 꼬임 방지)
        if (serverValue !== undefined && serverValue !== localValue) {
            setLocalValue(serverValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverValue]);
    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onChange(id, newValue);
    }
    // 20260117 enter 하면 작동
    const onKeyDown = (e) =>{
        if (e.key === 'Enter'){
            // 부모로부터 받은 handleAction을 직접 호출한다
            // SUBMIT 타입에 버튼을 강제로 클릭하게 만든다.
            // 1. 메타데이터에서 SUBMIT액션을 가진 항목을 찾는다.
            // 2. 찾은 항목의 actionUrl을 사용하여 공통액션 함수를 실행한다.
            if (onAction && meta?.actionType === "SUBMIT"){
                onAction({
                    actionType: "SUBMIT",
                    actionUrl: meta.actionUrl,
                    componentId: meta.componentId
                });

            }
        }
    }
// JSON의 inlineStyle은 문자열이므로 객체로 변환해서 사용해야 할 수도 있습니다.
    // 여기서는 부모가 주는 style 객체를 그대로 사용한다고 가정합니다.
 return (
        <>
            {/* label이 필요한 경우만 출력, 없으면 바로 input 출력 */}
            {/*{label && <label htmlFor={id} style={{ display: 'block', marginBottom: '5px' }}>{label}</label>}*/}
            <input
                type={id.includes('pw') ? (pwType || 'password') : 'text'}
                id={id}
                name={id}
                value={localValue}
                placeholder={customPlaceholder}
                readOnly={readOnly}
                required={isRequired}
                className={customClass}
                onChange={handleInputChange}
                onKeyDown={onKeyDown}
            />
        </>
    );
}

export default InputField;