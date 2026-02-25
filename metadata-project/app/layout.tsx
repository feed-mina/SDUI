import "./styles/index.css";

import ReactQueryProvider from "@/components/providers/ReactQueryProvider"; // 방금 만든 방 가져오기
import {MetadataProvider} from "@/components/providers/MetadataProvider";
import { AuthProvider } from '@/context/AuthContext';
import AppShell from "@/components/layout/AppShell";
import Script from 'next/script';
//  @@@@ 2026-02-08 수정 MetadataProvider 적용
// layout.tsx 에 있는 컴포넌트들이 undefined 에러 없이 데이터를 안정적으로 받아오게 하는 API 흐름 설계
// @@@@ layout 역할 :  프론트앤드 전체 레이아웃 구조
export default function RootLayout({children}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
        <body className="antialiased">
        {/*   카카오 주소 API 스크립트 추가 */}
        <Script
            src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
            strategy="afterInteractive" // 인터랙티브해진 직후 로드 (성능 최적화)
        />


        {/* 가장 바깥에서 QueryClient를 공급한다 (식탁 차리기) */}
        <ReactQueryProvider>
            {/* screenId는 일단 전달하되, 나중에 URL 파라미터나 경로 기반으로 동적 처리할 것 */}
            <AuthProvider>
            <MetadataProvider>
                {/*<Header/>*/}
                {/* 유틸리티 컴포넌트는 데이터 흐름 안쪽, 하지만 UI 구조에 방해 안 되는 곳에 위치 */}
                <AppShell>
                    <main>{children}</main>
                </AppShell>
            </MetadataProvider>
            </AuthProvider>
        </ReactQueryProvider>
        </body>
        </html>
    );
}