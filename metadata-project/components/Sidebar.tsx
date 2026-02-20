'use client';

import { useAuth } from "@/context/AuthContext";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { usePageActions } from "@/hooks/usePageActions";
import { usePathname } from 'next/navigation';
import { useMetadata } from "@/components/MetadataProvider";

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
    const { metadata, loading } = usePageMetadata(1, false, undefined, "GLOBAL_HEADER");

    const flatMeta = metadata ? flattenMetadata(metadata) : [];
    const { handleAction } = usePageActions(flatMeta);

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
                    JustSaying
                </div>
                <nav className="sidebar-nav">
                    <div className={`nav-item ${pathname === '/view/MAIN_PAGE' ? 'active' : ''}`} onClick={() => handleAction({actionType: 'ROUTE', actionUrl: '/view/MAIN_PAGE'})}>🏠 홈</div>
                    <div className="nav-item">📅 약속 관리</div>
                    <div className="nav-item">📊 통계</div>
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