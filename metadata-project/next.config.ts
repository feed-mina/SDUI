import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const BACKEND_URL = isProd
    ? 'http://43.201.237.68' // 실제 AWS 백엔드 도메인 입력
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
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js 개발 모드 + 런타임 허용
                            "style-src 'self' 'unsafe-inline'",                  // Tailwind 인라인 스타일 허용
                            "img-src 'self' data: blob: https:",                 // 외부 이미지 허용
                            "connect-src 'self' http://localhost:8080 http://43.201.237.68", // API 서버
                            "font-src 'self' data:",
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