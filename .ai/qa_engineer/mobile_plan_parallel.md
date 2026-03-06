# QA Engineer — Mobile+Web Integration Plan (병행 접근 방식)

**접근 방식**: Next.js 웹 + React Native 모바일 병행 운영
**작성일**: 2026-03-01
**담당**: QA Engineer Agent

---

## Research Analysis (연구 분석)

### 현재 테스트 환경

**Frontend**:
- Jest 29.7 + React Testing Library
- MSW 2.7 (API Mocking)
- Playwright 1.50 (E2E, 웹 전용)

**Backend**:
- JUnit 5 + Spring Boot Test
- MockMvc (API 통합 테스트)

### 병행 접근 방식 테스트 전략

```
웹 (Next.js):
  - Jest + RTL (단위 테스트)
  - MSW (API Mocking)
  - Playwright (E2E)

모바일 앱 (React Native):
  - Jest + RNTL (단위 테스트)
  - MSW (API Mocking)
  - Detox (E2E)

공통:
  - Backend JUnit 5 (API 테스트)
  - Percy (Visual Regression)
```

---

## Implementation Plan (구현 계획)

### 1. 테스트 매트릭스

#### 차원
- **Platform**: web(desktop), web(mobile), mobile(iOS), mobile(Android)
- **Role**: GUEST, USER, ADMIN
- **Screen**: LOGIN_PAGE, DIARY_LIST, DIARY_WRITE, DIARY_DETAIL

**총 조합**: 4 × 3 × 4 = **48 test scenarios**

#### 우선순위

| 우선순위 | 조합 | 테스트 방법 |
|---------|------|------------|
| P0 | web(desktop) + USER + LOGIN_PAGE | Playwright E2E |
| P0 | mobile(iOS) + USER + LOGIN_PAGE | Detox E2E |
| P1 | web(mobile) + USER + DIARY_LIST | Playwright E2E |
| P1 | mobile(Android) + USER + DIARY_WRITE | Detox E2E |
| P2 | 나머지 조합 | Smoke Test |

---

### 2. 단위 테스트 (Jest)

#### 2.1 Web 플랫폼 감지

**파일**: `metadata-project/tests/platform_detection.test.tsx`

```typescript
import { render, waitFor } from '@testing-library/react';
import { MetadataProvider } from '@/components/providers/MetadataProvider';
import { DynamicEngine } from '@/components/DynamicEngine/DynamicEngine';
import mockAxios from 'jest-mock-axios';

describe('Platform Detection (Web)', () => {
  test('sends mobile platform when viewport < 768px', async () => {
    // Given: 모바일 뷰포트
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));

    // When: DynamicEngine 렌더링
    render(
      <MetadataProvider screenId="LOGIN_PAGE">
        <DynamicEngine />
      </MetadataProvider>
    );

    // Then: platform=mobile 파라미터 전송
    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('?platform=mobile'),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Platform': 'mobile' })
        })
      );
    });
  });

  test('sends web platform when viewport >= 768px', async () => {
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));

    render(
      <MetadataProvider screenId="LOGIN_PAGE">
        <DynamicEngine />
      </MetadataProvider>
    );

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('?platform=web')
      );
    });
  });
});
```

#### 2.2 API 플랫폼 파라미터

**파일**: `metadata-project/tests/api_platform_response.test.tsx`

```typescript
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/ui/:screenId', (req, res, ctx) => {
    const platform = req.url.searchParams.get('platform');
    const xPlatform = req.headers.get('X-Platform');

    // 플랫폼 불일치 감지
    if (platform !== xPlatform) {
      return res(ctx.status(400));
    }

    const mobileMetadata = [
      {
        componentId: 'btn',
        cssClass: 'content-btn-mobile',
        componentProps: { minHeight: 48 }
      }
    ];

    const webMetadata = [
      {
        componentId: 'btn',
        cssClass: 'content-btn',
        componentProps: { minHeight: 40 }
      }
    ];

    return res(
      ctx.json({
        success: true,
        data: platform === 'mobile' ? mobileMetadata : webMetadata
      })
    );
  })
);

test('returns mobile-specific props when platform=mobile', async () => {
  global.innerWidth = 375;
  render(<DynamicEngine screenId="LOGIN_PAGE" />);

  await waitFor(() => {
    const button = screen.getByRole('button');
    expect(button).toHaveClass('content-btn-mobile');
  });
});
```

#### 2.3 Mobile 컴포넌트 테스트 (RNTL)

**파일**: `SDUIMobileApp/__tests__/DynamicEngine.test.tsx`

