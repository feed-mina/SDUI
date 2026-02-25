'use client';

import { useMemo } from "react"; // 추가
import { useAuth } from "@/context/AuthContext";
import { usePageMetadata } from "@/components/DynamicEngine/hook/usePageMetadata";
import { usePageActions } from "@/components/DynamicEngine/hook/usePageActions";
import { usePathname } from 'next/navigation';
import { useMetadata } from "@/components/providers/MetadataProvider";

// [수정 1] 고정된 빈 배열 선언 (참조값 유지용)
const EMPTY_ARRAY: any[] = [];

const flattenMetadata = (items: any[]): any[] => {
    let flat: any[] = [];
    items.forEach(item => {
        flat.push(item);
        if (item.children) flat = flat.concat(flattenMetadata(item.children));
    });
    return flat;
};

export default function Sidebar() {
    const { isDesktop } = useMetadata();
    const pathname = usePathname();
    const { user, isLoggedIn } = useAuth();

    // [수정 2] 전역 헤더 데이터 가져오기
    const { metadata, loading } = usePageMetadata("GLOBAL_HEADER", 1, false);

    // [수정 3] flatMeta를 useMemo로 감싸서 metadata가 바뀔 때만 재계산함
    const flatMeta = useMemo(() => {
        return metadata ? flattenMetadata(metadata) : EMPTY_ARRAY;
    }, [metadata]);

    const { handleAction } = usePageActions(flatMeta);

    // [중요] 훅 호출이 끝난 후 조건부 리턴
    if (!isDesktop) return null;

    const getVal = (obj: any, snake: string, camel: string) => obj?.[snake] || obj?.[camel] || "";
    const isRealLoggedIn = isLoggedIn && user?.isLoggedIn === true;

    const logoutMeta = flatMeta.find(m =>
        getVal(m, 'component_id', 'componentId') === (user?.socialType === 'K' ? 'header_kakao_logout' : 'header_general_logout')
    );
    const loginBtnMeta = flatMeta.find(m => getVal(m, 'component_id', 'componentId') === 'header_login_btn');

    return (
        <aside className="pc-sidebar">
            <div className="sidebar-top">
                <div className="sidebar-logo" onClick={() => handleAction({actionType: 'ROUTE', actionUrl: '/view/MAIN_PAGE'})}>
                    SDUI Project
                </div>
                <nav className="sidebar-nav">
                    <div className={`nav-item ${pathname === '/view/MAIN_PAGE' ? 'active' : ''}`}
                         onClick={() => handleAction({actionType: 'ROUTE', actionUrl: '/view/MAIN_PAGE'})}>
                        🏠 홈
                    </div>
                    <div className={`nav-item ${pathname === '/view/SET_TIME_PAGE' ? 'active' : ''}`}
                         onClick={() => handleAction({actionType: 'ROUTE', actionUrl: '/view/MAIN_PAGE'})}>
                        📅 약속 관리
                    </div>
                    {/*<div className="nav-item">📊 통계</div>*/}
                </nav>
            </div>
            <div className="sidebar-footer">
                {isRealLoggedIn ? (
                    logoutMeta && (
                        <button className="sidebar-auth-btn" onClick={() => handleAction(logoutMeta)}>
                            {getVal(logoutMeta, 'label_text', 'labelText')}
                        </button>
                    )
                ) : (
                    loginBtnMeta && (
                        <button className="sidebar-auth-btn login" onClick={() => handleAction(loginBtnMeta)}>
                            {getVal(loginBtnMeta, 'label_text', 'labelText')}
                        </button>
                    )
                )}
            </div>
        </aside>
    );
}