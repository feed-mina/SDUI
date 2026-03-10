# QA Engineer — Mobile+Web Integration Plan (단계적 전환 방식)

**접근 방식**: Hybrid (Next.js 웹 유지 → Expo 모바일 추가 → 데이터 기반 통합 결정)
**작성일**: 2026-03-01
**담당**: QA Engineer Agent

---

## Research Analysis (연구 분석)

### 단계적 전환 테스트 전략

```
Phase 1 (Month 1-2): Next.js 웹 테스트
  → Jest + RTL + Playwright
  → 플랫폼 파라미터 검증
  → Visual Regression (768px breakpoint)

Phase 2 (Month 3-5): Expo 앱 테스트 추가
  → Jest + RNTL (단위 테스트)
  → Detox (E2E)
  → 웹/앱 병행 테스트

Phase 3 (Month 6): 통합 테스트
  → SEO 트래픽 분석
  → Expo Web 통합 시 웹 E2E 전환
```

---

## Implementation Plan (구현 계획)

### Phase 1: Next.js 웹 테스트 (Month 1-2)

#### 목표
- Backend API platform 파라미터 검증
- useDeviceType 768px 검증
- Visual Regression (모바일/데스크톱)

#### 1.1 플랫폼 감지 테스트

**파일**: `metadata-project/tests/platform_detection.test.tsx`

```typescript
test('sends mobile platform when width < 768px', async () => {
  global.innerWidth = 375;
  global.dispatchEvent(new Event('resize'));

  render(<MetadataProvider screenId="LOGIN_PAGE"><DynamicEngine /></MetadataProvider>);

  await waitFor(() => {
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('?platform=mobile'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Platform': 'mobile' })
      })
    );
  });
});
```

#### 1.2 Visual Regression (Percy)

```typescript
test('LOGIN_PAGE: mobile vs web', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await percySnapshot(page, 'LOGIN_PAGE - Mobile');

  await page.setViewportSize({ width: 1440, height: 900 });
  await percySnapshot(page, 'LOGIN_PAGE - Desktop');
});
```

#### Phase 1 완료 기준
- ✅ 단위 테스트 커버리지 > 80%
- ✅ E2E 테스트 통과 (Playwright)
- ✅ Visual Regression 통과

---

### Phase 2: Expo 앱 테스트 (Month 3-5)

#### 목표
- Expo 앱 단위 테스트 (Jest + RNTL)
- E2E 테스트 (Detox)
- 웹/앱 병행 테스트

#### 2.1 단위 테스트 (RNTL)

**파일**: `SDUI-expo-app/__tests__/DynamicEngine.test.tsx`

```typescript
import { render } from '@testing-library/react-native';

test('renders native components', () => {
  const metadata = [{ componentType: 'INPUT', componentId: 'email' }];
  const { getByTestId } = render(<DynamicEngine metadata={metadata} />);

  expect(getByTestId('input-email')).toBeTruthy();
});
```

#### 2.2 E2E 테스트 (Detox)

**파일**: `SDUI-expo-app/e2e/login.e2e.ts`

```typescript
describe('Login Flow', () => {
  it('should login and store token', async () => {
    await element(by.id('emailInput')).typeText('test@example.com');
    await element(by.id('passwordInput')).typeText('password123');
    await element(by.id('loginBtn')).tap();

    await waitFor(element(by.id('diaryListScreen'))).toBeVisible();
  });
});
```

#### Phase 2 완료 기준
- ✅ Expo 앱 단위 테스트 커버리지 > 80%
- ✅ Detox E2E 통과 (iOS/Android)
- ✅ 웹/앱 UI 일치 확인

---

### Phase 3: 통합 테스트 (Month 6)

#### 목표 (SEO 낮을 경우 Expo Web 통합)
- Expo Web E2E 테스트 전환
- Visual Regression (Expo Web)

#### 3.1 Expo Web E2E

```bash
# Expo Web 빌드 후 Playwright 테스트
npx expo export:web
npx playwright test
```

#### Phase 3 완료 기준
- ✅ Expo Web E2E 통과
- ✅ 웹/앱 통합 확인

---

## Test Matrix (테스트 매트릭스)

| Phase | Platform | Test Type | Tool |
|-------|----------|-----------|------|
| Phase 1 | Next.js Web | 단위 | Jest + RTL |
| Phase 1 | Next.js Web | E2E | Playwright |
| Phase 1 | Next.js Web | Visual | Percy |
| Phase 2 | Expo Mobile | 단위 | Jest + RNTL |
| Phase 2 | Expo Mobile | E2E | Detox |
| Phase 3 | Expo Web | E2E | Playwright |

---

## Security Regression Tests (보안 회귀 테스트)

```typescript
test('[CVE-001] /api/execute requires auth', async () => {
  const response = await fetch('/api/execute/GET_DIARY_LIST');
  expect(response.status).toBe(403);
});

test('[CVE-003] Rate limiting', async () => {
  for (let i = 0; i < 101; i++) {
    await fetch('/api/ui/LOGIN_PAGE');
  }
  const response = await fetch('/api/ui/LOGIN_PAGE');
  expect(response.status).toBe(429);
});
```

---

## Test Execution Strategy (실행 전략)

### Phase 1 (Month 1-2)
```bash
npm run test                # 단위 테스트
npx playwright test         # E2E
npx percy exec -- playwright test  # Visual
```

### Phase 2 (Month 3-5)
```bash
# Web
npm run test
npx playwright test

# Mobile
cd SDUI-expo-app && npm run test
detox test --configuration ios.sim.debug
```

### Phase 3 (Month 6)
```bash
# Expo Web 통합 시
npx expo export:web
npx playwright test
```

---

## Dependencies (의존성)

### Depends on
- 모든 역할 (구현 완료 후)

### Blocks
- 프로덕션 배포

---

## Success Metrics (성공 지표)

| Phase | 지표 | 목표 |
|-------|------|------|
| Phase 1 | 단위 테스트 커버리지 | > 80% |
| Phase 1 | E2E 통과율 | 100% |
| Phase 2 | 모바일 앱 크래시율 | < 1% |
| Phase 3 | 웹/앱 UI 일치도 | > 95% |

---

**다음 단계**: 프로덕션 배포 전 최종 검증
