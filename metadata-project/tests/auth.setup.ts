import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // 1. 로그인 페이지 이동
    await page.goto('/api/auth/login'); // 실제 로그인 페이지 주소로 수정

    // 2. 로그인 수행 (예시: 카카오나 자체 로그인)
    await page.fill('input[name="username"]', 'testUser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 3. 로그인 완료 대기 (URL 변화나 특정 요소 확인)
    await page.waitForURL('**/');

    // 4. 인증 상태(쿠키, 로컬스토리지)를 파일로 저장
    await page.context().storageState({ path: authFile });
});