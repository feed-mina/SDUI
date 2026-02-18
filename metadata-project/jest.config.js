const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    transformIgnorePatterns: [
        '/node_modules/(?!(swiper|ssr-window|dom7)/)',
    ],
    moduleNameMapper: {
        // CSS 파일 로드 에러 방지
        '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',
    },
};

module.exports = createJestConfig(customJestConfig);