import React, { useEffect, useRef, useState, useCallback } from 'react';
import '../../app/styles/DateTimePicker.css'; // 아까의 CSS 파일을 여기에 저장했다고 가정
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from 'react-datepicker';
import { useCalendar } from '../../hooks/useCalendar';


interface DateTimePickerProps {
    id : string // 부모가 넘겨주는 컴포넌트 ID (필수)
    onChange?: (id: string, value: string) => void; // 부모에게 변경된 시간을 알림
    data?: any; // 초기 데이터가 있다면 받음
    meta?: any;
}

const ITEM_HEIGHT = 50; // CSS에서 설정한 높이와 동일해야 함

const DateTimePicker = ({ id, onChange, data }:
                        DateTimePickerProps) => {
    // 1. 상태 관리 (현재 시간)
    // 초기값 설정 : data가 있으면 그 시간으로 없으면 현재시간
    const{
        date,
        isOpen,
        openCalendar,
        closeCalendar,
        handleDateChange,
        updateTime
    } = useCalendar(data ? new Date(data) : new Date());

    // 2. DOM 접근을 위한 Ref (getElementById 대신 사용)
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    // 00~23, 00~59 배열 생성
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    // 3. UI 동기화 함수 (데이터 -> 스크롤 위치 이동)
    const syncScrollToData = useCallback((targetDate: Date) => {
        if (hourRef.current && minuteRef.current) {
            const h = targetDate.getHours();
            const m = targetDate.getMinutes();
            // 초기 렌더링 시 스크롤이 튀지 않게 requestAnimationFrame 등을 사용할 수 있다.
            // 우선 간단히 타임아웃으로 처리해 바로 호출
            setTimeout(() => {
                if(hourRef.current) hourRef.current.scrollTo({ top: h * ITEM_HEIGHT, behavior: 'smooth' });
                if(minuteRef.current) minuteRef.current.scrollTo({ top: m * ITEM_HEIGHT, behavior: 'smooth' });
            }, 0)
        }
    }, []);

    // 초기 로딩 시 & 퀵 버튼 클릭 시 스크롤 위치 맞추기
    useEffect(() => {
        syncScrollToData(date);
        // 컴포넌트가 처음 마운트될때 초기값을 부모에게 한번 알려주는것이 안전할 수 있음, 필수값이 비어있다는 에러 방지용
        if(onChange && !data){
            onChange(id, date.toISOString());
        }
    }, []); // 빈 배열 마운트시 1회만 실행

    // 3. 값 변경 통보 함수 (핵심!!)
    const notifyChange = (newDate: Date) => {
        if(onChange) {
            // 수정 : id를 첫 번째 인자로, 값을 두번째 인자로 전달
            onChange(id, newDate.toISOString());
        };
    }

    // 4. 스크롤 핸들러 (스크롤 -> 데이터 업데이트)
    const handleScroll = (type: 'hour' | 'minute') => {
        // 스크롤 중에는 연산하지 않고, 멈췄을 때만 연산 (성능 최적화)
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            const ref = type === 'hour' ? hourRef.current : minuteRef.current;
            if (!ref) return;

            const scrollTop = ref.scrollTop;
            const value = Math.round(scrollTop / ITEM_HEIGHT); // 공식: 위치 / 높이 = 값

            const newDate = new Date(date); // 불변성 유지
            if (type === 'hour') {
                newDate.setHours(value);
            } else {
                newDate.setMinutes(value);
            }

            // 부모(DynamicEngine)에게 변경된 값 전달 (형식: YYYY-MM-DD HH:mm:ss)
            updateTime(newDate); // 훅에게 시간 바뀌었다고 알림

            notifyChange(newDate); // 수정된 통보 함수 사용

        }, 100); // 0.1초 동안 추가 스크롤 없으면 멈춘 것으로 간주
    };

    // 5. 퀵 버튼 기능
    const addMinutes = (mins: number) => {
        const newDate = new Date(date);
        newDate.setMinutes(newDate.getMinutes() + mins);
        updateTime(newDate);    // 1. 내부 상태 업데이트
        syncScrollToData(newDate); // 2. 휠 위치 이동
        notifyChange(newDate);  // 3. 부모(백엔드 전송용) 업데이트
    };

    return (
        <div className="time-picker-container">
            <div className="picker-display">
                {/* 시 (Hour) */}
                <div className="wheel-wrapper" ref={hourRef} onScroll={() => handleScroll('hour')}>
                    {/*<div className="spacer"></div>*/}
                    {hours.map((h) => (
                        <div key={`h-${h}`} className="wheel-item">
                            {h.toString().padStart(2, '0')}
                        </div>
                    ))}
                    {/*<div className="spacer"></div>*/}
                </div>
                <span className="colon">:</span>

                {/* 분 (Minute) */}
                <div className="wheel-wrapper" ref={minuteRef} onScroll={() => handleScroll('minute')}>
                    <div className="spacer"></div>
                    {minutes.map((m) => (
                        <div key={`m-${m}`} className="wheel-item">
                            {m.toString().padStart(2, '0')}
                        </div>
                    ))}
                    <div className="spacer"></div>
                </div>
            </div>

            {/* 퀵 버튼들 */}
            <div className="quick-buttons">
                <button type="button" onClick={() => addMinutes(10)}>+10분</button>
                <button type="button" onClick={() => addMinutes(30)}>+30분</button>
                <button type="button" onClick={() => addMinutes(60)}>+1시간</button>
            </div>

            {/* 현재 설정된 시간 확인용 (개발 중에만 표시하거나 디자인에 맞게 수정) */}
            <p className="debug-text">
                설정 시간: {date.getHours()}시 {date.getMinutes()}분
            </p>

            {/* 달력 아이콘 버튼 */}
            <button onClick={openCalendar}>📅 날짜 변경</button>
            <p>{date.toLocaleDateString()}</p>

            {/* 달력 모달 조건부 렌더링 */}
            {isOpen && (
                <div className="calendar-modal-overlay">
                    <div className="calendar-modal">
                        <DatePicker
                            selected={date}
                            onChange={handleDateChange}
                            inline // 달력을 펼쳐진 상태로 보여줌
                        />
                        <button onClick={closeCalendar}>닫기</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DateTimePicker;