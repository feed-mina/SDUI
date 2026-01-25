import {useRouter} from "next/navigation";
import axios from "@/api/axios";
import React, {useState} from "react";
import FilterToggle from "@/components/FilterToggle";
import DynamicEngine from "@/components/DynamicEngine";
import Pagination from "@/components/Pagination";

export const usePageActions = (metadata: any[]) =>{
    const router = useRouter();
    const [formData, setFormData] = useState<any>({});
    const [showPassword, setShowPassword] = useState(false);
    const [pwType, setPwType] = useState("password");


    const handleChange = (id: any, value : any) => {
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    };


    const handleAction = async (item: any) => {
        console.log('버튼 눌림')
        const { actionType, actionUrl } = item;

        // 1. 비밀번호 토글 로직
        if(actionType === "TOGGLE_PW"){
            setShowPassword(prev => !prev);
            setPwType(prev => prev === "password" ? "text" : "password");
            return;
        }
        // 2. 페이지 이동 로직
        if (actionType === "LINK") {
            router.push(actionUrl);
            return;
        }

        // 3. 데이터 전송 로직
        if(actionType === "SUBMIT"){
            //  현재 데이터 로그 확인 (디버깅용)
            console.log("보낼 데이터:", formData);
            // 필수 값 체크 및 데이터 가공
            const requiredFields = metadata.filter(meta => meta.isRequired);

            for (const field of requiredFields as any[]){
                const value = formData[field.componentId];

                if(!value || value.trim() === ""){
                    alert(`${field.label_text || field.labelText} 필드는 필수입니다.`)
                    return;
                }
            }
            // 실제 전송할 URL 결정
            const finalUrl = actionUrl || `/api/execute/${item.dataSqlKey}`;
            let submitData = { ...formData};
            // 로그인 페이지인 경우 이메일 조합 로직 수행 _formData에 user_email_domain이 있을때만

            const emailId = formData["user_email"];
            const password = formData["user_pw"];
            const emailDomain = formData["user_email_domain"];
            if(emailId && emailDomain ) {
                const fullEmail = `${emailId}@${emailDomain}`;
                // submitData["email"] = fullEmail;
                submitData = {...submitData, user_email: fullEmail};
            }

            console.log("서버로 보낼 최종 데이터:",submitData);

            try{
                const response = await axios.post(actionUrl, submitData);
                // 성공 후 처리
                if(response.status === 200|| response.status === 201){
                    console.log('성공: ', submitData);
                    alert('성공');
                }
                if(response.data.accessToken){
                    document.cookie = `accessToken=${response.data.accessToken}; path=/; max-age=3600`;
                    router.push("/view/MAIN_PAGE");
                }
                else {
                    if(actionUrl.includes("addDiaryList")){
                        router.push("/view/DIARY_LIST");
                    } else{
                        router.push("/view/MAIN_PAGE");
                    }
                }
            } catch (error) {
                // const errorMsg = error.response?.data?.message || "로그인 정보를 확인해주세요";
                console.log("error: ", error);
                alert(`오류가 났습니다`);
            }
            console.log("액션타입:", actionType, "서버로 보낼 데이터:",formData);
        }
        // ... 나머지 SUBMIT 로직 등도 동일하게 유지
    };
    return { formData, handleChange, handleAction, showPassword, pwType };
};