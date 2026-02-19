'use client';

import React, {createContext, useContext, useMemo, ReactNode} from "react";
import {usePathname} from 'next/navigation';
import {DEFAULT_SCREEN_ID, SCREEN_MAP} from '@/components/constants/screenMap';
import {useQuery} from "@tanstack/react-query";
import {useAuth} from "@/context/AuthContext";

// @@@@ MetadataProvider 역할 : URL에서 직접 screenId를 추출하거나 매핑 테이블 활용, React Query 도입
interface MetadataContextType {
    menuTree: any[];
    isLoading: boolean;
    screenId: string;
}

const MetadataContext = createContext<MetadataContextType | undefined>(undefined);

export function MetadataProvider({children}: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();

    // 경로에 따른 screenId 결정 (렌더링 시점에 바로 계산), 경로 매핑 개선 - URL에서 직접 screenId를 추출하거나 매핑 테이블 활용
    const screenId = useMemo(() => {
        // 직접 매핑된 게 있으면 쓰고, 없으면 URL의 마지막 세그먼트를 시도
        if (SCREEN_MAP[pathname]) return SCREEN_MAP[pathname];
        const pathSegments = pathname.split('/').filter(Boolean);
        return pathSegments[pathSegments.length - 1] || DEFAULT_SCREEN_ID;
    }, [pathname]);

    // 유저 역할에 따른 동적 screenId 생성
    // ROLE_USER -> USER, ROLE_WORKER -> WORKER 식으로 변환
    const rolePrefix = user?.role?.replace('ROLE_', '') || 'GUEST';
    const dynamicScreenId = `${rolePrefix}_${screenId}`;

    //  React Query 도입
    const {data, isLoading} = useQuery({
        queryKey: ['metadata', dynamicScreenId],
        queryFn: async () => {
            const res = await fetch(`/api/ui/${screenId}`);
            if (!res.ok) throw new Error('Network response was not ok');
            const result = await res.json();
            // 백엔드 ApiResponse 구조가 { data: ... } 라면 result.data를 반환
            return result.data || [];
        },
        staleTime: 1000 * 60 * 5, // 5분 캐싱
        // enabled: !authLoading,
    });
    console.log('MP_data', data);

    return (
        // value에 useQuery의 data를 직접 할당하고, 반드시 {children}을 포함시킬 것
        <MetadataContext.Provider value={{
            menuTree: data || [], // 데이터가 없으면 빈 배열로 폴백
            isLoading,
            screenId: screenId
        }}>
            {children}
        </MetadataContext.Provider>
    );
}

export const useMetadata = () => {
    const context = useContext(MetadataContext);
    if (!context) throw new Error("useMetadata는 MetadataProvider 안에서 사용.");
    return context;
};