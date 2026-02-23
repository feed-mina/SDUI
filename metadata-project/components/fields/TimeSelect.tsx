// TimeSelect.tsx 내부 수정 제안
import React, { useState, useEffect, memo } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import '../../app/styles/TimeSelect.css'
import 'swiper/css';
import 'swiper/css/navigation';
import {useRenderCount} from "@/hooks/useRenderCount";

interface TimeItem {
    hour: number;
    available: boolean;
}

interface TimeSelectProps {
    value: number[];
    onChange: (selected: number[]) => void;
}
const TimeSelect: React.FC<any> = ({ id, meta, data, onChange }) => {
    useRenderCount("TimeSelect (Child)"); // @@@@ 렌더링 횟수 추적 추가
    const updateKey = meta.ref_data_id || meta.refDataId || id;

    // data는 useDynamicEngine에서 ref_data_id를 통해 매핑된 selected_times 배열일 것임

    // // console.log('TimeSelectmeta', meta);
    // data가 배열인지 확인하고, 아니면 무조건 빈 배열로 초기화한다.
    // 초기값 설정 로직 강화
    const getInitialData = () => {
        if (Array.isArray(data)) return data;
        if (data && data[updateKey] && Array.isArray(data[updateKey])) return data[updateKey];
        if (data && data.selected_times && Array.isArray(data.selected_times)) return data.selected_times;
        return [];
    };

    const initialData = Array.isArray(data) ? data : [];

    const [selectedTimes, setSelectedTimes] = React.useState<number[]>([]);

    const {
        startHour = 0,
        endHour = 24,
        slidesPerView = 5,
        legendActive = "sleep", // 기본값
        legendDefault = "wake"   // 기본값
    } = meta?.component_props || {};

    const timeList = Array.from({ length: endHour - startHour + 1 }, (_, i) => ({
        hour: startHour + i,
        available: true,
    }));

    React.useEffect(() => {
        if (!data) return;

        let targetArray: any[] = [];
        // 1. data 자체가 배열인 경우 (엔진이 필터링해서 준 경우)

        if (Array.isArray(data)) {
            // 1. data 자체가 배열로 온 경우
            targetArray = data;
        } else if (typeof data === 'object') {
            // 2. data 객체 내부에서 updateKey(예: selected_times)를 찾음
            if (Array.isArray(data[updateKey])) {
                targetArray = data[updateKey];
            }
            // 3. (보험) 강제로 selected_times 필드를 확인
            else if (Array.isArray(data.selected_times)) {
                targetArray = data.selected_times;
            }
        }

        if (targetArray.length >= 0) {
            setSelectedTimes(targetArray.map((t: any) => Number(t)));
        }
    }, [data, updateKey]);

//  메타데이터에서 실제 바인딩 키를 추출한다.

    const toggleTime = (hour: number) => {
        // 읽기 전용이면 상태 변경 차단
        if (isReadOnly) return;
        const newSelected = selectedTimes.includes(hour)
            ? selectedTimes.filter((t: number) => t !== hour)
            : [...selectedTimes, hour].sort((a, b) => a - b);
        setSelectedTimes(newSelected);

        //  부모로 전송할 때 id 대신 updateKey를 사용한다.
        onChange(updateKey, newSelected);
    };
    const isReadOnly = meta.isReadonly === true || meta.isReadonly === "true" ||
        meta.is_readonly === true || meta.is_readonly === "true";
    return (
        <div className="time-select-wrapper">
            <h3 className="time-select-title">{meta.label_text}</h3>

            <div className="swiper-container-wrapper">
                <Swiper
                    modules={[Navigation]}
                    navigation={{ nextEl: '.next', prevEl: '.prev' }}
                    slidesPerView={slidesPerView}
                    slidesPerGroup={3}
                    spaceBetween={10}
                >
                    {timeList.map((item) => {
                        // console.log('timeList.map-item', item);
                        const isActive = selectedTimes.includes(item.hour);
                        return (
                            <SwiperSlide key={item.hour}>
                                <button
                                    type="button"
                                    onClick={() => toggleTime(item.hour)}
                                    className={`time-button ${isActive ? 'active' : 'default'} ${isReadOnly ? 'readonly' : ''}`}
                                >
                                    {item.hour}
                                </button>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>

                <div className="swiper-nav-btn prev">〈</div>
                <div className="swiper-nav-btn next">〉</div>
            </div>

            {/*  동적 범례(Legend) 렌더링 영역 */}
            <div className="time-select-legend">
                {/* 비활성 상태(Default) 라벨 */}
                <span className="legend-item">
                    <div className="color-box default-bg" /> {legendDefault}
                </span>
                {/* 활성 상태(Active) 라벨 */}
                <span className="legend-item">
                    <div className="color-box active-bg" /> {legendActive}
                </span>
            </div>
        </div>
    );
};

export default memo(TimeSelect);