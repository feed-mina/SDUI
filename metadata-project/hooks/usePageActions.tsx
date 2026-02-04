import {useRouter} from "next/navigation";
import axios from "@/api/axios";
import React, {useState} from "react";

// 인자 타입을 (meta, data) 두 개로 변경하는 것이 핵심입니다.
export const usePageActions = (metadata: any[]) => {
    const router = useRouter();
    const [formData, setFormData] = useState<any>({});
    const [showPassword, setShowPassword] = useState(false);
    const [pwType, setPwType] = useState("password");

    const handleChange = (id: any, value : any) => {
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    };

    // [중요 수정] item(메타)과 data(실제 데이터)를 분리해서 받습니다.
    const handleAction = async (meta: any, data?: any) => {
        // console.log('버튼 눌림 Meta:', meta);
        // console.log('버튼 눌림 Data:', data);

        const { actionType, actionUrl } = meta;

        // 1. 비밀번호 토글
        if(actionType === "TOGGLE_PW"){
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
        if(actionType === "SUBMIT"){
            console.log("보낼 데이터:", formData);

            // 필수 값 체크
            const requiredFields = metadata.filter(m => m.isRequired);
            for (const field of requiredFields as any[]){
                const value = formData[field.componentId];
                if(!value || value.trim() === ""){
                    alert(`${field.label_text || field.labelText} 필드는 필수입니다.`)
                    return;
                }
            }

            // URL 및 데이터 가공
            // const finalUrl = actionUrl || `/api/execute/${meta.dataSqlKey}`;
            let submitData = { ...formData};

            // 이메일 조합 로직
            const emailId = formData["user_email"];
            const emailDomain = formData["user_email_domain"];
            if(emailId && emailDomain ) {
                const fullEmail = `${emailId}@${emailDomain}`;
                submitData = {...submitData, user_email: fullEmail};
            }

            console.log("서버로 보낼 최종 데이터:", submitData);

            try{
                const response = await axios.post(actionUrl, submitData);

                if(response.status === 200 || response.status === 201){
                    // 성공 처리
                    if(response.data.accessToken){
                        document.cookie = `accessToken=${response.data.accessToken}; path=/; max-age=3600`;
                        window.location.href = '/view/MAIN_PAGE'; // 전체 새로고침으로 데이터 강제 갱신
                    } else {
                        if(actionUrl && actionUrl.includes("addDiaryList")){
                            router.push("/view/DIARY_LIST");
                        } else{
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
    };

    return { formData, handleChange, handleAction, showPassword, pwType };
};