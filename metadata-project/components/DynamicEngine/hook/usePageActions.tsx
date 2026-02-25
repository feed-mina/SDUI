import {useRouter} from "next/navigation";
import axios from "@/services/axios";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext"; // 1. AuthContext 가져오기
import { useWebSocket } from "@/hooks/useWebSocket"; // 2. 새로 만든 훅

// @@@@ 2026-02-07 주석 추가
// usePageActions 역할 : 사용자의 입력 (formData)와  클릭 이벤트 (handleAction)를 처리하는 훅
// 인자 타입을 (meta, data) 두 개로 변경하는 것이 핵심입니다.
export const usePageActions = (metadata: any[] = [], initialData: any = {}) => {
    const { user,login } = useAuth(); // 3. 로그인한 유저 정보 꺼내기
    const { sendMessage } = useWebSocket(); // 4. 메시지 전송 함수 가져오기

    const queryClient = useQueryClient();
    const router = useRouter();
    const [formData, setFormData] = useState<any>({});
    const [showPassword, setShowPassword] = useState(false);
    const [pwType, setPwType] = useState("password");
    // 이전 props를 기억하기 위한 상태
    const [prevMetadata, setPrevMetadata] = useState(metadata);
    const [prevInitialData, setPrevInitialData] = useState(initialData);

    // [해결 포인트] 렌더링 도중 상태 업데이트 (Effect 없이 동기화)
    // 1. Metadata가 바뀌면 (화면 이동 시) 폼 데이터 초기화
    if (metadata !== prevMetadata) {
        setPrevMetadata(metadata);
        setFormData({});
    }

    // 2. InitialData가 들어오면 (데이터 로드 성공 시) 폼 데이터 채우기
    if (initialData !== prevInitialData && Object.keys(initialData).length > 0) {
        setPrevInitialData(initialData);
        setFormData((prev: any) => ({
            ...initialData,
            ...prev
        }));
    }
    const formDataRef = useRef(formData);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);
    const startLocationTracking =  useCallback(() => {
        //   브라우저의 기능을 써서 현재 위치를 가져와.
        navigator.geolocation.watchPosition((position) => {
            const { latitude, longitude } = position.coords;
            // . 5초마다 혹은 위치가 바뀔 때마다 서버에 위치를 전송해.
            sendMessage('/pub/location/update', {
                lat: latitude,
                lng: longitude
            });
        });
    }, [sendMessage]);