```typescript
import { render } from '@testing-library/react-native';
import DynamicEngine from '../src/components/DynamicEngine/DynamicEngine';

describe('DynamicEngine (React Native)', () => {
  test('renders native DatePicker component', () => {
    const metadata = [
      {
        componentType: 'DATETIME_PICKER',
        componentId: 'date1',
        labelText: 'Select Date'
      }
    ];

    const { getByTestId, getByText } = render(
      <DynamicEngine metadata={metadata} screenId="TEST" />
    );

    expect(getByText('Select Date')).toBeTruthy();
    expect(getByTestId('native-date-picker')).toBeTruthy();
  });

  test('uses SecureStore for JWT storage', async () => {
    const mockSecureStore = jest.spyOn(SecureStore, 'getItemAsync');
    mockSecureStore.mockResolvedValue('mock-token');

    await api.get('/api/ui/LOGIN_PAGE');

    expect(mockSecureStore).toHaveBeenCalledWith('accessToken');
  });
});
```

---

### 3. E2E 테스트

#### 3.1 Web E2E (Playwright)

**파일**: `metadata-project/tests/e2e/mobile_web_parity.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Mobile/Web Parity', () => {
  test('LOGIN_PAGE: mobile layout (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/view/LOGIN_PAGE');

    const container = page.locator('.engine-container');
    await expect(container).toHaveClass(/is-mobile/);

    // 터치 타겟 크기 검증
    const submitBtn = page.locator('button[type="submit"]');
    const box = await submitBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
  });

  test('DIARY_LIST: grid layout on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/view/DIARY_LIST');

    const grid = page.locator('.diary-list-grid');
    const gridTemplate = await grid.evaluate((el) =>
      window.getComputedStyle(el).gridTemplateColumns
    );

    expect(gridTemplate).toContain('1fr 1fr 1fr'); // 3열
  });

  test('Breakpoint transition at 768px', async ({ page }) => {
    // 767px: mobile layout
    await page.setViewportSize({ width: 767, height: 1024 });
    await page.goto('/view/MAIN_PAGE');
    let layout = page.locator('.flex-row-layout-mobile');
    await expect(layout).toHaveCSS('flex-direction', 'column');

    // 768px: desktop layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(layout).toHaveCSS('flex-direction', 'row');
  });
});
```

#### 3.2 Mobile E2E (Detox)

**파일**: `SDUIMobileApp/e2e/login.e2e.ts`

```typescript
describe('Login Flow (Mobile App)', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen', async () => {
    await expect(element(by.id('emailInput'))).toBeVisible();
    await expect(element(by.id('passwordInput'))).toBeVisible();
  });

  it('should login with Bearer token', async () => {
    await element(by.id('emailInput')).typeText('test@example.com');
    await element(by.id('passwordInput')).typeText('password123');
    await element(by.id('loginSubmitBtn')).tap();

    // JWT가 SecureStore에 저장되었는지 확인
    await waitFor(element(by.id('diaryListScreen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should handle 401 with token refresh', async () => {
    // Expire access token
    await device.sendUserNotification({ trigger: 'expire_token' });

    await element(by.id('diaryListScreen')).tap();

    // 자동 refresh 후 재시도
    await waitFor(element(by.id('diaryCard-1'))).toBeVisible();
  });
});
```

---

### 4. Visual Regression Testing (Percy)

**파일**: `metadata-project/tests/visual/mobile_web_snapshot.spec.ts`

```typescript
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression', () => {
  test('LOGIN_PAGE: mobile vs web', async ({ page }) => {
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/view/LOGIN_PAGE');
    await percySnapshot(page, 'LOGIN_PAGE - Mobile');

    // Web
    await page.setViewportSize({ width: 1440, height: 900 });
    await percySnapshot(page, 'LOGIN_PAGE - Web');
  });

  test('DIARY_LIST: grid vs list', async ({ page }) => {
    // Mobile: list layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/view/DIARY_LIST');
    await percySnapshot(page, 'DIARY_LIST - Mobile List');

    // Web: grid layout
    await page.setViewportSize({ width: 1440, height: 900 });
    await percySnapshot(page, 'DIARY_LIST - Web Grid');
  });
});
```

---

### 5. 보안 회귀 테스트

**파일**: `metadata-project/tests/security_regression.test.tsx`

