// src/components/fields/SelectField.js
import React, { useState } from 'react';

function SelectField({id, label, style, className, meta, onChange}) {
    const [isDirect, setIsDirect] = useState(false); // 직접 입력 모드인지 확인
    const options = ["naver.com", "gmail.com", "nate.com", "hanmail.net", "직접 입력"];


    const handleSelectChange = (e) => {
        const val = e.target.value;
        if (val === "직접 입력") {
            setIsDirect(true);
            onChange(id, ""); // 일단 비워둠
        } else {
            setIsDirect(false);
            onChange(id, val); // 선택한 도메인 전달
        }
    };

    const handleInputChange = (e) => {
        onChange(id, e.target.value); // 직접 입력한 도메인 전달
    };

    return (
        <>
            <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{meta.labelText}</span>
            <select
                id={id}
                style={{...style, flex:1}}
                className={className}
                onChange={(e) => {
                const val = e.target.value;
                setIsDirect(val === "직접 입력");
                onChange(id, val === "직접 입력" ? "" : val);
            }}>
                <option value="">이메일 선택</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {isDirect && (
                <input
                    type="text"
                    placeholder="도메인 입력"
                    onChange={(e) => onChange(id, e.target.value)}
                />
            )}
        </>
    );
}

export default SelectField;