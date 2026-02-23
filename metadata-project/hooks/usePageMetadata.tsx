import {useEffect, useState, useCallback, useMemo} from "react";
import {useRouter} from "next/navigation";
import axios from "@/services/axios";
import { useAuth } from "@/context/AuthContext";
import { useMetadata } from "@/components/MetadataProvider";
import {parseJsonbFields} from "@/components/utils/dataParser";


//  @@@@ usePageMetadata 역할 : 메타데이터가져오기 , 원본 데이터 가져오기 , 가져온 데이터를 pageData로 담아줌, 로딩중인지 전체 개수가 몇개인지 같은 페이지의 전역 상태를 관리
// 매개변수 순서를 screenId, currentPage, isOnlyMine 순으로 변경
export const usePageMetadata = (
    screenId: string,
    currentPage: number,
    isOnlyMine: boolean,
    diaryId?: string,
    showPassword?: boolean
) => {
    const router = useRouter();
    const { user, isLoggedIn } = useAuth();
    const { menuTree, isLoading: metaLoading, screenId: providerScreenId } = useMetadata();

    const [metadata, setMetadata] = useState<any[]>([]); // 원본 메타데이터
    const [totalCount, setTotalCount] = useState(0);
    const [pageData, setPageData] = useState<any>({});
    const [loading, setLoading] = useState(true);

    // 내부에서 사용하던 overrideScreenId 대신 인자로 받은 screenId를 직접 사용하거나
    // 우선순위를 결정 (전달받은 screenId || Provider의 screenId)
    const finalScreenId = screenId || providerScreenId;

    // [1] 원본 메타데이터 저장
    useEffect(() => {
        if (menuTree && menuTree.length > 0) {
            setMetadata(menuTree);
        }
    }, [menuTree]);

    const pageSize = 5;

    // [2] 필터링된 메타데이터 생성
    const filteredMetadata = useMemo(() => {
        const filterRecursive = (items: any[]): any[] => {
            if (!items) return [];

            return items
                .map(item => ({
                    ...item,
                    children: item.children ? filterRecursive(item.children) : null,
                    // 비밀번호 토글 텍스트 관리
                    labelText: item.componentId === "pw_toggle_btn"
                        ? (showPassword ? "숨기기" : "보이기")
                        : item.labelText
                }))
                .filter(item => {
                    // 가시성 필터링 로직
                    const guestButtons = ["go_login_btn", "go_tutorial_btn"];
                    const userButtons = ["go_diary_btn", "view_diary_list_btn"];

                    // 로그인 여부에 따른 버튼 제어
                    if (guestButtons.includes(item.componentId)) return !isLoggedIn;
                    if (userButtons.includes(item.componentId)) return isLoggedIn;
                    // console.log('usePageMetadata',item);
                    // 수정하기 버튼 권한 체크 (내 글일 때만)
                    if (item.componentId === "go_modify_btn") {
                        // pageData 루트에 풀린 작성자 ID와 현재 로그인 ID 비교
                        return isLoggedIn && String(user?.userId) === String(pageData?.user_id);
                    }

                    // 데이터 소스는 화면 렌더링에서 제외
                    if (item.componentType === "DATA_SOURCE" || item.component_type === "DATA_SOURCE") {
                        return false;
                    }

                    return true;
                });
        };
        return filterRecursive(metadata);
    }, [metadata, isLoggedIn, user, pageData, showPassword]);
    const getAllComponents = useCallback((items: any[]): any[] => {
        let res: any[] = [];
        items.forEach(item => {
            res.push(item);
            if (item.children) res = res.concat(getAllComponents(item.children));
        });
        return res;
    }, []);

// 날짜 포맷팅 함수 (YYYY-MM-DD HH:mm)
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    useEffect(() => {
        const fetchBusinessData = async () => {
            if (!metadata || metadata.length === 0) return;

            if (isLoggedIn && finalScreenId?.includes("LOGIN_PAGE")) {
                router.push("/view/MAIN_PAGE");
                return;
            }

            setLoading(true);
            try {
                const allComponents = getAllComponents(metadata);
                const sources = allComponents.filter((item: any) =>
                    (item.componentType === "DATA_SOURCE" || item.component_type === "DATA_SOURCE") &&
                    (item.actionType === "AUTO_FETCH" || item.action_type === "AUTO_FETCH")
                );

                const dataPromises = sources.map(async (source: any) => {
                    let apiUrl = source.dataApiUrl || source.data_api_url;

                    // 수정: apiUrl에 diaryId를 붙이지 않고, sqlKey 기반 URL만 유지
                    if (source.dataSqlKey || source.data_sql_key) {
                        apiUrl = `/api/execute/${source.dataSqlKey || source.data_sql_key}`;
                    }

                    const compId = source.componentId || source.component_id;
                    // if (compId === "diary_list_source" && isOnlyMine) {
                        // apiUrl = "/api/diary/member-diaries";
                        // apiUrl = ""
                    // }
                    if (!apiUrl) return { id: source.componentId, data: [] };

                    const rawParams = source.dataParams || source.data_params || "{}";
                    const parsedParams = typeof rawParams === 'string' ? JSON.parse(rawParams) : rawParams;

                    // 모든 파라미터를 finalParams에 통합
                    const finalParams = {
                        ...parsedParams,
                        pageSize,
                        offset: (currentPage - 1) * pageSize,
                        filterId: isOnlyMine ? user?.userId : "",
                        userId: user?.userId || "guest",
                        userSqno: user?.userSqno,
                        diaryId: diaryId|| null //  (백엔드 :diaryId와 매핑)
                    };
                    // console.log('usePageMEtadata_diaryId',diaryId);
                    // console.log('usePageMEtadata_diaryId',finalParams);
                    let res;

                    // 상세 페이지 조회(GET_DIARY_DETAIL)도 이제 통합 컨트롤러에서 처리하므로 POST/GET 선택 가능
                    if (finalScreenId?.includes("DIARY_DETAIL") || isOnlyMine) {
                        res = await axios.get(apiUrl, { params: finalParams });
                    } else {
                        res = await axios.post(apiUrl, finalParams);
                    }

                    return {
                        id: source.componentId || source.component_id,
                        data: res.data.data || res.data
                    };
                });

                const results = await Promise.all(dataPromises);
                const combinedData: any = {};
                let detectedTotalCount = 0;
                results.forEach((res: any) => {
                    if (res && res.id) {
                        const isError = res.data && res.data.error;
                        const rawResponse = !isError ? res.data : null;

                        if (!rawResponse) {
                            combinedData[res.id] = [];
                            return;
                        }
                        // 1. 상세 페이지 데이터 처리 (단일 데이터 + 평탄화)
                        if (res.id === "diary_detail_source") {
                            const detailData = Array.isArray(rawResponse) ? rawResponse[0] : (rawResponse.data || rawResponse);

                            console.log('diary_detail_source',detailData);
                            if (detailData) {
                                // 공통 함수를 사용하여 jsonb 필드들을 일괄 파싱
                                const processedDetail = parseJsonbFields(detailData);
                                Object.assign(combinedData, processedDetail);

                                console.log('processedDetail',processedDetail);
                                console.log('processedDetail.selected_times',processedDetail.selected_times);


                                if (processedDetail.daily_slots && !Array.isArray(processedDetail.daily_slots)) {
                                    Object.assign(combinedData, processedDetail.daily_slots);
                                }
                                // if (processedDetail.selected_times) {
                                //     Object.assign(combinedData, processedDetail.selected_times);
                                // }

                                // 디버깅용 로그 (이게 보여야 성공이야)
                                console.log("Final combinedData for binding:", combinedData);
                            }
                        }

                        // 2. 목록 페이지 데이터 처리 (리스트 데이터)
                        else {
                            const realList = Array.isArray(rawResponse) ? rawResponse : (rawResponse.list || rawResponse.data || []);
                            console.log('realList',realList);

                            const unifiedList = realList.map((item: any) => {
                                // 리스트 내부의 각 아이템들도 jsonb 파싱 적용 (나중에 목록에서 필요할 수 있으니까)
                                const parsedItem = parseJsonbFields(item);

                                // 날짜 가공: T와 밀리초를 제거하고 가독성 있게 변경
                                const rawDate = parsedItem.regDt || parsedItem.reg_dt || "";
                                const formattedDate = rawDate ? rawDate.split('T')[0].replace(/-/g, '.') : "";

                                console.log('parsedItem',parsedItem);
                                return {
                                    ...parsedItem,
                                    diary_id: parsedItem.diaryId || parsedItem.diary_id,
                                    user_id: parsedItem.userId || parsedItem.user_id,
                                    reg_dt: formattedDate,
                                };
                            });

                            combinedData[res.id] = unifiedList;

                            // 페이징 카운트 로직 유지
                            if (res.id === "diary_list_source" || res.id === "diary_total_count") {
                                detectedTotalCount = rawResponse.total || rawResponse.totalCount || rawResponse.total_count ||
                                    (unifiedList[0] && (unifiedList[0].total_count || unifiedList[0].totalCount)) || 0;
                            }
                        }
                    }
                });

                setPageData(combinedData);
                setTotalCount(detectedTotalCount);
            } catch (error) {
                console.error("Data Fetching Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBusinessData();


    }, [metadata, finalScreenId, currentPage, isOnlyMine, diaryId, isLoggedIn, user, getAllComponents, router]);

    return {
        metadata: filteredMetadata,
        pageData,
        loading: loading || metaLoading ,
        totalCount,
        isLoggedIn
    };
};