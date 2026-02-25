
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/services/axios";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useBaseActions } from "./useBaseActions";

export const useUserActions = (screenId: string,metadata: any[] = [], initialData: any = {}) => {
    const base = useBaseActions(screenId, metadata, initialData);
    const router = useRouter();
    const { user } = useAuth();
    const { sendMessage } = useWebSocket();
    const [activeModal, setActiveModal] = useState<string | null>(null);

// [수정] 모달 닫기 함수
    const closeModal = () => setActiveModal(null);

    // [수정] 이메일 인증 여부 최종 확인 (모달의 '확인' 버튼 클릭 시 실행)
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

    const handleAction = useCallback(async (meta: any) => {
        if (!meta) return;
        const currentFormData = base.formDataRef.current;

        const componentId = meta.component_id;

        const actionType = meta.action_type || meta.actionType;

        const actionUrl = meta.action_url || meta.actionUrl;

        // 회원가입 제출 로직 통합
        if (componentId === 'reg_submit') {
            try {
                const currentData = base.formDataRef.current;
                const submitData = Object.keys(currentData).reduce((acc: any, key) => {
                    acc[key.replace('reg_', '')] = currentData[key];
                    return acc;
                }, {});

                const res = await axios.post('/api/auth/register', submitData);
                if (res.status === 201) {
                    // 1. 인증 메일 발송 (UUID 토큰 방식)
                    await axios.post('/api/auth/signup?message=welcome', { email: submitData.email });
                    // 2. 모달 띄우기 (페이지 이동 X)
                    setActiveModal("email_verify_modal");
                }
            } catch (error: any) {
                alert(error.response?.data || "가입 중 오류 발생");
            }
            return;
        }

        // 2. 가입 제출 (reg_submit) [cite: 2025-12-28]
        if (componentId === 'reg_submit') {
            try {
                // 백엔드 전송을 위한 데이터 가공 (필요 시 reg_ 접두어 제거)
                const submitData = Object.keys(currentFormData).reduce((acc: any, key) => {
                    const cleanKey = key.replace('reg_', '');
                    acc[cleanKey] = currentFormData[key];
                    return acc;
                }, {});

                // 가입 API 호출
                const res = await axios.post('/api/auth/register', submitData);
                if (res.status === 201) {
                    // 가입 성공 후 인증 코드 발송 로직으로 이어짐 [cite: 2026-02-17]
                    await axios.post('/api/auth/signup?message=welcome', { email: submitData.email });

                    // 2. 페이지 이동 대신, 메타데이터에 정의된 모달 ID를 활성화
                    setActiveModal("email_verify_modal");

                    alert("가입 성공! 이메일로 발송된 인증코드를 확인해줘.");

                    const userEmail = currentFormData.reg_email || currentFormData.email;
                    router.push(`/view/VERIFY_CODE_PAGE?email=${encodeURIComponent(userEmail)}`);
                }
            } catch (error: any) {
                alert(error.response?.data || "회원가입 중 오류가 발생했어.");
            }
        }

        switch (actionType) {// [추가] 페이지 이동 로직
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

            case "REGISTER_SUBMIT":
                try {
                    // 1. 회원가입 실행
                    const response = await axios.post(actionUrl, currentFormData);
                    if (response.status === 201 || response.status === 200) {
                        // 2. 가입 성공 시 인증 코드 발송 (백엔드 signup 엔드포인트)
                        await axios.post('/api/auth/signup?message=welcome', {
                            email: currentFormData.email
                        });
                        alert("인증 코드가 이메일로 전송되었습니다.");
                        router.push("/view/VERIFY_CODE_PAGE");
                    }
                } catch (error) {
                    alert("가입 처리 중 오류가 발생했습니다.");
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
                try {
                    console.log("카카오 로그아웃 케이스 진입!");
                    // 1. 백엔드 호출 (이때 서버에서 쿠키 삭제 헤더를 보냄)
                    await axios.post(actionUrl);
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

                //  카카오 공식 로그아웃 페이지로 브라우저를 통째로 보낸다 (Redirect)
                // meta.action_url 에 카카오 로그아웃 주소가 들어있어야 한다.
                if (meta.action_url || meta.actionUrl) {
                    window.location.href = meta.action_url || meta.actionUrl;
                } else {
                    // 주소가 없다면 강제로 로그인 페이지로 보낸다.
                    window.location.href = "/view/LOGIN_PAGE";
                }
                break;

            default:
                break;
        }
    }, [base, user, sendMessage, router]);

    return {
        ...base,
        handleAction,
        activeModal,
        closeModal,
        onConfirmModal
    };
};
