import {useRouter} from "next/navigation";
import axios from "@/services/axios";
import {useCallback, useEffect, useRef, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";


// @@@@ 2026-02-07 주석 추가
// usePageActions 역할 : 사용자의 입력 (formData)와  클릭 이벤트 (handleAction)를 처리하는 훅
// 인자 타입을 (meta, data) 두 개로 변경하는 것이 핵심입니다.
export const usePageActions = (metadata: any[]) => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [formData, setFormData] = useState<any>({});
    const [showPassword, setShowPassword] = useState(false);
    const [pwType, setPwType] = useState("password");

    const formDataRef = useRef(formData);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);


    // useCallback으로 감싸서 함수가 새로 생성되는 것을 방지
    const handleChange = useCallback((id: string, value: any) => {
        setFormData((prev: any) => ({...prev, [id]: value}));
    }, []); // 의존성 배열 비움

    //  item(메타)과 data(실제 데이터)를 분리해서 받습니다.
    // const handleAction = async (meta: any, data?: any) => {
    const handleAction = useCallback(async (meta: any, data?: any) => {
        if (!meta) {
            console.warn("handleAction: meta 정보가 없습니다.");
            return;
        }
        const actionType = meta.actionType || meta.action_type;
        const actionUrl = meta.actionUrl || meta.action_url;
        const currentFormData = formDataRef.current; // 현재 시점의 데이터 꺼내기
        const requiredFields = metadata.filter(m => m.isRequired);

        // 1. 비밀번호 토글
        switch (actionType) {
            case "TOGGLE_PW":
                setShowPassword(prev => !prev);
                setPwType(prev => prev === "password" ? "text" : "password");
                break;

        // 2. 단순 페이지 이동 (새 일기 쓰기 버튼 등)
            case "LINK":
            case "ROUTE":
                router.push(actionUrl);
                router.refresh();
                break;

                // 3. 상세 페이지 이동 (리스트 클릭 시)
            case "ROUTE_DETAIL":
                if (!data) {
                    console.error("데이터가 없으면 상세 페이지로 갈 수 없어.");
                    return;
                }
                const detailId = data.diary_id || data.diaryId;
                if (detailId) {
                    router.push(`${actionUrl}/${detailId}`);
                } else {
                    console.warn("이동할 ID가 데이터에 없습니다.", data);
                }
                break;

            // usePageActions.tsx 내부

            case "LOGOUT":
                try {
                    console.log("카카오 로그아웃 케이스 진입!");
                    // 1. 백엔드 호출 (이때 서버에서 쿠키 삭제 헤더를 보냄) 
                    await axios.post(actionUrl);

                    // 2. 로컬 데이터 삭제
                    localStorage.removeItem('isLoggedIn');
                    document.cookie = "loginType=; path=/; max-age=0;";
                    alert("로그아웃 되었습니다.");
                    await axios.post('/api/auth/logout');
                    window.location.href = "/view/LOGIN_PAGE";
                } catch (error) {
                    // 에러가 나더라도 세션은 끊긴 것으로 간주하고 이동시키는 것이 UX상 유리함 
                    window.location.href = "/view/LOGIN_PAGE";
                }
                break;
            case "KAKAO_LOGOUT":
                // 1. 우리 서버의 로그아웃 API 호출 (우리쪽 쿠키/세션 정리)
                // 이 작업은 조용히 백그라운드에서 처리한다.
                await axios.post('/api/kakao/logout').catch(err => console.error("Internal logout failed", err));

                // 2. 프론트엔드 상태 정리 [cite: 2026-02-16]
                localStorage.removeItem('isLoggedIn');

                // 3. 카카오 공식 로그아웃 페이지로 브라우저를 통째로 보낸다 (Redirect) [cite: 2026-02-16]
                // meta.action_url 에 카카오 로그아웃 주소가 들어있어야 한다. [cite: 2026-01-01]
                if (meta.action_url || meta.actionUrl) {
                    window.location.href = meta.action_url || meta.actionUrl;
                } else {
                    // 주소가 없다면 강제로 로그인 페이지로 보낸다. [cite: 2026-02-16]
                    window.location.href = "/view/LOGIN_PAGE";
                }
                break;

            case "SUBMIT":
                    for (const field of requiredFields as any[]) {
                        const value = currentFormData[field.componentId];
                        if (!value || value.trim() === "") {
                            alert(`${field.label_text || field.labelText} 필드는 필수입니다.`)
                            return;
                        }
                    }
                const {user_email, user_email_domain, ...resData} = currentFormData;
                const submitData = {...resData};

                // @@@@ 2026-02-08 수정 이메일 조합 로직
                if (user_email && user_email_domain) {
                    const fullEmail = `${user_email}@${user_email_domain}`;
                    submitData.user_email = fullEmail;
                    // submitData = {...submitData, user_email: fullEmail};
                }

                console.log("서버로 보낼 최종 데이터:", submitData);

                    const response = await axios.post(actionUrl, submitData);
                    // @@@@ 2026-02-08 추가 SET_TIME_PAGE 페이지의 Action  Handler

                    if (response.status === 200 || response.status === 201) {
                        //  목표 시간 저장 관련 API일 경우 쿼리 무효화 실행
                        if (actionUrl.includes("/api/goalTime/save")) {
                            await queryClient.invalidateQueries({queryKey: ['goalTime']});
                            await queryClient.invalidateQueries({queryKey: ['goalList']});
                        }

                        // 성공 처리
                        if (response.data.accessToken) {
                            localStorage.setItem('isLoggedIn', 'true');
                            router.push("/view/MAIN_PAGE"); // 전체 새로고침으로 데이터 강제 갱신
                            router.refresh(); // 서버 컴포넌트 상태 갱신
                        } else {
                            if (actionUrl && actionUrl.includes("addDiaryList")) {
                                router.push("/view/DIARY_LIST");
                            } else {
                                alert('성공적으로 처리되었습니다.');
                                router.push("/view/MAIN_PAGE");
                            }
                        }
                    }
            default:
                console.warn(`정의되지 않은 액션 타입이야: ${actionType}`);
                break;
        }
    }, [metadata, router, queryClient]);
    return {formData, handleChange, handleAction, showPassword, pwType};
};