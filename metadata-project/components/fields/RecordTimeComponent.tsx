import {memo, useCallback, useEffect, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import axios from "@/api/axios";

interface ButtonProps {
    onClick: () => void;
}
const ArrivalButton = memo(({ onClick }: ButtonProps) => {
    console.log("버튼은 안 움직이고 가만히 있는다");
    return (
        <button className="arrival-button" onClick={onClick}>
            도착 완료
        </button>
    );
});
ArrivalButton.displayName = "ArrivalButton";

// 부모 블록 전체 화면을 관리하는 곳
const RecordTimeComponent = () => {
    const [remainTime, setRemainTime] = useState("");

    // 리액트 쿼리 목표 시간을 딱 한번만 적기
    const {data: goalTime} = useQuery({
        queryKey: ['goalTime'],
        queryFn: async() => {
            const res = await axios.get('/api/goalTime');
            return res.data.targetTime; // 예: "2026-01-26 10:00:00"
        },
        staleTime: Infinity //  목표는 잘 안바뀌니까 계속 기억하기
    });

    // [유즈콜백] 버튼이 할 일(설명서) 하나로 고정하기
    const handleArrival = useCallback(() => {
        alert("도착 기록을 서버로 보낸다");
    }, []);

    useEffect(() => {
        if (!goalTime) return;
        const timer = setInterval(() => {
            const now = new Date();
            const target = new Date(goalTime);
            target.setMinutes(target.getMinutes() - 10); // 10분 전 여유시간 기준

            const diff = target.getTime() - now.getTime();
            if(diff <= 0){
                setRemainTime("여유시간 종료!");
            } else{
                const min = Math.floor(diff / 60000);
                setRemainTime(`${min}분 남음`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [goalTime]);
if(!goalTime){
    return (
        <div className="no-goal-container" onClick={() => window.location.href='/SET_TIME_PAGE'}>
            <p>오늘의 약속 시간은 언제인가요?</p>
            <button className="setup-button">시간 설정하기</button>
        </div>
    );
}
    return (
        <div className="time-record-container">
            <div className="clock-display-box">
                <span className="target-time-label"> 목표: {goalTime} (10분 전 기준)</span>
                <h2 className="remain-time">{remainTime}</h2>
            </div>
            {/*메모된 버튼 사용하기*/}
            <ArrivalButton onClick={handleArrival} />
        </div>
    )
}

export default RecordTimeComponent;