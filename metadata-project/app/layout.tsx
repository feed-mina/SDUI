import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";// layout.tsx 수정
import "./globals.css";
import './styles/main.css';
import ReactQueryProvider from "@/components/providers/ReactQueryProvider"; // 방금 만든 방 가져오기
import RecordTimeComponent from "@/components/fields/RecordTimeComponent"
// (폰트나 메타데이터 설정은 그대로 두세요)

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