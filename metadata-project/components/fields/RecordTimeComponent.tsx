'use client';
import {memo, useCallback, useEffect, useState} from "react";
import {useQuery,useMutation, useQueryClient} from "@tanstack/react-query";
import axios from "@/api/axios";
import {useRecordTime} from "@/hooks/useRecordTime";
import {ArrivalButton} from "@/utils/ArrivalButton";
import {dateFormatter} from "@/utils/dateFormatter";

// 1. props 타입 정의 (data 안에 무엇이 들어있는지 명시)
// @@@@ 2026-02-04 추가 data 타입 optional
interface RecordTimeProps {
    data?: {
        user_id?: string;
        user_sqno?: string | number;
        [key: string]: any; // 다른 데이터가 더 들어올 수도 있음을 허용
    };
    onChange?: (value: any) => void;
}
// 부모 블록 전체 화면을 관리하는 곳
const RecordTimeComponent = ({ data, onChange }: RecordTimeProps) => {    console.log("  Record Time 컴포넌트가 받은 데이터:", data);
    const {formatGoalDate, formatTimePretty, formatDateOnly } = dateFormatter();
    const {
        goalTime,
        goalList,
        remainTimeText,
        handleLinkToSetup,
        handleArrival
    } = useRecordTime();
    const [isListOpen, setIsListOpen] = useState(false); // 팝업 열림/닫힘

    // 목표시간이 없을때 화면
if(!goalTime){
    return (
        <div className="no-goal-container" onClick={handleLinkToSetup} style={{cursor: 'pointer'}}>
            <p>오늘의 약속 시간은 언제인가요?</p>
            <button className="setup-button">시간 설정하기</button>
        </div>
    );
}

// 목표 시간이 있을때
    return (
        <div className="time-record-container">
            {/* 상단 정보 + 버튼 영역 */}
            <div className="clock-container">
                <div className="clock-display-box">
                    <span className="target-time-label">
                        목표: {formatGoalDate(goalTime)}
                    </span>
                    <div className="formatted-time">
                        {formatTimePretty(goalTime)}
                    </div>
                    <div className="remain-time">
                        {remainTimeText}
                    </div>
                </div>

                <div className="arrival-button-container">
                    <ArrivalButton onClick={handleArrival} />
                </div>
            </div>

            {/* 하단 영역: 여기 조건을 풀었습니다! */}
            <div className="more-list-section">
                <div className="bottom-btn-group">

                    {/* (1) 시간 추가 버튼 (항상 보임) */}
                    <button onClick={handleLinkToSetup} className="add-time-btn">
                        + 시간 추가
                    </button>
                    {/* 2. ... 버튼: 리스트가 있을 때만 보임 */}
                    {goalList && goalList.length > 0 && (
                        <button
                            className="more-list-button"
                            onClick={() => setIsListOpen(!isListOpen)}
                        >
                            •••
                        </button>
                    )}
                </div>

                {/* 3. 팝업 리스트: 열려있고 데이터가 있을 때만 보임 */}
                {isListOpen && goalList && goalList.length > 0 && (
                    <div className="goal-list-popup">
                        <ul className="goal-list-popup-ul">
                            {goalList.map((time: string, index: number) => (
                                <li className="goal-list-popup-li" key={index} style={{ padding: '5px 0', borderBottom: index < goalList.length - 1 ? '1px solid #eee' : 'none', fontSize: '14px', color: '#555' }}>
                                    <span>🗓️</span>
                                    <div className="goal-list-content">
                                        <span className="goal-list-popup-date">
                                            {formatGoalDate(time)}
                                        </span>
                                        <span className="goal-list-popup-time">
                                            {formatTimePretty(time)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RecordTimeComponent;