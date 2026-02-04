import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";// layout.tsx 수정
import "./globals.css";      // 1. 가장 기본 (Tailwind 등)
import "./styles/common.css";   // 2. 공통 레이아웃
import "./styles/components.css"; // 3. 공통 부품
import "./styles/pages.css";    // 4. 페이지별 특수 스타일 (가장 우선순위 높음)
import ReactQueryProvider from "@/components/providers/ReactQueryProvider"; // 방금 만든 방 가져오기
import RecordTimeComponent from "@/components/fields/RecordTimeComponent"

export default function RootLayout({children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className="antialiased">
        {/* 주방 안에 안전하게 식탁 구역(Provider)을 설치합니다 */}
        <ReactQueryProvider>
        <RecordTimeComponent />
            <main>{children}</main>
        </ReactQueryProvider>
        </body>
        </html>
    );
}