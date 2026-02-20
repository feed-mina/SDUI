// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    transformIgnorePatterns: [
        "/node_modules/(?!(until-async|msw|@mswjs|@bundled-es-modules|swiper|ssr-window|dom7)/)"
    ],

    transform: {
        '^.+\\.(t|j)sx?|mjs$': ['@swc/jest'],
    },

    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^swiper/css$': 'identity-obj-proxy',
        '^swiper/css/(.*)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/$1',
        '^msw$': '<rootDir>/node_modules/msw',
    },

    testEnvironmentOptions: {
        customExportConditions: ['node', 'node-addons'],
    },
    // @@@@ 테스트 파일 경로 규칙 추가
    testMatch: [
        "<rootDir>/tests/**/*.(test|spec).(ts|tsx)",
        "<rootDir>/src/**/__tests__/**/*.(ts|tsx)"
    ],
    reporters: [
        "default",  // 터미널 출력을 위해 기본 리포터 유지
        ["jest-html-reporter", {
            "pageTitle": "메타데이터 테스트 리포트",
            // @@@@ 로그 폴더 지정: tests/logs 폴더 안에 생성되도록 설정
            "outputPath": "./tests/logs/frontend-report.html",
            "includeFailureMsg": true,
            "dateFormat": "yyyy-mm-dd HH:MM:ss"
        }],
        "<rootDir>/tests/CustomReporter.js" // 커스텀 리포터 추가
    ]
};