//  SOS 요청 로직 분리
    // navigator를 사용해 현재 위치를 즉시 가져오는 로직
    const handleSosRequest = useCallback(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((position) => {
            const payload = {
                userSqno: user?.userSqno,
                status: 'HELP',
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            sendMessage('/pub/location/emergency', payload);
        }, () => alert("위치 정보를 가져올 수 없어 SOS를 보낼 수 없어."));
    }, [user, sendMessage]);

    const requiredFields = useMemo(() => metadata?.filter(meta => meta?.isRequired === true || meta?.is_required === "true" ||
        meta?.is_required === true || meta?.is_required === "true" ) || [], [metadata]);

    const handleChange = useCallback((id: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    }, []);

    const handleAction = useCallback(async (meta: any, data?: any) => {
        if (!meta) return;

        const actionType = meta.actionType || meta.action_type;
        const actionUrl = meta.actionUrl || meta.action_url;
        const dataSqlKey = meta.dataSqlKey || meta.data_sql_key;
        const currentFormData = formDataRef.current;
        switch (actionType) {
            case "SUBMIT":
                // 1. 모든 메타데이터를 트리 끝까지 뒤져서 평면 리스트로 만드는 함수
                const flattenMetadata = (items: any[]): any[] => {
                    let result: any[] = [];
                    items.forEach(item => {
                        result.push(item);
                        if (item.children && item.children.length > 0) {
                            result = result.concat(flattenMetadata(item.children));
                        }
                    });
                    return result;
                };

                const allComponents = flattenMetadata(metadata);

                // 2. 평탄화된 리스트를 기반으로 모든 입력 필드의 기본값(null) 생성 [cite: 2025-12-28]
                // 이렇게 해야 섹션 안에 숨은 'content'나 'emotion'도 null로 채워져서 서버 에러가 안 나 [cite: 2025-12-28]
                // usePageActions.tsx의 SUBMIT 로직 내부
                const defaultData = allComponents.reduce((acc: any, item: any) => {
                    const key = item.componentId || item.component_id;
                    if (key && !item.children) {
                        acc[key] = null;
                    }
                    return acc;
                }, {});

                const submitData = {
                    ...defaultData,     // 1. 모든 필드를 null로 초기화
                    ...currentFormData, // 2. 사용자가 입력한 실제 값으로 덮어쓰기 (순서 중요!)
                };

                console.log("실제 입력된 데이터(currentFormData):", currentFormData);
                console.log("서버로 보낼 최종 데이터(submitData):", submitData);
                // 3. 식별자 확보 및 숫자 체크
                const pathParts = window.location.pathname.split('/');
                const idFromUrl = pathParts[pathParts.length - 1];
                // idFromUrl이 숫자인 경우에만 ID로 인정함
                const isNumericId = /^\d+$/.test(idFromUrl);


                // 숫자로 된 ID가 있을 때만 diary_id를 추가 (수정 모드일 때만 작동)
                if (isNumericId) {
                    submitData.diary_id = idFromUrl;
                }

                // 4. 필수값 검증 (평탄화된 리스트 기준)
                const currentRequiredFields = allComponents.filter(m => {
                    const req = m.isRequired || m.is_required;
                    return req === true || req === "true";
                });

                for (const field of currentRequiredFields) {
                    const fieldId = field.componentId || field.component_id;
                    if (!submitData[fieldId]) {
                        alert(`${field.labelText || field.label_text}은(는) 필수입니다.`);
                        return;
                    }
                }

                // 5. JSONB 처리 및 전송 [cite: 2025-12-28]
                Object.keys(submitData).forEach(key => {
                    const value = submitData[key];
                    if (value && typeof value === 'object') {
                        submitData[key] = JSON.stringify(value);
                    }
                });

                const finalUrl = dataSqlKey ? `/api/execute/${dataSqlKey}` : actionUrl;

                try {
                    console.log("최종 바인딩 데이터 확인:", submitData);
                    const response = await axios.post(finalUrl, submitData);
                    if (response.status === 200 || response.status === 201) {
                        router.push("/view/DIARY_LIST");
                        router.refresh();
                    }
                } catch (error) {
                    console.error("제출 에러:", error);
                }
                break;
            case "LINK":
            case "ROUTE":
                const url = meta.actionUrl || meta.action_url;
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    window.location.href = url;
                    return;
                }
                router.push(actionUrl);
                router.refresh();
                break;


            case "TOGGLE_PW":
                setShowPassword(prev => !prev);
                setPwType(prev => prev === "password" ? "text" : "password");
                break;

            // 3. 상세 페이지 이동 (리스트 클릭 시)
            case "ROUTE_MODIFY":
            case "ROUTE_DETAIL":
                const baseActionUrl = meta.actionUrl || meta.action_url;
                if (!data) {
                    console.error(`${actionType} 액션 실행 실패: 데이터가 없습니다.`);
                    return;
                }
                const diaryId = data.diary_id || data.diaryId;
                if (diaryId && baseActionUrl) {// /view/DIARY_MODIFY/34 형태로 URL 생성
                    const finalPath = baseActionUrl.endsWith('/')
                        ? `${baseActionUrl}${diaryId}`
                        : `${baseActionUrl}/${diaryId}`;
                    router.push(finalPath);
                } else {
                    console.warn("이동할 경로 또는 ID가 데이터에 없습니다.", { baseActionUrl, diaryId });
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
    }, [metadata, router, queryClient, user, sendMessage, requiredFields, login]);

    return { formData, handleChange, handleAction , showPassword, pwType};
};