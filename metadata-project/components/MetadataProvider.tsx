'use client';

import React, {createContext, useContext, useMemo, ReactNode, useState, useEffect} from "react";
import { usePathname, useParams } from 'next/navigation'; // @@@@ useParams 추가됨
import { DEFAULT_SCREEN_ID, SCREEN_MAP } from '@/components/constants/screenMap';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import SkeletonLoader from "@/components/SkeletonLoader";

interface MetadataContextType {
    menuTree: any[];
    isDesktop: boolean;
    isLoading: boolean;
    screenId: string;
}

const MetadataContext = createContext<MetadataContextType | undefined>(undefined);

interface MetadataProviderProps {
    children: ReactNode;
    screenId?: string; // 테스트용 주입 prop
}

export function MetadataProvider({ children, screenId: propScreenId }: MetadataProviderProps) {

    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024); // 초기 실행
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { user } = useAuth();
    const pathname = usePathname();
    const params = useParams();

    // 1. 최종 screenId 결정 로직 통합
    const finalScreenId = useMemo(() => {
        // 우선순위: 1. 직접 넘겨준 ID(테스트용) -> 2. URL 매핑 테이블 -> 3. URL 파라미터 -> 4. 기본값
        if (propScreenId) return propScreenId;


        // pathname이 /view/DIARY_DETAIL/22 라면 ['view', 'DIARY_DETAIL', '22']가 됨
        const pathSegments = pathname.split('/').filter(Boolean);

        // 'view' 다음에 오는 세그먼트(DIARY_DETAIL)를 우선적으로 screenId로 취급
        const viewIndex = pathSegments.indexOf('view');
        if (viewIndex !== -1 && pathSegments[viewIndex + 1]) {
            return pathSegments[viewIndex + 1];
        }

        return SCREEN_MAP[pathname] || DEFAULT_SCREEN_ID;
    }, [propScreenId, pathname]);

    // 2. 권한 정보 조합
    const rolePrefix = user?.role?.replace('ROLE_', '') || 'GUEST';
    const dynamicQueryKey = `${rolePrefix}_${finalScreenId}`;

    // 3. 데이터 페칭
    const { data, isLoading } = useQuery({
        queryKey: ['metadata', dynamicQueryKey],
        queryFn: async () => {
            // API 호출 시에는 원본 finalScreenId 사용
            const res = await fetch(`/api/ui/${finalScreenId}`);
            if (!res.ok) throw new Error('Network response was not ok');
            const result = await res.json();
            return result.data || [];
        },
        staleTime: 1000 * 60 * 5,
        enabled: !!finalScreenId, // ID가 확정되었을 때만 실행
    });

    if (isLoading) {
        return (
            <div className="page-container">
                <SkeletonLoader /> {/* 이전에 만든 전체 페이지용 스켈레톤 */}
            </div>
        );
    }

    return (
        <MetadataContext.Provider value={{
            menuTree: data || [],
            isDesktop,
            isLoading,
            screenId: finalScreenId
        }}>
            {children}
        </MetadataContext.Provider>
    );
}

export const useMetadata = () => {
    const context = useContext(MetadataContext);
    if (!context) throw new Error("useMetadata는 MetadataProvider 안에서 사용되어야 합니다.");
    return context;
};