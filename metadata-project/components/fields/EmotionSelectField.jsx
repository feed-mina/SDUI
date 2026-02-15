'use client';
// src/components/fields/EmotionSelectField.js
import React from 'react';

function EmotionSelectField({id, style, className, meta, onChange}) {

    const emotionItems = [
        // { text: '오늘 감정은 어떤가요?',value: ''},
        { text: "😁 기분이 좋아요", value: "1" },
        { text: "😂 너무 웃겨요", value: "2" },
        { text: "😫 어떡해야 할까요?!", value: "3" },
        { text: "😒 불쾌하고 지루해요", value: "4" },
        { text: "😤 어떻게 이럴 수가", value: "5" },
        { text: "😡 화가 나요", value: "6" },
        { text: "🤯 여기서 벗어나고 싶어요...", value: "7" },
        { text: "💖 사랑이 넘쳐요", value: "8" },
        { text: "🤕 몸 상태가 좋지 않아요", value: "9" },
        { text: "💙 우울해요", value: "10" }
    ];

    return (
        <>
            {/*<span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{meta.labelText}</span>*/}
            <select
                id={id}
                style={{...style, flex:1}}
                className={className}
                onChange={(e) => {
                    const val = e.target.value;
                    if (onChange) onChange(id, val);
                }}
                >
                <option value=""> 오늘 나의 기분은?</option>
                {emotionItems.map(emotionItems => <option key={emotionItems.value} value={emotionItems.value}>{emotionItems.text}</option>)}
            </select>

        </>
    );
}

export default EmotionSelectField;