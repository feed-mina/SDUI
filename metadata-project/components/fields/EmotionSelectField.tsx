'use client';
import React from 'react';

function EmotionSelectField({ id, meta, data, onChange }: any) {
    const targetKey = meta?.ref_data_id || meta?.refDataId || id;
    // pageData에서 값을 가져옴 [cite: 2026-02-17]
    const value = (typeof data === 'string' || typeof data === 'number')
        ? data
        : (data?.[targetKey] || "");

    const isReadOnly = meta?.isReadonly === true || meta?.isReadonly === "true" ||
        meta?.is_readonly === true || meta?.is_readonly === "true";

    const emotionItems = [
        { text: "기분이 좋아요", value: "1" },
        { text: "너무 웃겨요", value: "2" },
        { text: "어떡해야 할까요", value: "3" },
        { text: "불쾌하고 지루해요", value: "4" },
        { text: "어떻게 이럴 수가", value: "5" },
        { text: "화가 나요", value: "6" },
        { text: "여기서 벗어나고 싶어요", value: "7" },
        { text: "사랑이 넘쳐요", value: "8" },
        { text: "몸 상태가 좋지 않아요", value: "9" },
        { text: "우울해요", value: "10" }
    ];

    return (
        <div className={meta?.css_class}>
            <span style={{ fontWeight: 'bold' }}>{meta?.labelText}</span>
            <select
                id={id}
                value={value}
                disabled={isReadOnly} // 읽기 전용일 때 선택 불가 [cite: 2026-02-17]
                onChange={(e) => !isReadOnly && onChange?.(targetKey, e.target.value)}
            >
                <option value="">오늘 나의 기분은?</option>
                {emotionItems.map(item => (
                    <option key={item.value} value={item.value}>{item.text}</option>
                ))}
            </select>
        </div>
    );
}

export default EmotionSelectField;