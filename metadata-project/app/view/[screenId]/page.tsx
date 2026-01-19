'use client';
import React, { useEffect, useState } from "react";
import axios from "@/api/axios";
import { useParams, useRouter } from "next/navigation"; // Next.js 전용으로 변경
import DynamicEngine from "@/components/DynamicEngine";

export default function CommonPage() {
    const params = useParams();
    const screenId = params.screenId; // 주소창의 [screenId] 값을 가져옵니다.
    const router = useRouter(); // window.location.href 대신 사용

    // --- 기존 리액트의 State들 그대로 유지 ---
    const [metadata, setMetadata] = useState([]);
    const [formData, setFormData] = useState({});
    const [pageData, setPageData] = useState({});
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [pwType, setPwType] = useState("password");

    // --- 쿠키 및 로그인 로직 (기존 코드 유지) ---
    const getCookie = (name) => {
        if (typeof document === "undefined") return null; // 서버 사이드 에러 방지
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const isLoggedIn = !!getCookie("accessToken");

    // --- 필터링 로직 (기존 코드 유지) ---
    const filtedMetadata = metadata.map(item => {
        if(item.componentId === "pw_toggle_btn"){
            return { ...item, labelText: showPassword ? "숨기기" : "보이기" };
        }
        return item;
    }).filter(item => {
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

                const sources = metadataList.filter(item => item.componentType === "DATA_SOURCE" && item.actionType === "AUTO_FETCH");

                const dataPromises = sources.map(async (source) => {
                    try {
                        const apiUrl = source.dataApiUrl.includes('/api/execute') ? source.dataApiUrl : `/api/execute/${source.dataSqlKey}`;
                        const res = await axios.post(apiUrl, { params: source.dataParams });
                        return { id: source.componentId, status: "success", data: res.data.data };
                    } catch (err) {
                        return { id: source.componentId, data: [] };
                    }
                });

                const results = await Promise.all(dataPromises);
                const combinedData = {};
                results.forEach(res => { if (res) combinedData[res.id] = res; });
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
    const handleChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleAction = async (item) => {
        const { actionType, actionUrl } = item;
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