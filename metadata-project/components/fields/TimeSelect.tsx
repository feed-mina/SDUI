// TimeSelect.tsx 내부 수정 제안
import React, {useState} from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';

interface TimeItem {
    hour: number;
    available: boolean;
}

interface TimeSelectProps {
    value: number[];
    onChange: (selected: number[]) => void;
}

const TimeSelect: React.FC<any> = ({ id, meta, data, onChange }) => {
    // data는 useDynamicEngine에서 ref_data_id를 통해 매핑된 selected_times 배열일 것임

    // data가 배열인지 확인하고, 아니면 무조건 빈 배열로 초기화한다.
    const initialData = Array.isArray(data) ? data : [];
    const [selectedTimes, setSelectedTimes] = React.useState<number[]>(initialData);


//  DB의 JSONB 컬럼에서 설정값 가져오기 (기본값 설정)
    const { startHour = 0, endHour = 24, slidesPerView = 5 } = meta?.component_props || {};
    // 1. data가 있으면 초기값으로 사용, 없으면 빈 배열


    // 24시간 리스트 생성 설정에 따른 시간 리스트 동적 생성
    const timeList = Array.from({ length: endHour - startHour + 1 }, (_, i) => ({
        hour: startHour + i,
        available: true,
    }));

    // 컴포넌트가 처음 로드될 때나 data가 바뀔 때 상태 동기화
    React.useEffect(() => {
        if (Array.isArray(data)) {
            setSelectedTimes(data);
        }
    }, [data]);

    const toggleTime = (hour: number) => {
        const newSelected = selectedTimes.includes(hour)
            ? selectedTimes.filter((t: number) => t !== hour)
            : [...selectedTimes, hour].sort((a, b) => a - b);

        setSelectedTimes(newSelected);

        // 2. 엔진의 공통 변경 함수 호출 (id와 변경된 값을 전달)
        // 이 호출을 통해 usePageActions의 formData에 데이터가 저장됨
        onChange(id, newSelected);
    };


    return (
        <div className="time-select-container relative py-6 px-4 bg-gray-50 rounded-2xl">
            <h3 className="text-sm font-bold text-gray-400 mb-4 ml-2 uppercase tracking-wider">
                {meta.label_text}
            </h3>
            <div className="relative group px-10">
                <Swiper
                    modules={[Navigation]}
                    navigation={{
                        nextEl: '.swiper-btn-next',
                        prevEl: '.swiper-btn-prev',
                    }}
                    slidesPerView={slidesPerView}
                    spaceBetween={10}
                    className="w-full"
                >
                    {timeList.map((item) => (
                        <SwiperSlide key={item.hour}>
                            <button
                                onClick={() => toggleTime(item.hour)}
                                className={`w-full aspect-square rounded-full flex items-center justify-center text-sm font-semibold transition-all shadow-sm
                            ${selectedTimes.includes(item.hour)
                                    ? 'bg-indigo-600 text-white scale-110 shadow-indigo-200'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                            >
                                {item.hour}
                            </button>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
            <div className="mt-4 flex gap-4 text-sm">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-100 border"></div> wake</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 border"></div> sleep</span>
            </div>
        </div>
    );
};
export default TimeSelect;