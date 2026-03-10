# Designer — Mobile+Web Integration Plan (단계적 전환 방식)

**접근 방식**: Hybrid (Next.js 웹 유지 → Expo 모바일 추가 → 데이터 기반 통합 결정)
**작성일**: 2026-03-01
**담당**: Designer Agent

---

## Research Analysis (연구 분석)

### 단계적 전환 전략

Designer는 각 Phase마다 작업:

```
Phase 1 (Month 1-2): Next.js 웹 CSS 반응형 처리
  → Breakpoint 768px 표준화
  → 모바일 뷰포트 터치 타겟 48px

Phase 2 (Month 3-5): Expo StyleSheet 작성
  → React Native StyleSheet 생성
  → CSS → StyleSheet 변환 가이드

Phase 3 (Month 6): Expo Web 통합 (SEO 낮을 경우)
  → CSS 제거, StyleSheet로 완전 전환
```

---

## Implementation Plan (구현 계획)

### Phase 1: Next.js 웹 반응형 CSS (Month 1-2)

#### 목표
- Breakpoint 768px 표준화
- Modal 반응형 처리
- 터치 타겟 48px (모바일 뷰포트)

#### 1.1 Breakpoint 표준화

**파일**: `metadata-project/app/styles/layout.css`

```css
:root {
  --breakpoint-mobile: 768px;
  --breakpoint-desktop: 1024px;
  --touch-target-min: 48px;
}

.engine-container {
  padding: 16px; /* Mobile first */
}

@media (min-width: 768px) {
  .is-pc .engine-container {
    padding: 24px;
  }
}

@media (min-width: 1024px) {
  .is-pc .engine-container {
    max-width: 1100px;
    padding: 50px;
  }
}
```

#### 1.2 Modal 반응형

**파일**: `metadata-project/app/styles/field.css`

```css
.modalContent {
  width: calc(100vw - 32px);
  max-width: 400px;
  padding: 20px;
}

.modalContent-mobile {
  width: calc(100vw - 32px);
  max-width: 400px;
  border-radius: 12px;
}

@media (min-width: 768px) {
  .modalContent-mobile {
    width: 400px;
    border-radius: 8px;
  }
}
```

#### 1.3 터치 타겟

```css
.content-btn {
  min-height: 40px;
  padding: 8px 16px;
  font-size: 14px;
}

.content-btn-mobile {
  min-height: 48px;
  padding: 12px 24px;
  font-size: 16px;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
}
```

#### Phase 1 완료 기준
- ✅ Breakpoint 768px 적용
- ✅ 모바일 뷰포트에서 터치 타겟 48px
- ✅ Visual Regression Test 통과

---

### Phase 2: Expo StyleSheet 작성 (Month 3-5)

#### 목표
- React Native StyleSheet 생성
- CSS 클래스 → StyleSheet 매핑

#### 2.1 공통 스타일

**파일**: `SDUI-expo-app/styles/commonStyles.ts`

```typescript
import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  engineContainer: {
    flex: 1,
    padding: 16,
  },

  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },

  input: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
  },
});
```

#### 2.2 CSS → StyleSheet 매핑

**파일**: `SDUI-expo-app/utils/styleMapper.ts`

```typescript
export function resolveStyle(cssClass?: string) {
  const styleMap: Record<string, any> = {
    'engine-container': commonStyles.engineContainer,
    'content-btn': commonStyles.primaryButton,
    'content-input': commonStyles.input,
  };

  return styleMap[cssClass] || {};
}
```

#### Phase 2 완료 기준
- ✅ StyleSheet 생성
- ✅ CSS 클래스 매핑 완료
- ✅ Expo 앱 렌더링 확인

---

### Phase 3: Expo Web 통합 (Month 6, SEO 낮을 경우)

#### 목표
- CSS 제거, StyleSheet로 완전 전환
- Platform.select로 웹/앱 분기

#### 3.1 Platform.select 스타일

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  button: {
    minHeight: Platform.select({ web: 40, native: 48 }),
    paddingHorizontal: Platform.select({ web: 16, native: 24 }),
  },
});
```

#### Phase 3 완료 기준
- ✅ CSS 파일 제거
- ✅ Expo Web 빌드 성공
- ✅ 웹/앱 UI 일치

---

## Security Considerations (보안 고려사항)

### CSS Injection 방지

```typescript
const ALLOWED_CLASSES = ['engine-container', 'content-btn'];

const sanitizeClassName = (cssClass: string) => {
  return cssClass.split(' ')
    .filter(cls => ALLOWED_CLASSES.includes(cls))
    .join(' ');
};
```

---

## Test Plan (테스트 계획)

### Visual Regression (Percy)

```typescript
test('LOGIN_PAGE: mobile vs web', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await percySnapshot(page, 'LOGIN_PAGE - Mobile');

  await page.setViewportSize({ width: 1440, height: 900 });
  await percySnapshot(page, 'LOGIN_PAGE - Desktop');
});
```

---

## Dependencies (의존성)

### Depends on
- Planner: component_props 설계

### Blocks
- Frontend Engineer: CSS 적용
- QA Engineer: Visual Testing

---

## Deliverables (산출물)

1. **Phase 1**: 반응형 CSS (`layout.css`, `field.css`)
2. **Phase 2**: StyleSheet (`commonStyles.ts`)
3. **Phase 3**: Platform.select 스타일 (통합 시)

---

**다음 단계**: QA Engineer plan.md 작성 (E2E + Visual Regression 테스트)
