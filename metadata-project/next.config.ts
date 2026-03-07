import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const BACKEND_URL = isProd
    ? 'https://yerin.duckdns.org' // 실제 AWS 백엔드 도메인 입력 (lab 환경)
    : 'http://localhost:8080';

const nextConfig: NextConfig = {
    async redirects() {
        return [
            {
                source: '/',
                destination: '/view/MAIN_PAGE',
                permanent: false,
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${BACKEND_URL}/api/:path*`,
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://t1.daumcdn.net https://t1.daumcdn.net https://k.kakaocdn.net https://vercel.live https://*.vercel.app",  // Next.js + Daum API + Vercel Live
                            "style-src 'self' 'unsafe-inline'",                  // Tailwind 인라인 스타일 허용
                            "img-src 'self' data: data: blob: https: http://k.kakaocdn.net",                 // 외부 이미지 허용
                            "connect-src 'self' http://localhost:8080 http://43.201.237.68:8081 https://yerin.duckdns.org https://kauth.kakao.com https://kapi.kakao.com https://vercel.live https://*.vercel.app wss://ws-us3.pusher.com", // API 서버 + Vercel Live
                            "font-src 'self' data:",
                            "frame-src http://postcode.map.daum.net https://postcode.map.daum.net",  // Daum 우편번호 iframe
                            "object-src 'none'",
                            "frame-ancestors 'none'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;