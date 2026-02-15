import "./globals.css"; // 1. 가장 기본 (Tailwind 등)
import "./styles/common.css"; // 2. 공통 레이아웃
import "./styles/components.css"; // 3. 공통 부품
import "./styles/pages.css"; // 4. 페이지별 특수 스타일 (가장 우선순위 높음)
import "./styles/swap_inlinestyle.css" // 5. @@@@ 2026-02-07
import ReactQueryProvider from "@/components/providers/ReactQueryProvider"; // 방금 만든 방 가져오기
import RecordTimeComponent from "@/components/fields/RecordTimeComponent"
import {MetadataProvider} from "@/components/MetadataProvider";

//  @@@@ 2026-02-08 수정 MetadataProvider 적용
// layout.tsx 에 있는 컴포넌트들이 undefined 에러 없이 데이터를 안정적으로 받아오게 하는 API 흐름 설계
// @@@@ layout 역할 :  프론트앤드 전체 레이아웃 구조
export default function RootLayout({children}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
        <body className="antialiased">
        {/* 가장 바깥에서 QueryClient를 공급한다 (식탁 차리기) */}
        <ReactQueryProvider>
            {/* screenId는 일단 전달하되, 나중에 URL 파라미터나 경로 기반으로 동적 처리할 것 */}
            <MetadataProvider>
                {/*<Header/>*/}
                {/* 유틸리티 컴포넌트는 데이터 흐름 안쪽, 하지만 UI 구조에 방해 안 되는 곳에 위치 */}
                <RecordTimeComponent/>
                <main>{children}</main>
            </MetadataProvider>
        </ReactQueryProvider>
        </body>
        </html>
    );
}