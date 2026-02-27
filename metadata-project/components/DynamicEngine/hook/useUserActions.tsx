
import {useCallback, useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import axios from "@/services/axios";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useBaseActions } from "./useBaseActions";


//  @@@@ useUserActions 역할 : 메타데이터의 action_type에 따라 각 타입 설명
export const useUserActions = (screenId: string,metadata: any[] = [], initialData: any = {}) => {
    const base = useBaseActions(screenId, metadata, initialData);
    const router = useRouter();
    const { user,login, logout } = useAuth();
    const { sendMessage } = useWebSocket();
    //  모달 열기 상태
    const [activeModal, setActiveModal] = useState<string | null>(null);

// 모달 닫기 함수
    const closeModal = () => setActiveModal(null);

    // 이메일 인증 여부 최종 확인 (모달의 '확인' 버튼 클릭 시 실행)
    const onConfirmModal = async () => {
        const currentData = base.formDataRef.current;
        const email = currentData.reg_email || currentData.email;

        try {
            const response = await axios.get(`/api/auth/check-verification?email=${email}`);
            if (response.data.isVerified) {
                alert("인증 완료! 환영해.");
                setActiveModal(null);
                router.push('/view/LOGIN_PAGE');
            } else {
                alert("아직 이메일 인증 버튼을 누르지 않았어. 메일함을 확인해줘!");
            }
        } catch (error) {
            alert("인증 확인 중 오류가 발생했어.");
        }
    };

    // [이동] 회원 전용 URL 파라미터 감지 로직
    useEffect(() => {
        const targetScreens = ['REGISTER_PAGE', 'VERIFY_CODE_PAGE'];
        if (typeof window !== "undefined" && targetScreens.includes(screenId)) {
            const params = new URLSearchParams(window.location.search);
            const emailFromUrl = params.get("email");
            if (emailFromUrl) {
                base.setFormData((prev: any) => ({
                    ...prev,
                    reg_email: emailFromUrl,
                    email: emailFromUrl
                }));
            }
        }
    }, [screenId, base.setFormData]);
    const handleAction = useCallback(async (meta: any, data?: any) => {
        const info = base.getMetaInfo(meta);
        if (!info) return;

        const { actionType, actionUrl, currentData } = info;

        // * 현재 입력값 상태
        const currentFormData = base.formDataRef.current;

        const componentId = meta.component_id;


        switch (actionType) {
            case "LOGIN_SUBMIT":
                console.log('뭐야 ')
                try {
                    const loginData = {
                        user_email: `${currentData.user_email}@${currentData.user_email_domain}`,
                        user_pw: currentData.user_pw
                    };
            console.log('loginData', loginData);
                    const res = await axios.post(actionUrl || '/api/auth/login', loginData);
                    if (res.status === 200) {
                        //   AuthContext의 상태 업데이트
                        login(res.data);
                        alert("로그인 성공!");
                        router.push('/view/MAIN_PAGE');
                    }
                } catch (error: any) {
                    alert(error.response?.data || "로그인 정보가 올바르지 않아.");
                }
                break;
            case "REGISTER_SUBMIT":
                try {
                    //   데이터 가공 (reg_ 접두어 제거)
                    const submitData = Object.keys(currentFormData).reduce((acc: any, key) => {
                        const cleanKey = key.startsWith('reg_') ? key.replace('reg_', '') : key;
                        acc[cleanKey] = currentFormData[key];
                        return acc;
                    }, {});

                    // 2. 가입 API 호출
                    const res = await axios.post(actionUrl || '/api/auth/register', submitData);

                    if (res.status === 201 || res.status === 200) {
                        // 3. 인증 메일 발송
                        await axios.post('/api/auth/signup?message=welcome', { email: submitData.email });

                        alert("가입 성공! 이메일로 발송된 인증코드를 확인해줘.");

                        // 4. 페이지 이동 (이메일을 쿼리 파라미터로 전달하여 useBaseActions가 useEffect에서 이메일을 자동으로 가져옴
                        const userEmail = submitData.email;
                        router.push(`/view/VERIFY_CODE_PAGE?email=${encodeURIComponent(userEmail)}`);
                    }
                } catch (error: any) {
                    alert(error.response?.data || "회원가입 실패.");
                }
                break;

            case "VERIFY_CODE":
                try {
                    const currentData = base.formDataRef.current;

                    // 필수값 체크
                    if (!currentData.reg_code) {
                        alert("인증 번호를 입력해줘.");
                        return;
                    }

                    const res = await axios.post('/api/auth/verify-code', {
                        email: currentData.reg_email, // 가입 시 썼던 이메일
                        code: currentData.reg_code    // 사용자가 입력한 코드
                    });

                    if (res.status === 200) {
                        alert("인증 성공! 이제 로그인이 가능해.");
                        router.push("/view/LOGIN_PAGE");
                    }
                } catch (error: any) {
                    alert(error.response?.data || "인증에 실패했어. 코드를 다시 확인해봐.");
                }
                break;

            case "LOGOUT":
                await logout();
                router.push('/view/LOGIN_PAGE');
                break;

            case "KAKAO_LOGOUT":
                try {
                    await axios.post('/api/kakao/logout');
                } catch (err) {
                    console.error("Kakao logout failed", err);
                } finally {
                    await logout(); //  우리 서버 세션 정리 및 상태 초기화
                    if (actionUrl) {
                        window.location.href = actionUrl;
                    } else {
                        router.push('/view/LOGIN_PAGE');
                    }
                }
                break;
            case "LINK":
            case "ROUTE":
                if (!actionUrl) {
                    console.warn("이동할 URL이 없습니다.");
                    return;
                }
                // 외부 링크(http)인 경우와 내부 경로 구분
                if (actionUrl.startsWith('http')) {
                    window.location.href = actionUrl;
                } else {
                    router.push(actionUrl);
                    // 페이지 이동 후 필요시 데이터 갱신
                    router.refresh();
                }
                break;
            case "OPEN_POSTCODE":
                // Daum 주소 API 호출
                if ((window as any).daum) {
                    new (window as any).daum.Postcode({
                        oncomplete: (data: any) => {
                            base.handleChange('zipCode', data.zonecode);
                            base.handleChange('roadAddress', data.roadAddress);
                        }
                    }).open();
                }
                break;

            case "TOGGLE_PW":
                base.togglePassword(); // base에 정의된 로직 실행 [cite: 2026-02-17]
                break;

            case "SOS":
                if (!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition((pos) => {
                    sendMessage('/pub/location/emergency', {
                        userSqno: user?.userSqno,
                        status: 'HELP',
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                });
                break;

            default:
                break;
        }
    }, [base, user, sendMessage, router]);

    return {
        ...base,
        handleAction,
        activeModal,
        closeModal
    };
};
