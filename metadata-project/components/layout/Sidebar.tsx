'use client';

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePageMetadata } from "@/components/DynamicEngine/hook/usePageMetadata";
import { usePathname } from 'next/navigation';
// 1. 기존 useMetadata 대신 useDeviceType 사용
import { useDeviceType } from "@/hooks/useDeviceType";
import { flattenMetadata } from "../utils/metadataUtils";
import {usePageHook} from "@/components/DynamicEngine/hook/usePageHook";

export default function Sidebar() {
    // 2. 일관된 기기 판별을 위해 수정
    const { isMobile } = useDeviceType();
    const isPc = !isMobile;

    const pathname = usePathname();
    const { user, isLoggedIn } = useAuth();

    // * 메타데이터를 가져옴
    const { metadata, pageData, loading: metaLoading } =  usePageMetadata("GLOBAL_HEADER",1, false, null);
    // * 통합 훅 사용  screenId는 "GLOBAL_HEADER"로 전달
    const { handleAction } = usePageHook("GLOBAL_HEADER", metadata, pageData);

    console.log('SIDEBAR METADATA: ', metadata, ' |')
    // 모든 컴포넌트를 한줄로 쭉 세워서 확인이 필요, 구조를 일렬로 펴줌
    const flatMeta = useMemo(() => flattenMetadata(metadata), [metadata]);

    // 4. 기기 판별 로직을 useDeviceType 기준으로 변경
    if (!isPc) return null;

    // 5. 로딩 중일 때는 버튼 영역을 비워두거나 스켈레톤을 보여준다.
    if (metaLoading) return <aside className="pc-sidebar-loading" />;

    const getVal = (obj: any, snake: string, camel: string) => obj?.[snake] || obj?.[camel] || "";
    const isRealLoggedIn = isLoggedIn && user?.isLoggedIn === true;

    // 버튼 찾기 로직
    const logoutMeta = flatMeta.find(m =>
        getVal(m, 'component_id', 'componentId') === (user?.socialType === 'K' ? 'header_kakao_logout' : 'header_general_logout')
    );
    const loginBtnMeta = flatMeta.find(m => getVal(m, 'component_id', 'componentId') === 'header_login_btn');
    console.log('sidebar logoutMeta', logoutMeta);
    console.log('sidebar loginBtnMeta', loginBtnMeta);

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
                         onClick={() => handleAction({actionType: 'ROUTE', actionUrl: '/view/SET_TIME_PAGE'})}>
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