```typescript
describe('Security Regression Tests', () => {
  test('[CVE-001] /api/execute requires authentication', async () => {
    const response = await fetch('/api/execute/GET_DIARY_LIST', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status).toBe(403); // ✅ permitAll() 제거됨
  });

  test('[CVE-002] Platform header mismatch logs warning', async () => {
    const logSpy = jest.spyOn(console, 'warn');

    await fetch('/api/ui/LOGIN_PAGE?platform=web', {
      headers: { 'X-Platform': 'mobile' } // 불일치
    });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Platform mismatch')
    );
  });

  test('[CVE-003] Rate limiting blocks excessive requests', async () => {
    for (let i = 0; i < 101; i++) {
      await fetch('/api/ui/LOGIN_PAGE');
    }

    const response = await fetch('/api/ui/LOGIN_PAGE');
    expect(response.status).toBe(429); // Too Many Requests
  });
});
```

---

### 6. Backend API 테스트 (JUnit 5)

**파일**: `SDUI-server/src/test/java/com/domain/demo_backend/domain/ui/controller/UiControllerIntegrationTest.java`

```java
@SpringBootTest
@AutoConfigureMockMvc
class UiControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    void getUiMetadata_withBearerToken_returnsSuccess() throws Exception {
        User testUser = new User("test@example.com", "ROLE_USER");
        String token = jwtUtil.createAccessToken(testUser);

        mockMvc.perform(get("/api/ui/LOGIN_PAGE")
                .param("platform", "mobile")
                .header("Authorization", "Bearer " + token)
                .header("X-Platform", "mobile"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data[0].componentProps").exists());
    }

    @Test
    void getUiMetadata_withoutAuth_returns403() throws Exception {
        mockMvc.perform(get("/api/ui/LOGIN_PAGE"))
            .andExpect(status().isForbidden());
    }

    @Test
    void executeApi_withoutAuth_returns403() throws Exception {
        // CVE-001 수정 검증
        mockMvc.perform(post("/api/execute/GET_DIARY_LIST"))
            .andExpect(status().isForbidden());
    }

    @Test
    void rateLimiting_exceedsLimit_returns429() throws Exception {
        for (int i = 0; i < 101; i++) {
            mockMvc.perform(get("/api/ui/LOGIN_PAGE"));
        }

        mockMvc.perform(get("/api/ui/LOGIN_PAGE"))
            .andExpect(status().isTooManyRequests());
    }
}
```

---

## Test Execution Strategy (실행 전략)

### Phase 1: 단위 테스트 (매 커밋)
```bash
# Web
npm run test -- tests/platform_detection.test.tsx

# Mobile
cd SDUIMobileApp && npm run test
```

### Phase 2: 통합 테스트 (PR 시)
```bash
npm run test:integration
./gradlew test --tests "com.domain.demo_backend.domain.ui.*"
```

### Phase 3: E2E 테스트 (스테이징 배포 후)
```bash
# Web
npx playwright test tests/e2e/

# Mobile (iOS)
detox test --configuration ios.sim.debug

# Mobile (Android)
detox test --configuration android.emu.debug
```

### Phase 4: Visual Regression (릴리스 전)
```bash
npx percy exec -- playwright test tests/visual/
```

### Phase 5: 보안 회귀 (릴리스 전)
```bash
npm run test:security
```

---

## Test Report (테스트 리포트)

### 자동 생성

**파일**: `metadata-project/tests/logs/frontend-report.html`

```typescript
// jest.config.ts
module.exports = {
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Frontend Test Report',
      outputPath: 'tests/logs/frontend-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
    }],
  ],
};
```

---

## Security Considerations (보안 고려사항)

### 1. 테스트 데이터 격리
- 모바일/웹 테스트 간 DB 상태 충돌 방지
- 트랜잭션 롤백 (`@Transactional`)

### 2. Mock API 키
- 테스트 환경에서 실제 카카오 OAuth 키 사용 금지
- `.env.test` 파일에 Mock 키 설정

### 3. CI/CD 보안
- 테스트 로그에 JWT 토큰 노출 방지
- 민감 정보 마스킹

---

## Dependencies (의존성)

### Depends on
- 모든 다른 역할 (구현 완료 후 테스트 시작)

### Blocks
- 프로덕션 배포 (모든 테스트 통과 필수)

---

## Success Metrics (성공 지표)

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 단위 테스트 커버리지 | > 80% | Jest coverage report |
| E2E 테스트 통과율 | 100% | Playwright/Detox |
| Visual Regression | < 5% 차이 | Percy |
| 보안 회귀 | 0 CRITICAL | Security test suite |

---

**다음 단계**: 프로덕션 배포 전 최종 테스트 실행
