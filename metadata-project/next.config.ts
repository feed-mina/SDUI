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
};

export default nextConfig;