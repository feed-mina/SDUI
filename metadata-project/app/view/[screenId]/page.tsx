// app/view/[screenId]/page.tsx
'use client'; // 상태 관리와 이벤트를 위해 클라이언트 컴포넌트로 설정합니다.

import React, { useEffect, useState } from "react";
import axios from "@/api/axios";
import { useParams, useRouter } from "next/navigation"; // Next.js 전용으로 변경
import DynamicEngine from "@/components/DynamicEngine";

export default function CommonPage() {
    const params = useParams();
    const screenId = params.screenId; // 주소창의 [screenId] 값을 가져옵니다.
    const router = useRouter(); // window.location.href 대신 사용

    // --- 기존 리액트의 State들 그대로 유지 ---
    const [metadata, setMetadata] = useState<any[]>([]);
    const [formData, setFormData] = useState<any>({});
    const [pageData, setPageData] = useState({});
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [pwType, setPwType] = useState("password");

    // --- 쿠키 및 로그인 로직 (기존 코드 유지) ---
    const getCookie = (name:any) => {
        if (typeof document === "undefined") return null; // 서버 사이드 에러 방지
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const isLoggedIn = !!getCookie("accessToken");

    // --- 필터링 로직 (기존 코드 유지) ---
    const filtedMetadata = metadata.map((item: any) => {
        if(item.componentId === "pw_toggle_btn"){
            return { ...item, labelText: showPassword ? "숨기기" : "보이기" };
        }
        return item;
    }).filter((item:any) => {
        if (item.componentId === "go_login_btn" || item.componentId === "go_tutorial_btn")
            return !isLoggedIn;
        if (item.componentId === "go_diary_btn" || item.componentId === "go_tutorial_btn")
            return isLoggedIn;
        return true;
    });

    // --- useEffect 로직 (기존 코드 유지하되 router 사용) ---
    useEffect(() => {
        const initializePage = async () => {
            if (!screenId) return;
            setLoading(true);

            if (isLoggedIn && screenId === "LOGIN_PAGE") {
                alert("이미 로그인된 상태입니다.");
                router.push("/view/MAIN_PAGE");
                return;
            }

            try {
                const uiRes = await axios.get(`/api/ui/${screenId}`);
                const metadataList = uiRes.data.data || [];
                setMetadata(metadataList);

                const sources = metadataList.filter((item:any) => item.componentType === "DATA_SOURCE" && item.actionType === "AUTO_FETCH");

                const dataPromises = sources.map(async (source:any) => {
                    console.log("지금 source에 들어 있는 모든 것 :", Object.keys(source));
                    console.log("DB에서 온 원본 소스:", source);
                    try {
                        const apiUrl = source.dataApiUrl.includes('/api/execute') ? source.dataApiUrl : `/api/execute/${source.dataSqlKey}`;
                        const mockParams = { limit: 5, offset: 0 };
                        // dataParams가 문자열이면 객체로 바꾸고 없으면 빈 객체를 기본값으로 준다
                        const rawParams = source.dataParams || source.data_params || "{}";
                        // console.log("꺼내온 원본 파라미터:", rawParams);
                        const parsedParams = typeof rawParams === 'string' ? JSON.parse(rawParams) : rawParams;
                        // console.log("전송 직전 재료:", parsedParams);
                        // 서버가 바로 꺼내 쓸 수 있도록 펼쳐서 보낸다.
                        // console.log("백엔드로 보낼 최종 재료:", { ...parsedParams });
                        const res = await axios.post(apiUrl, {...mockParams});
                        console.log(`${source.componentId}의 응답 데이터:`, res.data);
                        return {id: source.componentId, status: "success", data: res.data.data};

                    } catch (err) {
                        return { id: source.componentId, data: [] };
                    }
                });

                const results = await Promise.all(dataPromises);
                const combinedData: any = {};
                results.forEach((res: any) => {
                    if (res && res.id) {
                        combinedData[res.id] = {
                            status : res.status,
                            data : res.data
                        };
                        console.log(`상자에 저장되는 이름: ${res.id}, 데이터 개수: ${res.data?.length}`);
                        // combinedData[res.id] = res;
                    }
                });

                console.log("진짜로 이름표가 붙은 창고:", combinedData);
                setPageData(combinedData);
            } catch (error) {
                console.error("에러 발생: ", error);
            } finally {
                setLoading(false);
            }
        };
        initializePage();
    }, [screenId, isLoggedIn, router]);

    // --- 핸들러 함수들 (기존 코드 유지하되 router.push 사용) ---
    const handleChange = (id: any, value : any) => {
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    };

    const handleAction = async (item: any) => {
        const { actionType, actionUrl , componentId} = item;

        if(actionType === "TOGGLE_PW"){
            setShowPassword(prev => !prev);
            setPwType(prev => prev === "password" ? "text" : "password");
            return;
        }
        if(actionType === "SUBMIT"){
            const emailId = formData["user_email"];
            const password = formData["user_pw"];
            const emailDomain = formData["user_email_domain"];
            if(!emailId || !emailDomain || emailDomain.trim() === ""){
                return;
            }

            const fullEmail = (emailId && emailDomain) ? `${emailId}@${emailDomain}` : "";
            const requiredFields = metadata.filter(meta => meta.isRequired);

            const submitData = { ...formData, user_email: fullEmail };
            if(!fullEmail){
                return;
            }

            for (const field of requiredFields as any[]){
                const value = formData[field.componentId];

                if(!value || value.trim() === ""){
                    return;
                }
            }

            try{
                const response = await axios.post(actionUrl, submitData);
                if(response.data.accessToken){
                    document.cookie = `accessToken=${response.data.accessToken}; path=/; max-age=3600`;
                    router.push("/view/MAIN_PAGE");
                }
                router.push("/view/MAIN_PAGE");
            } catch (error) {
                // const errorMsg = error.response?.data?.message || "로그인 정보를 확인해주세요";
                console.log("error: ", error);
            }
            console.log("액션타입:", actionType, "서버로 보낼 데이터:",formData);
        }
        if (actionType === "LINK") {
            router.push(actionUrl); // Next.js 방식으로 이동
        }
        // ... 나머지 SUBMIT 로직 등도 동일하게 유지
    };

    if (loading) return <div>화면 정보를 읽어오는 중입니다...</div>;

    return (
        <div className={`page-wrap ${screenId}`}>
            <DynamicEngine
                metadata={filtedMetadata}
                onChange={handleChange}
                onAction={handleAction}
                pageData={pageData}
                pwType={pwType}
                showPassword={showPassword}
            />
        </div>
    );
}