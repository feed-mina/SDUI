import {useEffect, useState, useCallback} from "react";
import {useRouter} from "next/navigation";
import axios from "@/services/axios";
import { useAuth } from "@/context/AuthContext";
import { useMetadata } from "@/components/MetadataProvider";


//  @@@@ usePageMetadata 역할 : 메타데이터가져오기 , 원본 데이터 가져오기 , 가져온 데이터를 pageData로 담아줌, 로딩중인지 전체 개수가 몇개인지 같은 페이지의 전역 상태를 관리
export const usePageMetadata = ( currentPage: number, isOnlyMine: boolean, diaryId?: string, overrideScreenId?: string) => {
    const router = useRouter(); // window.location.href 대신 사용

    const { user, isLoggedIn } = useAuth();
    // 1. Provider에서 이미 로드된 메타데이터와 가공된 screenId(예: USER_MAIN), 실제 메타데이터(menuTree)를 가져옴
    const { menuTree, isLoading: metaLoading, screenId: providerScreenId } = useMetadata();
    const [metadata, setMetadata] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageData, setPageData] = useState<any>({});
    const [loading, setLoading] = useState(true);

    // 2. 외부에서 주입된 screenId가 있으면 그것을 우선 사용
    const finalScreenId = overrideScreenId || providerScreenId;

    // 3. Provider의 데이터가 변경되면 로컬 metadata 상태에 동기화
    useEffect(() => {
        if (menuTree && menuTree.length > 0) {
            setMetadata(menuTree);
        }
    }, [menuTree]);

    const pageSize = 5; // 한 페이지당 보여줄 개수

    // 트리 구조 평탄화 함수 (DATA_SOURCE가 어디 있든 찾아냄)
    const getAllComponents = useCallback((items: any[]): any[] => {
        let res: any[] = [];
        items.forEach(item => {
            res.push(item);
            if (item.children) res = res.concat(getAllComponents(item.children));
        });
        return res;
    }, []);
    const currentUserId = user?.userId || "";
    const currentUserSqno = user?.userSqno || "";
    useEffect(() => {
        const fetchBusinessData = async () => {
            // metadata가 비어있으면 로직 실행 안 함
            if (!metadata || metadata.length === 0) return;
            // 2. 로그인 체크 로직 (필요 시 유지)

            if (isLoggedIn && finalScreenId?.includes("LOGIN_PAGE")) {
                router.push("/view/MAIN_PAGE");
                return;
            }

            setLoading(true);
            try {
                // 3. 메타데이터에서 DATA_SOURCE 추출
                const allComponents = getAllComponents(metadata);
                const sources = allComponents.filter((item: any) =>
                    (item.componentType === "DATA_SOURCE" || item.component_type === "DATA_SOURCE") &&
                    (item.actionType === "AUTO_FETCH" || item.action_type === "AUTO_FETCH")
                );

                const dataPromises = sources.map(async (source: any) => {
                    // API URL 결정 로직 (Role 접두사가 붙은 screenId 기반으로 분기 가능)
                    let apiUrl = source.dataApiUrl || source.data_api_url;

                    if (finalScreenId?.includes("DIARY_DETAIL") && diaryId) {
                        apiUrl = `${apiUrl}/${diaryId}`;
                    } else if (source.dataSqlKey || source.data_sql_key) {
                        apiUrl = `/api/execute/${source.dataSqlKey || source.data_sql_key}`;
                    }

                    if (source.componentId === "diary_list_source" && isOnlyMine) {
                        apiUrl = "/api/diary/member-diaries";
                    }

                    if (!apiUrl) return { id: source.componentId, data: [] };

                    // 파라미터 구성
                    const rawParams = source.dataParams || source.data_params || "{}";
                    const parsedParams = typeof rawParams === 'string' ? JSON.parse(rawParams) : rawParams;

                    const finalParams = {
                        ...parsedParams,
                        pageSize,
                        offset: (currentPage - 1) * pageSize,
                        filterId: isOnlyMine ? user?.userId : "",
                        userId: user?.userId || "guest",
                        userSqno: user?.userSqno
                    };

                    let res;
                    if (finalScreenId?.includes("DIARY_DETAIL") || (isOnlyMine && source.componentId === "diary_list_source")) {
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
                        const rawResponse = res.data || {};
                        const realList = Array.isArray(rawResponse) ? rawResponse :
                            (rawResponse.list || rawResponse.data || [rawResponse]);

                        // 필드 매핑 (Snake Case <-> Camel Case 통일)
                        const unifiedList = realList.map((item: any) => ({
                            ...item,
                            diary_id: item.diaryId || item.diary_id,
                            user_id: item.userId || item.user_id,
                            reg_dt: item.regDt || item.reg_dt || ""
                        }));

                        combinedData[res.id] = unifiedList;

                        // Total Count 계산
                        if (res.id === "diary_list_source" || res.id === "diary_total_count") {
                            detectedTotalCount = rawResponse.total || rawResponse.totalCount || rawResponse.total_count || unifiedList[0]?.total_count || 0;
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
    }, [metadata, finalScreenId, currentPage, isOnlyMine, diaryId, isLoggedIn, user, getAllComponents]);

    return {
        metadata,
        pageData,
        loading: loading || metaLoading ,
        totalCount,
        isLoggedIn
    };
};