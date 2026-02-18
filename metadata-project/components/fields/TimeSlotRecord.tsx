import React from 'react';

// @@@@ 2026-02-17 시간대별 범용 기록 컴포넌트
const TimeSlotRecord: React.FC<any> = ({ id, meta, data, onChange }) => {
    // 1. DB의 JSONB(component_props)에서 테마 설정을 가져옴
    const {
        title = "하루 일과",
        description = "시간대별로 기록해보세요.",
        placeholders = { morning: "아침 기록", lunch: "점심 기록", evening: "저녁 기록" }
    } = meta.component_props || {};

    // 2. 현재 저장된 데이터 (없으면 빈 객체)
    const slotData = data || { morning: '', lunch: '', evening: '' };

    const handleInputChange = (slot: string, value: string) => {
        // 3. 불변성을 유지하며 부모의 formData 업데이트
        onChange(id, {
            ...slotData,
            [slot]: value
        });
    };

    if (meta.isVisible === "false") return null;

    const slots = [
        { key: 'morning', label: '아침' },
        { key: 'lunch', label: '점심' },
        { key: 'evening', label: '저녁' }
    ];

    return (
        <div className="time-slot-container border p-4 rounded-xl bg-white shadow-sm">
            <h3 className="font-bold text-lg text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500 mb-6">{description}</p>

            <div className="grid grid-cols-1 gap-4">
                {slots.map((slot) => (
                    <div key={slot.key} className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            {slot.label}
                        </label>
                        <input
                            type="text"
                            className="w-full border-b-2 border-gray-200 p-2 focus:border-purple-400 outline-none transition-colors"
                            value={slotData[slot.key] || ''}
                            onChange={(e) => handleInputChange(slot.key, e.target.value)}
                            placeholder={placeholders[slot.key]}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimeSlotRecord;