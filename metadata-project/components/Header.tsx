'use client';

import { useAuth } from "@/context/AuthContext";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { usePageActions } from "@/hooks/usePageActions";
import RecordTimeComponent from "@/components/fields/RecordTimeComponent";
import { usePathname } from 'next/navigation';
//  트리 구조를 한 줄로 펴주는 유틸리티 함수
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
export default function Header() {

    //  헤더 컴포넌트 내부에 현재 경로를 가져오는 훅 추가
    const pathname = usePathname();

// 로그아웃 버튼을 숨길 경로 배열 선언 및 일치 여부 확인
    const hiddenLogoutPaths = ['/view/DIARY_WRITE', '/view/LOGIN_PAGE'];
    const isLogoutHidden = hiddenLogoutPaths.some(path => pathname?.includes(path));

// 로그인 버튼을 숨길 조건 추가
    const isLoginHidden = pathname?.includes('/view/LOGIN_PAGE');

    const { user, isLoggedIn } = useAuth();

    //  인자 순서를 (숫자, 불리언, 문자열/undefined, 문자열)로 맞춤
    const { metadata, loading: metaLoading } = usePageMetadata(1, false, undefined, "GLOBAL_HEADER");
// 검색하기 전에 평탄화된 리스트를 먼저 만든다
    const flatMeta = metadata ? flattenMetadata(metadata) : [];

    const { handleAction } = usePageActions(flatMeta);
// 3. useEffect도 조건문 위로 이동 [cite: 2026-02-16]
    const isRealLoggedIn = isLoggedIn && user?.isLoggedIn === true;
    // [수정] 인증 정보나 메타데이터가 로딩 중일 때는 빈 영역이나 스켈레톤을 보여준다

    if (metaLoading) return <div className="header-loading">로딩 중...</div>;
    const getVal = (obj: any, snake: string, camel: string) => {
        if (!obj) return "";
        return obj[snake] || obj[camel] || "";
    };
    // 3. 이제 평탄화된 리스트에서 찾으면 무조건 나온다

    const generalLogoutMeta = flatMeta.find(m =>
        getVal(m, 'component_id', 'componentId') === 'header_general_logout'
    );
    const kakaoLogoutMeta = flatMeta.find(m =>
        getVal(m, 'component_id', 'componentId') === 'header_kakao_logout'
    );
    const loginBtnMeta = flatMeta.find(m =>
        getVal(m, 'component_id', 'componentId') === 'header_login_btn'
    );
    console.log("검색 결과 확인:", { generalLogoutMeta, kakaoLogoutMeta, loginBtnMeta });
    console.log("user", user);

    return (
        <header className="common-header">
            <div className="header-contents">
                {/* 1. 로고: 항상 보여야 함 */}
                <div className="logo" onClick={() => handleAction({actionType: 'ROUTE', actionUrl: '/view/MAIN_PAGE'})}>
                    JustSaying
                </div>

                {/* 기록 컴포넌트: 비로그인 상태에서는 '로그인이 필요합니다' 등의 기본 문구 출력 */}
                <RecordTimeComponent />
            </div>
                {/* 로그인 여부에 따라 보여줄 버튼을 결정  */}
            <div className="auth-actions">
                {isRealLoggedIn ? (
                    // 로그인 상태이면서, 로그아웃 버튼 숨김 경로가 아닐 때만 노출
                    !isLogoutHidden && (
                        user?.socialType === 'K' ?(
                            kakaoLogoutMeta && (
                                <button className="kakao_logout_button" onClick={() => handleAction(kakaoLogoutMeta)}>
                                    {getVal(kakaoLogoutMeta, 'label_text', 'labelText')}
                                </button>
                            )
                        ) : (
                            generalLogoutMeta && (
                                <button className="logout_button" onClick={() => handleAction(generalLogoutMeta)}>
                                    {getVal(generalLogoutMeta, 'label_text', 'labelText')}
                                </button>
                            )
                        )
                    )
                ) : (
                    (!isLoginHidden && loginBtnMeta) && (
                        <button className="login_form_button" onClick={() => handleAction(loginBtnMeta)}>
                            {getVal(loginBtnMeta, 'label_text', 'labelText')}
                        </button>
                    )
                )}
            </div>
        </header>
    );
}