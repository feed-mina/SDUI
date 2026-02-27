'use client';

import { useAuth } from "@/context/AuthContext";
import { usePageMetadata } from "@/components/DynamicEngine/hook/usePageMetadata";
import RecordTimeComponent from "@/components/fields/RecordTimeComponent";
import { usePathname } from 'next/navigation';
import { useMetadata } from "@/components/providers/MetadataProvider";
import { useMemo } from "react";
import { flattenMetadata } from "../utils/metadataUtils";
import Skeleton from "@/components/utils/Skeleton";
import {usePageHook} from "@/components/DynamicEngine/hook/usePageHook";


export default function Header() {
    // 1. 모든 훅은 최상단에서 무조건 실행되어야 함
    const pathname = usePathname();
    const { user, isLoggedIn } = useAuth();

    // * 메타데이터를 가져옴
    const { metadata, pageData, loading: metaLoading } =  usePageMetadata("GLOBAL_HEADER",1, false, null);

    // * 통합 훅 사용  screenId는 "GLOBAL_HEADER"로 전달
    const { handleAction } = usePageHook("GLOBAL_HEADER", metadata, pageData);
    // * 모든 컴포넌트를 한줄로 쭉 세워서 확인이 필요, 구조를 일렬로 펴줌
    const flatMeta = useMemo(() => flattenMetadata(metadata), [metadata]);

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
                                    <h1> 카카오 LOGIN </h1>
                                    // <button className="mobile-kakao-logout" onClick={() => handleAction(kakaoLogoutMeta)}>
                                    //     {getVal(kakaoLogoutMeta, 'label_text', 'labelText')}
                                    // </button>
                                )
                            ) : (
                                generalLogoutMeta && (
                                    <h1> 일반 LOGIN </h1>
                                    // <button className="mobile-general-logout" onClick={() => handleAction(generalLogoutMeta)}>
                                    //     {getVal(generalLogoutMeta, 'label_text', 'labelText')}
                                    // </button>
                                )
                            )
                        )
                    ) : (
                        (!isLoginHidden && loginBtnMeta) && (
                            <h1> Not LOGIN </h1>
                            // <button className="mobile-login-btn" onClick={() => handleAction(loginBtnMeta)}>
                            //     {getVal(loginBtnMeta, 'label_text', 'labelText')}
                            // </button>
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