import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import axios from "@/api/axios";
const getPayloadFromToken = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

export const usePageMetadata = (screenId: string, currentPage: number, isOnlyMine: boolean, diaryId?: string)=>{
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
    // usePageMetadata 내부
    const token = getCookie("accessToken");
    const payload = token ? getPayloadFromToken(token) : null;

// 토큰 내 userId와 userSqno 추출
    const currentUserId = payload?.userId || "";
    const currentUserSqno = payload?.userSqno || "";

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
                    // console.log("지금 source에 들어 있는 모든 것 :", Object.keys(source));
                    console.log("DB에서 온 원본 소스:", source);
                    let apiUrl = source.dataApiUrl?.includes('/api/execute')
                        ? source.dataApiUrl
                        : (source.dataSqlKey ? `/api/execute/${source.dataSqlKey}` : null);

                    // [추가] 상세 페이지일 경우 URL 뒤에 ID 붙이기
                    if (screenId === "DIARY_DETAIL" && source.componentId === "detail_source" && diaryId) {
                        // source.dataApiUrl이 "/viewDiaryItem" 이라면 -> "/viewDiaryItem/6"
                        apiUrl = `${source.dataApiUrl}/${diaryId}`;
                    } else if (source.dataApiUrl?.includes('/api/execute')) {
                        // 기존 로직
                        apiUrl = source.dataApiUrl;
                    } else if (source.dataSqlKey) {
                        // 기존 로직
                        apiUrl = `/api/execute/${source.dataSqlKey}`;
                    }


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
                        offset: (currentPage - 1) * pageSize,
                        // 내가 쓴 일기 모드일 때 토큰에서 뽑은 진짜 ID를 전달
                        filterId: isOnlyMine ? currentUserId : "",

                        userId: currentUserId || "guest",
                        userSqno: isOnlyMine ? currentUserSqno : (parsedParams.userSqno || "9999")
                    };
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

                    if (screenId === "DIARY_DETAIL") {
                        // 상세 조회는 GET 요청
                        res = await axios.get(apiUrl, { params: finalParams, headers });
                    } else if (isOnlyMine && source.componentId === "diary_list_source") {
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
                // @@@@ 2026-02-03 추가 임시변수 활용
                let detectedTotalCount = 0;

                results.forEach((res: any) => {
                    if (res && res.id) {
                        // 1. 백엔드가 준 보따리 풀기 (member-diaries는 res.data에 직접 데이터가 옴)
                        const rawResponse = res.data || {};
                        let realList = [];
                        // 2. 진짜 알맹이(배열) 찾기
                        // list에 있으면 list를, data에 있으면 data를, 아니면 본체 자체가 배열인지 확인
                        if (rawResponse.diaryItem) {
                            realList = [rawResponse.diaryItem]; // 객체 1개를 배열로 감싸기
                        } else {
                            // 리스트나 data로 주면 그걸 챙긴다.
                            realList = rawResponse.list || rawResponse.data || (Array.isArray(rawResponse) ? rawResponse : []);
                        }

                        // 3. 엔진이 이해할 수 있게 이름표 갈아끼우기 (Alias 통일)
                        // @@@@ 2026-02-04 추가 : 백앤드와 통일
                        const unifiedList = realList.map((item: any) => {
                            console.log("unifiedList item: ", item);
                            // 날짜 포맷팅 (YYYY-MM-DDTHH:mm... -> YYYY.MM.DD)
                            const rawDate = item.regDt || item.reg_dt || item.date || "";
                            const formattedDate = rawDate.split('T')[0].replace(/-/g, '.');

                            return {
                                ...item,
                                detail_title: item.title,       // 제목 연결
                                detail_content: item.content,   // 내용 연결
                                detail_date: formattedDate,     // 날짜 연결
                                diary_id: item.diaryId || item.diary_id,
                                user_id: item.userId || item.user_id,
                                reg_dt: formattedDate
                            };
                        });

                        // 4. 창고에 저장
                        combinedData[res.id] = {
                            status: res.status,
                            data: unifiedList
                        };

                        // 5. 페이지네이션 숫자(TotalCount) 똑똑하게 맞추기
                        if (res.id === "diary_list_source" && isOnlyMine) {
                            // '내 일기' 모드일 때는 보따리에 적힌 total(14)을 사용
                            detectedTotalCount = rawResponse.total || 0;
                        } else if (res.id === "diary_total_count" && !isOnlyMine) {
                            // '전체' 모드일 때는 전용 개수 쿼리의 결과(21)를 사용
                            detectedTotalCount = unifiedList[0]?.total_count || rawResponse.total_count || 0;
                        }

                        console.log(`[최종확인] ${res.id} 상자에 담긴 실제 데이터 개수:`, unifiedList.length);
                        console.log("최종 pageData:", combinedData);
                    }
                });
                console.log("진짜로 이름표가 붙은 창고:", combinedData);

                // 2026-02-03 추가 상태 업데이트는 마지막에 몰아서 한번만 !
                setPageData(combinedData);
                setTotalCount(detectedTotalCount);
            } catch (error) {
                console.error("에러 발생: ", error);
            } finally {
                setLoading(false);
            }
        };
        initializePage();
    }, [screenId, currentPage, isOnlyMine, diaryId]);

    return { metadata, pageData, loading, totalCount, isLoggedIn };

};