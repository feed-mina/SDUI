import type { NextConfig } from "next";

const nextConfig: NextConfig = {async rewrites() {
        return [
            {
                source: '/api/:path*', // 브라우저에서 /api로 시작하는 요청을 보내면
                destination: 'http://localhost:8080/api/:path*', // 서버가 몰래 백엔드로 전달합니다.
            },
        ];
    },
};

export default nextConfig;
