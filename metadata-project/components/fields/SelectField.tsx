'use client';
import React, { useState } from 'react';

interface SelectFieldProps {
    id: string;
    label?: string;
    style?: React.CSSProperties;
    className?: string;
    meta: {
        labelText?: string;
    };
    onChange: (id: string, value: string) => void;
}

function SelectField({ id, label, style, className, meta, onChange }: SelectFieldProps) {
    const [isDirect, setIsDirect] = useState(false);
    const options = ["naver.com", "gmail.com", "nate.com", "hanmail.net", "직접 입력"];

    return (
        <>
            <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                {meta.labelText}
            </span>
            <select
                id={id}
                className={className}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const val = e.target.value;
                    setIsDirect(val === "직접 입력");
                    onChange(id, val === "직접 입력" ? "" : val);
                }}>
                <option value="">이메일 선택</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {isDirect && (
                <input
                    id={id}
                    className={className}
                    type="text"
                    placeholder="도메인 입력"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(id, e.target.value)}
                />
            )}
        </>
    );
}

export default SelectField;