import {useRouter} from "next/navigation";
import axios from "@/services/axios";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext"; // 1. AuthContext 가져오기
import { useBaseActions } from "./useBaseActions";
import { flattenMetadata } from "../..//utils/metadataUtils";

export const useBusinessActions = (screenId: string,metadata: any[] = [], initialData: any = {}) => {
    const base = useBaseActions(screenId, metadata, initialData); // screenId 추가 [cite: 2026-02-17]
    const router = useRouter();
    // queryClient 선언 (캐시 조작을 위해 필요)
    const queryClient = useQueryClient();
    const flatMeta = useMemo(() => flattenMetadata(metadata), [metadata]);

    const handleAction = useCallback(async (meta: any, data?: any) => {

        const info = base.getMetaInfo(meta);
        if (!info) return;

        const { actionType, actionUrl, dataSqlKey, currentData } = info;

        switch (actionType) {
            case "LINK":
            case "ROUTE":
                if (!actionUrl) {
                    console.warn("이동할 URL이 없습니다.");
                    return;
                }
                // 외부 링크(http)인 경우와 내부 경로 구분
                if (actionUrl.startsWith('http')) {
                    window.location.href = actionUrl;
                } else {
                    router.push(actionUrl);
                    // 페이지 이동 후 필요시 데이터 갱신
                    router.refresh();
                }
                break;
            case "SUBMIT": {

                const allComponents = flatMeta;
                //  데이터 필터링 정제값
                const submitData = { ...currentData };
                // 수정 모드 시 URL에서 ID 추출 (이전 로직 유지)
                const pathParts = window.location.pathname.split('/');
                const idFromUrl = pathParts[pathParts.length - 1];
                if (/^\d+$/.test(idFromUrl)) {
                    submitData.diary_id = idFromUrl;
                }

                // 필수값 검증
                const requiredFields = allComponents.filter((m: any) =>
                    m.isRequired || m.is_required === "true" || m.is_required === true
                );
                for (const field of requiredFields) {
                    const fieldId = field.componentId || field.component_id;
                    if (!submitData[fieldId]) {
                        alert(`${field.labelText || field.label_text || fieldId}은(는) 필수입니다.`);
                        return;
                    }
                }


                const finalUrl = dataSqlKey ? `/api/execute/${dataSqlKey}` : actionUrl;
                try {
                    const response = await axios.post(finalUrl, submitData);
                    if (response.status === 200 || response.status === 201) {

                        // 시간 저장 API인 경우 관련 캐시 무효화
                        // URL에 goalTime이 포함되어 있다면 헤더의 데이터를 새로고침하도록 지시함
                        if (finalUrl.includes('goalTime')) {
                            await queryClient.invalidateQueries({ queryKey: ['goalTime'] });
                            await queryClient.invalidateQueries({ queryKey: ['goalList'] });
                        }

                        router.push("/view/DIARY_LIST");
                    }
                } catch (error) {
                    console.error("Business Submit Error:", error);
                }
                break;
            }
            case "ROUTE_MODIFY":
            case "ROUTE_DETAIL":
                const baseActionUrl = meta.actionUrl || meta.action_url;
                if (!data) {
                    console.error(`${actionType} 액션 실행 실패: 데이터가 없습니다.`);
                    return;
                }
                const diaryId = data.diary_id || data.diaryId;
                if (diaryId && baseActionUrl) {// /view/DIARY_MODIFY/34 형태로 URL 생성
                    const finalPath = baseActionUrl.endsWith('/')
                        ? `${baseActionUrl}${diaryId}`
                        : `${baseActionUrl}/${diaryId}`;
                    router.push(finalPath);
                } else {
                    console.warn("이동할 경로 또는 ID가 데이터에 없습니다.", { baseActionUrl, diaryId });
                }break;
            default:
                break;
        }
    }, [base, metadata, router]);

    return { ...base, handleAction };
};