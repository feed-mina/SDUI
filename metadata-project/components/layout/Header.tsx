'use client';

import { useAuth } from "@/context/AuthContext";
import { usePageMetadata } from "@/components/DynamicEngine/hook/usePageMetadata";
import { usePageActions } from "@/components/DynamicEngine/hook/usePageActions";
import RecordTimeComponent from "@/components/fields/RecordTimeComponent";
import { usePathname } from 'next/navigation';
import { useMetadata } from "@/components/providers/MetadataProvider";
import { useMemo } from "react";
import Skeleton from "@/components/utils/Skeleton";
const flattenMetadata = (items: any[]): any[] => {
    let flat: any[] = [];
    items.forEach(item => {
        flat.push(item);
        if (item.children && item.children.length > 0) {
            flat = flat.concat(flattenMetadata(item.children));
        }
    });
    return flat;
};

// [수정 1] 변하지 않는 빈 배열은 컴포넌트 외부에서 선언하여 참조값을 고정함
const EMPTY_ARRAY: any[] = [];
export default function Header() {
    // 1. 모든 훅은 최상단에서 무조건 실행되어야 함
    const { isDesktop } = useMetadata();
    const pathname = usePathname();
    const { user, isLoggedIn } = useAuth();
    const { metadata, loading: metaLoading } =  usePageMetadata("GLOBAL_HEADER",1, false);

    // [수정 2] flatten 결과물을 useMemo로 감싸서 metadata가 변하지 않는 한 참조를 유지함
    const flatMeta = useMemo(() =>
            metadata ? flattenMetadata(metadata) : EMPTY_ARRAY,
        [metadata]);

    const { handleAction } = usePageActions(flatMeta);

    const isRealLoggedIn = isLoggedIn && user?.isLoggedIn === true;
    const isLoginHidden = pathname?.includes('/view/LOGIN_PAGE');
    const hiddenLogoutPaths = ['/view/DIARY_WRITE', '/view/LOGIN_PAGE'];
    const isLogoutHidden = hiddenLogoutPaths.some(path => pathname?.includes(path));

    const getVal = (obj: any, snake: string, camel: string) => obj?.[snake] || obj?.[camel] || "";

    const generalLogoutMeta = flatMeta.find(m => getVal(m, 'component_id', 'componentId') === 'header_general_logout');
    const kakaoLogoutMeta = flatMeta.find(m => getVal(m, 'component_id', 'componentId') === 'header_kakao_logout');
    const loginBtnMeta = flatMeta.find(m => getVal(m, 'component_id', 'componentId') === 'header_login_btn');

    if (metaLoading) return <div className="header-loading"><Skeleton/></div>;

    return (
        <header className="mobile-header">
            <div className="header-top-row">
                <div className="logo" onClick={() => handleAction({actionType: 'ROUTE', actionUrl: '/view/MAIN_PAGE'})}>
                    SDUI Project
                </div>
                <div className="auth-actions">
                    {isRealLoggedIn ? (
                        !isLogoutHidden && (
                            user?.socialType === 'K' ? (
                                kakaoLogoutMeta && (
                                    <button className="mobile-kakao-logout" onClick={() => handleAction(kakaoLogoutMeta)}>
                                        {getVal(kakaoLogoutMeta, 'label_text', 'labelText')}
                                    </button>
                                )
                            ) : (
                                generalLogoutMeta && (
                                    <button className="mobile-general-logout" onClick={() => handleAction(generalLogoutMeta)}>
                                        {getVal(generalLogoutMeta, 'label_text', 'labelText')}
                                    </button>
                                )
                            )
                        )
                    ) : (
                        (!isLoginHidden && loginBtnMeta) && (
                            <button className="mobile-login-btn" onClick={() => handleAction(loginBtnMeta)}>
                                {getVal(loginBtnMeta, 'label_text', 'labelText')}
                            </button>
                        )
                    )}
                </div>
            </div>
            <div className="header-bottom-row">
                <RecordTimeComponent />
            </div>
        </header>
    );
}