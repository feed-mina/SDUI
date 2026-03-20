import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

export const metadata: Metadata = {
  title: "💜 BTS 광화문 현장 지도",
  description: "24시간 카페 · 핸드폰 충전 · 구급 텐트 · 지하철 귀가 루트 · CCTV 링크",
  openGraph: {
    title: "💜 BTS 광화문 현장 지도",
    description: "24시간 카페 · 핸드폰 충전 · 구급 텐트 · 지하철 귀가 루트",
    url: "https://bts-gwanghwamun.vercel.app",
    siteName: "BTS 광화문",
    images: [
      {
        url: "https://bts-gwanghwamun.vercel.app/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "💜 BTS 광화문 현장 지도",
    description: "24시간 카페 · 충전 · 구급 · 지하철 루트",
    images: ["https://bts-gwanghwamun.vercel.app/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full flex flex-col overflow-hidden">
        {children}
        {/* Kakao Maps SDK (window.kakao) */}
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services&autoload=false`}
          strategy="afterInteractive"
        />
        {/* Kakao JS SDK (window.Kakao) — for Share API */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
