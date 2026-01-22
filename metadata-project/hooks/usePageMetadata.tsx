import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import axios from "@/api/axios";

export const usePageMetadata = (screenId: string, currentPage: number, isOnlyMine: boolean)=>{
    const router = useRouter(); // window.location.href 대신 사용

    const[metadata, setMetadata] = useState<any[]>([]);
    const [formData, setFormData] = useState<any>({});
    const [totalCount, setTotalCount] = useState(0);

    const [pageData, setPageData] = useState([]);
    const [loading, setLoading] = useState(true);
    const pageSize = 5; // 한 페이지당 보여줄 개수

    // --- 쿠키 및 로그인 로직 (기존 코드 유지) ---
    const getCookie = (name:string) => {
        if (typeof document === "undefined") return null; // 서버 사이드 에러 방지
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const isLoggedIn = !!getCookie("accessToken");
    useEffect(() => {
        // initializePage 로직

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
                        let apiUrl = source.dataApiUrl?.includes('/api/execute')
                            ? source.dataApiUrl
                            : (source.dataSqlKey ? `/api/execute/${source.dataSqlKey}` : null);


                        if (!apiUrl) {
                            console.warn(`[경고] ${source.componentId}에 연결된 SQL 키나 API 주소가 없습니다.`);
                            return { id: source.componentId, data: [] };
                        }
                        // 내 일기 모드 일때 URL변경
                        if (source.componentId === "diary_list_source" && isOnlyMine){
                            apiUrl = "/api/diary/member-diaries";
                        }

                        const rawParams = source.dataParams || source.data_params || "{}";
                        const parsedParams = typeof rawParams === 'string' ? JSON.parse(rawParams) : rawParams;
                        // dataParams가 문자열이면 객체로 바꾸고 없으면 빈 객체를 기본값으로 준다

                        const calculatedOffset = (currentPage - 1) * pageSize; // SQL용 (0, 5, 10...)

                        const finalParams = {
                            ...parsedParams,
                            pageSize,
                            offset: calculatedOffset,
                            page: currentPage - 1,
                            pageNo : currentPage,
                            filterId: isOnlyMine ? (formData["user_id"] || "본인ID") : "",
                            userId: undefined,
                            // userId: isOnlyMine ?(formData["user_id"] || "본인ID") : "",
                            userSqno : parsedParams.userSqno || "9999"
                        }
                        // 서버가 바로 꺼내 쓸 수 있도록 펼쳐서 보낸다.

                        console.log(`[요청] 모드:${isOnlyMine ? 'API' : 'SQL'}, URL:${apiUrl}`);
                        const token = getCookie("accessToken");

                        const headers: any = {};
                        if (isOnlyMine && token) {
                            headers["Authorization"] = `Bearer ${token}`; // "Bearer " 뒤에 공백 필수!
                        }
                        // const res = await axios.post(apiUrl, {...finalParams});
                        console.log(`[요청 헤더]`, headers);

                        let res;
                            if (isOnlyMine && source.componentId === "diary_list_source") {
                                // GET 요청: headers는 config 객체 안에 넣어야 함 (중요!)
                                res = await axios.get(apiUrl, {
                                    params: finalParams,
                                    headers
                                });
                            } else {
                                // POST 요청
                                res = await axios.post(apiUrl, { ...finalParams });
                            }
                            return { id: source.componentId, status: "success", data: res.data.data || res.data };

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
    }, [screenId, currentPage, isOnlyMine]);

    return { metadata, pageData, loading, totalCount, isLoggedIn };

};