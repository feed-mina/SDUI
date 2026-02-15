'use client';
import React, {useState} from 'react';

// [변경] 함수 이름 SelectField -> EmailSelectField
function EmailSelectField({id, style, className, meta, onChange}) {
    const [isDirect, setIsDirect] = useState(false);
    const options = ["naver.com", "gmail.com", "nate.com", "hanmail.net", "직접 입력"];

    return (
        <>
            <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                {meta.label_text || meta.labelText}
            </span>
            <select
                id={id}
                style={{...style, flex:1}}
                className={className}
                onChange={(e) => {
                    const val = e.target.value;
                    setIsDirect(val === "직접 입력");
                    // [중요] 선택된 값을 엔진으로 올려보냅니다.
                    onChange(id, val === "직접 입력" ? "" : val);
                }}
            >
                <option value="">이메일 선택</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {isDirect && (
                <input
                    type="text"
                    placeholder="도메인 입력"
                    // [중요] 직접 입력한 값도 엔진으로 올려보냅니다.
                    onChange={(e) => onChange(id, e.target.value)}
                />
            )}
        </>
    );
}

export default EmailSelectField;