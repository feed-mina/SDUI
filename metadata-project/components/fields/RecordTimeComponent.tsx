'use client';
import {memo, useCallback, useEffect, useState} from "react";
import {useQuery,useMutation, useQueryClient} from "@tanstack/react-query";
import axios from "@/api/axios";

// [유틸] 목표 날짜 포맷 (MM-DD HH:MM 요일) - 요청하신 포맷!
const formatGoalDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    // 목표시간 보다 10분 일찍 보인다
    date.setMinutes(date.getMinutes() - 10);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayName = dayNames[date.getDay()];

    return `${month}-${day} ${hours}:${minutes} ${dayName}`;
};

// [유틸] time포맷함수 (오전/오후 HH:MM)
const formatTimePretty = (dateStr : string) => {
    if(!dateStr) return "";
    const date = new Date(dateStr);
    date.setMinutes(date.getMinutes() - 10);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${ampm} ${displayHours}:${displayMinutes}`;
};
// [유틸] 날짜만 보여주는함수 (YYYY-MM-DD)
const formatDateOnly = (dateStr: string) =>{
    if(!dateStr) return "";
    return dateStr.split("T")[0];
}
interface ButtonProps {
    onClick: () => void;
}

const ArrivalButton = memo(({ onClick }: ButtonProps) => {
    // console.log("버튼은 안 움직이고 가만히 있는다");
    return (
        <button className="arrival-button" onClick={onClick}>
            도착 완료
        </button>
    );
});
ArrivalButton.displayName = "ArrivalButton";

// 부모 블록 전체 화면을 관리하는 곳
const RecordTimeComponent = () => {
    const [remainTimeText, setRemainTimeText] = useState("");
    const [isListOpen, setIsListOpen] = useState(false); // 팝업 열림/닫힘

    // 리액트 쿼리 클라이언트 (데이터 갱신용)
    const queryClient = useQueryClient();
    // --- 쿠키 및 로그인 로직 (기존 코드 유지) ---
    const getCookie = (name:string) => {
        if (typeof document === "undefined") return null; // 서버 사이드 에러 방지
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const isLoggedIn = !!getCookie("accessToken");

    // 페이지 이동 핸들러
    const handleLinkToSetup = () => {
        if (!isLoggedIn){
            alert('로그인이 필요한 서비스입니다. ')
        } else{
            // 로그인 이후에
            window.location.href='/view/SET_TIME_PAGE';
        }
    }

     // 리액트 쿼리 : 목표 시간 가져오기
    const {data: goalTime} = useQuery({
        queryKey: ['goalTime'],
        queryFn: async() => {
            const res = await axios.get('/api/goalTime/getGoalTime');
            return res.data.goalTime ?? null; // 예: "2026-01-26 10:00:00"
        },
        // 2, 로그인 상태일 때만 서버에 요청을 보낸다.
        enabled: isLoggedIn,
        staleTime: Infinity //  목표는 잘 안바뀌니까 계속 기억하기
    });
    // [리스트] 추가 목표 리스트 가져오기(3개)
    const {data : goalList} = useQuery({
        queryKey: ['goalList'],
        queryFn: async() => {
            const res = await axios.get('/api/goalTime/getGoalList');
            return res.data ?? [];
        },
        enabled: isLoggedIn,
        staleTime: Infinity
    });

    // [도착처리] 서버로 결과 전송
    const arrivalMutation = useMutation({
        mutationFn: async(status: string) => {
            return await axios.post('/api/goalTime/arrival', {
                status: status, // safe, success, fail
                recordedTime : new Date() // 현재 시간
            });
        },
        onSuccess: (data, variables) => {
            alert(`도착 처리가 완료되었습니다. 결과 : ${variables.toUpperCase()}`);
            // 처리가 끝나면 목표 데이터를 다시 불러와서 화면 갱신
            queryClient.invalidateQueries({queryKey: ['goalTime']});
            queryClient.invalidateQueries({queryKey: ['goalList']});
        },
        onError: (error) => {
            console.error(error);
            alert("서버 전송 중 오류가 발생했습니다.");
        }
    });
    // [도착버튼 핸들러] 도착 버튼 클릭시 상태 계산 (safe, success, fail)
    const handleArrival = useCallback(() => {
        if(!goalTime) return;
        const now = new Date();
        const target = new Date(goalTime);
        const diffMs = target.getTime() - now.getTime();
        const diffMin = diffMs / (1000 * 60); // 분 단위 차이

        let status = "fail";

        if (diffMin < 0){
            // 목표 시간 지남 -> 지각 (fail)
            status = "fail";
        } else if (diffMin <= 10){
            // 10분 전 ~ 목표시간 사이 -> 간신히 성공 (safe)
            status = "safe";
        } else{
            // 10분보다 더 많이 남음 -> 여유있게 성공 (success)
            status = "success";
        }
        if(confirm(`현재 상태 ${status.toUpperCase()}\n도착 기록을 보내시겠습니까?`)){
            arrivalMutation.mutate(status);
        }
    }, [goalTime, arrivalMutation]);


    // [타이머] 남은 시간 계산
    useEffect(() => {
        if (!goalTime) return;
        // 목표 시간 파싱 로직 보완
        const targetDate = new Date(goalTime);
        const timer = setInterval(() => {
            const now = new Date();
            const target = new Date(goalTime);
            // 보여줄 때는 10분 전 기준이 아니라 실제 목표 시간까지 얼마나 남았는지 보여주는 게 일반적이라
            // 여기서는 목표시간 까지 남은 시간까지 남은 시간을 계산한다
            // 10분 전 여유시간 기준 계산
            const targetWithMargin = new Date(targetDate.getTime() - 10 * 60000);

            const diff = targetWithMargin.getTime() - now.getTime();// 1. 전체 남은 분(Total Minutes) 계산
            const totalMinutes = Math.floor(diff / (1000 * 60));

            // 2. 시간(Hour)과 분(Minute)으로 분리
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            if(diff <= 0){
                setRemainTimeText("지각입니다 ㅠㅠ");
            } else{
                const min = Math.floor(diff / 60000);
                // 3. 화면 표시 포맷 (0시간일 때는 분만, 아니면 '0시간 0분' 형태)
                if (hours > 0) {
                    setRemainTimeText(`${hours}시간 ${minutes}분 남음`);
                } else {
                    setRemainTimeText(`${minutes}분 남음`);
                }
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [goalTime]);

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