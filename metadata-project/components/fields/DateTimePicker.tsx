import React, { useEffect, useRef, useState, useCallback } from 'react';
import '../../app/styles/DateTimePicker.css';
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from 'react-datepicker';
import { useCalendar } from '../../hooks/useCalendar';

interface DateTimePickerProps {
    id: string;
    onChange?: (id: string, value: string) => void;
    data?: any;
    meta?: any;
}

const ITEM_HEIGHT = 50;

const DateTimePicker = ({ id, onChange, data }: DateTimePickerProps) => {
    // 1. 상태 관리
    const {
        date,
        isOpen,
        openCalendar,
        closeCalendar,
        handleDateChange,
        updateTime
    } = useCalendar(data ? new Date(data) : new Date());

    // 2. Refs
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialized = useRef(false);

    // 2-1. 키보드 입력 모드 상태
    const [isInputMode, setIsInputMode] = useState(false);
    const [inputValues, setInputValues] = useState({ hour: '00', minute: '00' });

    // Constants
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    // 3. UI 동기화 함수
    const syncScrollToData = useCallback((targetDate: Date) => {
        if (hourRef.current && minuteRef.current) {
            const h = targetDate.getHours();
            const m = targetDate.getMinutes();
            setTimeout(() => {
                if (hourRef.current) hourRef.current.scrollTo({ top: h * ITEM_HEIGHT, behavior: 'smooth' });
                if (minuteRef.current) minuteRef.current.scrollTo({ top: m * ITEM_HEIGHT, behavior: 'smooth' });
            }, 50);
        }
    }, []);

    // 4. 초기화 useEffect (가드 패턴 적용)
    useEffect(() => {
        if (isInitialized.current) return;

        syncScrollToData(date);
        if (onChange && !data) {
            onChange(id, date.toISOString());
        }
        isInitialized.current = true;
    }, [date, onChange, id, data, syncScrollToData]);

    // 5. 공통 변경 알림 함수
    const notifyChange = (newDate: Date) => {
        if (onChange) {
            onChange(id, newDate.toISOString());
        };
    }

    // 6. 스크롤 핸들러
    const handleScroll = (type: 'hour' | 'minute') => {
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            const ref = type === 'hour' ? hourRef.current : minuteRef.current;
            if (!ref) return;

            const scrollTop = ref.scrollTop;
            const value = Math.round(scrollTop / ITEM_HEIGHT);

            ref.scrollTo({ top: value * ITEM_HEIGHT, behavior: 'smooth' });

            const newDate = new Date(date);
            if (type === 'hour') {
                newDate.setHours(value);
            } else {
                newDate.setMinutes(value);
            }

            updateTime(newDate);
            notifyChange(newDate);
        }, 150);
    };

    // 7. 클릭 시 입력 모드 전환
    const handleWheelClick = () => {
        setInputValues({
            hour: date.getHours().toString().padStart(2, '0'),
            minute: date.getMinutes().toString().padStart(2, '0')
        });
        setIsInputMode(true);
    };

    // 8. [수정됨] 입력 값 변경 핸들러 (type 인자 추가)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'hour' | 'minute') => {
        const val = e.target.value;
        if (!/^\d{0,2}$/.test(val)) return;

        setInputValues(prev => ({
            ...prev,
            [type]: val // computed property name 사용
        }));
    };

    // 9. [밖으로 탈출 성공] 입력 확정 핸들러
    const handleInputConfirm = () => {
        let h = parseInt(inputValues.hour || '0', 10);
        let m = parseInt(inputValues.minute || '0', 10);

        if (isNaN(h)) h = 0;
        if (isNaN(m)) m = 0;
        h = Math.min(23, Math.max(0, h));
        m = Math.min(59, Math.max(0, m));

        const newDate = new Date(date);
        newDate.setHours(h);
        newDate.setMinutes(m);

        updateTime(newDate);
        notifyChange(newDate);
        syncScrollToData(newDate);
        setIsInputMode(false);
    };

    // 10. [밖으로 탈출 성공] 엔터키 핸들러
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleInputConfirm();
    };

    // 11. [밖으로 탈출 성공] 퀵 버튼 핸들러
    const addMinutes = (mins: number) => {
        const newDate = new Date(date);
        newDate.setMinutes(newDate.getMinutes() + mins);
        updateTime(newDate);
        syncScrollToData(newDate);
        notifyChange(newDate);
    };

    // 12. 캘린더 핸들러
    const handleCalendarSelect = (newDateFromCalendar: Date | null) => {
        if (!newDateFromCalendar) return;

        handleDateChange(newDateFromCalendar);

        const updateDate = new Date(newDateFromCalendar);
        updateDate.setHours(date.getHours());
        updateDate.setMinutes(date.getMinutes());
        notifyChange(updateDate);
    };

    return (
        <div className="time-picker-container">
            <div className="picker-display" onClick={!isInputMode ? handleWheelClick : undefined}>
                {isInputMode ? (
                    <div className="input-mode-wrapper">
                        <input
                            type="text"
                            value={inputValues.hour}
                            // [수정됨] 두 번째 인자로 'hour' 전달
                            onChange={(e) => handleInputChange(e, 'hour')}
                            onBlur={handleInputConfirm}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="time-input"
                        />
                        <span className="colon">:</span>
                        <input
                            type="text"
                            value={inputValues.minute}
                            // [수정됨] 두 번째 인자로 'minute' 전달
                            onChange={(e) => handleInputChange(e, 'minute')}
                            onBlur={handleInputConfirm}
                            onKeyDown={handleKeyDown}
                            className="time-input"
                        />
                    </div>
                ) : (
                    <>
                        <div className="wheel-wrapper" ref={hourRef} onScroll={() => handleScroll('hour')}>
                            {hours.map((h) => (
                                <div key={`h-${h}`} className="wheel-item">
                                    {h.toString().padStart(2, '0')}
                                </div>
                            ))}
                        </div>
                        <span className="colon">:</span>
                        <div className="wheel-wrapper" ref={minuteRef} onScroll={() => handleScroll('minute')}>
                            {minutes.map((m) => (
                                <div key={`m-${m}`} className="wheel-item">
                                    {m.toString().padStart(2, '0')}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="quick-buttons">
                <button type="button" onClick={() => addMinutes(10)}>+10분</button>
                <button type="button" onClick={() => addMinutes(30)}>+30분</button>
                <button type="button" onClick={() => addMinutes(60)}>+1시간</button>
            </div>

            <p className="debug-text" style={{marginTop:'10px', color:'#666'}}>
                설정 시간: {date.getHours()}시 {date.getMinutes()}분
            </p>

            <div className="date-change-area">
                <button className="date-change-btn" onClick={openCalendar}>
                    📅 날짜 변경
                </button>
                <p className="current-date-text">{date.toLocaleDateString()}</p>
            </div>

            {isOpen && (
                <div className="calendar-modal-overlay">
                    <div className="calendar-modal">
                        <DatePicker
                            selected={date}
                            onChange={handleCalendarSelect}
                            inline
                        />
                        <button onClick={closeCalendar}>닫기</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateTimePicker;