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

        const {actionType, actionUrl} = meta;
        const currentFormData = formDataRef.current; // 현재 시점의 데이터 꺼내기

        // 1. 비밀번호 토글
        if (actionType === "TOGGLE_PW") {
            setShowPassword(prev => !prev);
            setPwType(prev => prev === "password" ? "text" : "password");
            return;
        }

        // 2. 단순 페이지 이동 (새 일기 쓰기 버튼 등)
        // DB에는 "ROUTE"로 되어있고, 코드는 "LINK"였으므로 둘 다 처리하거나 ROUTE를 추가합니다.
        if (actionType === "LINK" || actionType === "ROUTE") {
            router.push(actionUrl);
            return;
        }

        // 3. 상세 페이지 이동 (리스트 클릭 시)
        if (actionType === "ROUTE_DETAIL") {
            // ID는 meta가 아니라 data(두 번째 인자)에 들어있습니다.
            if (data) {
                console.log("상세 이동 데이터:", data);
                const detailId = data.diary_id || data.diaryId;
                if (detailId) {
                    router.push(`${actionUrl}/${detailId}`);
                } else {
                    console.warn("이동할 ID(diary_id)가 데이터에 없습니다.", data);
                }
            } else {
                console.warn("상세 이동을 위한 데이터가 전달되지 않았습니다.");
            }
            return;
        }

        // 4. 데이터 전송 로직 (SUBMIT)
        if (actionType === "SUBMIT") {
            console.log("usePageActions 실제 보낼 데이터:", currentFormData);

            // 필수 값 체크
            const requiredFields = metadata.filter(m => m.isRequired);
            for (const field of requiredFields as any[]) {
                const value = currentFormData[field.componentId];
                if (!value || value.trim() === "") {
                    alert(`${field.label_text || field.labelText} 필드는 필수입니다.`)
                    return;
                }
            }

            // URL 및 데이터 가공
            // const finalUrl = actionUrl || `/api/execute/${meta.dataSqlKey}`;

            const {user_email, user_email_domain, ...resData} = currentFormData;
            const submitData = {...resData};

            // @@@@ 2026-02-08 수정 이메일 조합 로직
            if (user_email && user_email_domain) {
                const fullEmail = `${user_email}@${user_email_domain}`;
                submitData.user_email = fullEmail;
                // submitData = {...submitData, user_email: fullEmail};
            }

            console.log("서버로 보낼 최종 데이터:", submitData);

            try {
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
                        document.cookie = `accessToken=${response.data.accessToken}; path=/; max-age=3600`;
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
            } catch (error) {
                console.log("error: ", error);
                alert(`오류가 발생했습니다.`);
            }
        }
    }, [metadata, router, queryClient]);
    return {formData, handleChange, handleAction, showPassword, pwType};
};