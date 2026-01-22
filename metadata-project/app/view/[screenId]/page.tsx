// app/view/[screenId]/page.tsx
'use client'; // 상태 관리와 이벤트를 위해 클라이언트 컴포넌트로 설정합니다.

import React, { useEffect, useState } from "react";
import axios from "@/api/axios";
import { useParams, useRouter } from "next/navigation"; // Next.js 전용으로 변경
import DynamicEngine from "@/components/DynamicEngine";
import Pagination from "@/components/Pagination";
import FilterToggle from "@/components/FilterToggle";

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

    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5; // 한 페이지당 보여줄 개수

    const [isOnlyMine, setIsOnlyMine] = useState(false);

    const handleToggleMine = () => {
        setIsOnlyMine(prev => !prev);
        setCurrentPage(1);
    };

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
                        let apiUrl = source.dataApiUrl.includes('/api/execute') ? source.dataApiUrl : `/api/execute/${source.dataSqlKey}`;

                        // 내 일기 모드 일때 URL변경
                        if (source.componentId === "diary_list_source" && isOnlyMine){
                            apiUrl = "/api/diary/member-diaries";
                        }

                        const rawParams = source.dataParams || source.data_params || "{}";
                        const parsedParams = typeof rawParams === 'string' ? JSON.parse(rawParams) : rawParams;
                        // dataParams가 문자열이면 객체로 바꾸고 없으면 빈 객체를 기본값으로 준다

                        const calculatedOffset = (currentPage - 1) * pageSize; // SQL용 (0, 5, 10...)
                        const apiPageNumber = currentPage - 1; // API용 (0, 1, 2...) -> 0부터 시작!

                        const finalParams = {
                            ...parsedParams, // DB 설정값이 있으면 기본값을 덮어쓴다
                            // limit : pageSize,
                            pageSize: pageSize,
                            offset : calculatedOffset,
                            page : apiPageNumber,
                            pageNo : currentPage,
                            filterId: isOnlyMine ? (formData["user_id"] || "본인ID") : "",
                            userId: undefined,
                            // userId: isOnlyMine ?(formData["user_id"] || "본인ID") : "",
                            userSqno : parsedParams.userSqno || "9999"
                        }
                        // 서버가 바로 꺼내 쓸 수 있도록 펼쳐서 보낸다.

                        console.log(`[요청] 모드:${isOnlyMine ? 'API' : 'SQL'}, URL:${apiUrl}`);
                        console.log(`[파라미터] offset:${calculatedOffset}, page(0-base):${apiPageNumber}`);
                        const token = getCookie("accessToken");
                        console.log(`[토큰 확인] 현재 토큰 값: ${token ? "있음(앞자리: " + token.substring(0, 10) + "...)" : "없음(NULL)"}`);

                        const headers: any = {};
                        if (isOnlyMine && token) {
                            headers["Authorization"] = `Bearer ${token}`; // "Bearer " 뒤에 공백 필수!
                        }
                        // const res = await axios.post(apiUrl, {...finalParams});
                        console.log(`[요청 헤더]`, headers);

                        let res;
                        try {
                            if (isOnlyMine && source.componentId === "diary_list_source") {
                                // GET 요청: headers는 config 객체 안에 넣어야 함 (중요!)
                                res = await axios.get(apiUrl, {
                                    params: finalParams,
                                    headers: headers  // <--- 여기가 핵심
                                });
                            } else {
                                // POST 요청
                                res = await axios.post(apiUrl, { ...finalParams });
                            }
                        } catch (e) {
                            console.error("API 요청 실패:", e);
                            return { id: source.componentId, data: [] };
                        }

                        const responeBody = res.data;
                            const realData = responeBody.data || responeBody;
                            console.log(`${source.componentId}의 응답 데이터:`, realData);

                        return {
                            id: source.componentId,
                            status: "success",
                            data: realData
                        };

                    } catch (err) {
                        console.log(`${source.componentId}의 응답 데이터: `, err);
                        return { id: source.componentId, data: [] };
                    }
                });

                const results = await Promise.all(dataPromises);
                const combinedData: any = {};

                results.forEach((res: any) => {
                    if (res && res.id) {
                        // 1. 백엔드가 준 보따리 풀기 (member-diaries는 res.data에 직접 데이터가 옴)
                        const rawResponse = res.data || {};

                        // 2. 진짜 알맹이(배열) 찾기
                        // list에 있으면 list를, data에 있으면 data를, 아니면 본체 자체가 배열인지 확인
                        const realList = rawResponse.list || rawResponse.data || (Array.isArray(rawResponse) ? rawResponse : []);

                        // 3. 엔진이 이해할 수 있게 이름표 갈아끼우기 (Alias 통일)
                        const unifiedList = realList.map((item: any) => ({
                            ...item,
                            diary_id: item.diaryId || item.diary_id,
                            user_id: item.userId || item.user_id || item.author || item.nickname || "알수없음",
                            reg_dt: (item.regDt || item.reg_dt || item.date).replace(/-/g, '.'),
                            title: item.title || "제목 없음",
                            content: item.content || "내용 없음"
                        }));

                        // 4. 창고에 저장
                        combinedData[res.id] = {
                            status: res.status,
                            data: unifiedList
                        };

                        // 5. 페이지네이션 숫자(TotalCount) 똑똑하게 맞추기
                        if (res.id === "diary_list_source" && isOnlyMine) {
                            // '내 일기' 모드일 때는 보따리에 적힌 total(14)을 사용
                            const total = rawResponse.total || 0;
                            setTotalCount(total);
                            console.log("내 일기 개수 적용:", total);
                        } else if (res.id === "diary_total_count" && !isOnlyMine) {
                            // '전체' 모드일 때는 전용 개수 쿼리의 결과(21)를 사용
                            const total = unifiedList[0]?.total_count || rawResponse.total_count || 0;
                            setTotalCount(total);
                            console.log("전체 일기 개수 적용:total_count", total);
                        }

                        console.log(`[최종확인] ${res.id} 상자에 담긴 실제 데이터 개수:`, unifiedList.length);
                        console.log("최종 pageData:", combinedData);
                        setPageData(combinedData);
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
    }, [screenId, isLoggedIn, router, currentPage, pageSize, isOnlyMine]);

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
            {screenId === "DIARY_LIST" && (
                <FilterToggle isOnlyMine={isOnlyMine} onToggle={handleToggleMine} />
            )}
            <DynamicEngine
                metadata={filtedMetadata}
                onChange={handleChange}
                onAction={handleAction}
                pageData={pageData}
                pwType={pwType}
                showPassword={showPassword}
            />

            {screenId === "DIARY_LIST"  && (
                <Pagination
                    totalCount={totalCount}
                    pageSize={pageSize}
                    currentPage={currentPage}
                    onPageChange={(page) => {
                        setCurrentPage(page);
                        console.log(`[페이지 변경] 현재 페이지: ${currentPage}, 변경된 페이지: ${page}`);
                    }}
                />
            )}
        </div>
    );
}