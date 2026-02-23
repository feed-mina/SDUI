'use client';

import React, { useState } from 'react';

interface SelectFieldProps {
    id: string;
    meta: any;
    data: any;
    onChange: (id: string, value: string) => void;
}

function SelectField({ id, meta, data, onChange }: SelectFieldProps) {
    const [isDirect, setIsDirect] = useState(false);
    const options = ["naver.com", "gmail.com", "nate.com", "hanmail.net", "직접 입력"];

    const targetKey = meta.ref_data_id || meta.refDataId;
    const value = (typeof data === 'string') ? data : (data?.[targetKey] || "");

    const isReadOnly = meta.isReadonly === true || meta.isReadonly === "true" ||
        meta.is_readonly === true || meta.is_readonly === "true";

    return (
        <div className={meta.css_class}>
            {meta.labelText && <span className="select-label">{meta.labelText}</span>}
            <select
                id={id}
                value={isDirect ? "직접 입력" : value}
                disabled={isReadOnly} // 읽기 전용일 때 선택 불가
                onChange={(e) => {
                    const val = e.target.value;
                    setIsDirect(val === "직접 입력");
                    onChange(targetKey, val === "직접 입력" ? "" : val);
                }}>
                <option value="">이메일 선택</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {isDirect && !isReadOnly && (
                <input
                    type="text"
                    value={value}
                    placeholder="도메인 입력"
                    onChange={(e) => onChange(targetKey, e.target.value)}
                />
            )}
        </div>
    );
}

export default SelectField;