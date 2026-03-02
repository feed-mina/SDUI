# Designer — Mobile+Web Integration Plan (병행 접근 방식)

**접근 방식**: Next.js 웹 + React Native 모바일 병행 운영
**작성일**: 2026-03-01
**담당**: Designer Agent

---

## Research Analysis (연구 분석)

### 현재 CSS 문제점

1. **Breakpoint 불일치**:
   - `useDeviceType`: 1000px
   - CSS: 768px (`@media (min-width: 768px)`)
   - Modal: 고정 width 400px (반응형 X)

2. **터치 타겟 부족**:
   - 현재 버튼 높이: 40px
   - WCAG 권장: 최소 44px (모바일)

3. **CSS vs React Native StyleSheet**:
   - 웹: CSS 클래스 (`className`)
   - 앱: StyleSheet (`style={styles.xxx}`)

### 표준화 기준

| 항목 | 모바일 | 데스크톱 |
|------|--------|----------|
| Breakpoint | < 768px | ≥ 768px |
| 터치 타겟 | 48px | 40px |
| Padding | 16px | 24px (tablet), 50px (desktop) |
| Font Size | 16px (버튼) | 14px |

---

## Implementation Plan (구현 계획)

### 1. Breakpoint 표준화 (768px)

#### 1.1 CSS Variables

**파일**: `metadata-project/app/styles/layout.css`

```css
:root {
  --breakpoint-mobile: 768px;
  --breakpoint-desktop: 1024px;
  --touch-target-min: 48px;
  --padding-mobile: 16px;
  --padding-tablet: 24px;
  --padding-desktop: 50px;
}

.engine-container {
  padding: var(--padding-mobile); /* Mobile first */
}

@media (min-width: 768px) {
  .is-pc .engine-container {
    padding: var(--padding-tablet);
  }
}

@media (min-width: 1024px) {
  .is-pc .engine-container {
    max-width: 1100px;
    padding: var(--padding-desktop);
  }
}
```

#### 1.2 Modal 반응형

**파일**: `metadata-project/app/styles/field.css`

```css
/* 기존 (고정 width) */
.modalContent {
  width: 400px; /* ❌ */
}

/* 수정 후 (반응형) */
.modalContent {
  width: calc(100vw - 32px); /* 모바일: 전체 너비 - 여백 */
  max-width: 400px; /* 데스크톱: 최대 400px */
  padding: 20px;
}

.modalContent-mobile {
  width: calc(100vw - 32px);
  max-width: 400px;
  padding: 20px;
  border-radius: 12px; /* 모바일 더 둥글게 */
}

@media (min-width: 768px) {
  .modalContent-mobile {
    width: 400px;
    border-radius: 8px;
  }
}
```

### 2. 터치 타겟 확대 (모바일)

#### 2.1 버튼 스타일

**파일**: `metadata-project/app/styles/field.css`

```css
/* 웹 버튼 (기본) */
.content-btn {
  min-height: 40px;
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.content-btn:hover {
  opacity: 0.9;
}

/* 모바일 버튼 (터치 타겟 48px) */
.content-btn-mobile {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
}

.primary-action {
  background-color: #007AFF;
  color: #fff;
  border: none;
}

.secondary-action {
  background-color: #E5E5EA;
  color: #000;
  border: none;
}
```

#### 2.2 입력 필드

```css
/* 웹 입력 필드 */
.content-input {
  min-height: 40px;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.content-input:focus {
  border-color: #007AFF;
  outline: none;
}

/* 모바일 입력 필드 */
.content-input-mobile {
  min-height: 48px;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.content-input-mobile:focus {
  border-color: #007AFF;
  outline: none;
  /* 모바일 확대 방지 */
  font-size: 16px; /* iOS Safari 자동 확대 방지 (16px 이상) */
}
```

### 3. 레이아웃 클래스

#### 3.1 Flex 레이아웃

**파일**: `metadata-project/app/styles/layout.css`

```css
/* 공통 Flex 레이아웃 */
.flex-col-layout {
  display: flex;
  flex-direction: column;
}

.flex-row-layout {
  display: flex;
  flex-direction: row;
}

/* 모바일: 세로 정렬 */
.flex-row-layout-mobile {
  display: flex;
  flex-direction: column; /* 모바일에서는 세로 */
  gap: 12px;
}

@media (min-width: 768px) {
  .flex-row-layout-mobile {
    flex-direction: row; /* 데스크톱에서는 가로 */
    gap: 16px;
  }
}
```

#### 3.2 Grid 레이아웃 (DIARY_LIST)

```css
/* 웹 그리드 (3열) */
.diary-list-grid {
  display: grid;
  grid-template-columns: 1fr; /* 모바일: 1열 */
  gap: 16px;
}

@media (min-width: 768px) {
  .diary-list-grid {
    grid-template-columns: repeat(2, 1fr); /* 태블릿: 2열 */
  }
}

@media (min-width: 1024px) {
  .diary-list-grid {
    grid-template-columns: repeat(3, 1fr); /* 데스크톱: 3열 */
  }
}

/* 모바일 리스트 (1열) */
.diary-mobile-card-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

### 4. React Native StyleSheet (모바일 앱)

#### 4.1 공통 스타일

**파일**: `SDUIMobileApp/src/styles/commonStyles.ts`

```typescript
import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  // 컨테이너
  engineContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },

  // 버튼
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // 입력 필드
  input: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },

  // 카드
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android 그림자
  },

  // 레이아웃
  flexRow: {
    flexDirection: 'row',
  },

  flexCol: {
    flexDirection: 'column',
  },
});
```

#### 4.2 CSS 클래스 → StyleSheet 매핑

**파일**: `SDUIMobileApp/src/utils/styleMapper.ts`

```typescript
import { StyleSheet } from 'react-native';
import { commonStyles } from '../styles/commonStyles';

export function resolveStyle(cssClass?: string) {
  if (!cssClass) return {};

  const styleMap: Record<string, any> = {
    'engine-container': commonStyles.engineContainer,
    'flex-col-layout': commonStyles.flexCol,
    'flex-row-layout': commonStyles.flexRow,
    'content-btn': commonStyles.primaryButton,
    'content-input': commonStyles.input,
    'diary-card': commonStyles.card,
  };

  return styleMap[cssClass] || {};
}
```

### 5. css_class_overrides 활용

```sql
-- 버튼 클래스 플랫폼별 분기
UPDATE ui_metadata SET
  css_class = 'content-btn primary-action',
  css_class_overrides = '{
    "mobile": "content-btn-mobile primary-action",
    "web": "content-btn primary-action"
  }'::jsonb
WHERE component_type = 'BUTTON';

-- 입력 필드
UPDATE ui_metadata SET
  css_class = 'content-input',
  css_class_overrides = '{
    "mobile": "content-input-mobile",
    "web": "content-input"
  }'::jsonb
WHERE component_type = 'INPUT';
```

---

## Security Considerations (보안 고려사항)

### CSS Injection 방지

**위협**: css_class 필드에 악의적 클래스 삽입

**완화 방안**:
```typescript
// DynamicEngine.tsx
const ALLOWED_CSS_CLASSES = [
  'engine-container',
  'flex-col-layout',
  'flex-row-layout',
  'content-btn',
  'content-input',
  'diary-card',
  // ... 화이트리스트
];

const sanitizeClassName = (cssClass: string) => {
  return cssClass.split(' ')
    .filter(cls => ALLOWED_CSS_CLASSES.includes(cls))
    .join(' ');
};
```

### z-index 스택 오버플로우

```css
/* z-index 계층 정의 */
:root {
  --z-index-base: 1;
  --z-index-header: 10;
  --z-index-modal: 100;
  --z-index-toast: 1000;
}

.modalOverlay {
  z-index: var(--z-index-modal);
}
```

---

## Test Plan (테스트 계획)

### Visual Regression Testing (Percy)

```typescript
// tests/visual/mobile_web_snapshot.spec.ts
import percySnapshot from '@percy/playwright';

test('LOGIN_PAGE: mobile vs web', async ({ page }) => {
  // 모바일 (375px)
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/view/LOGIN_PAGE');
  await percySnapshot(page, 'LOGIN_PAGE - Mobile');

  // 데스크톱 (1440px)
  await page.setViewportSize({ width: 1440, height: 900 });
  await percySnapshot(page, 'LOGIN_PAGE - Desktop');
});
```

### Accessibility Testing (터치 타겟)

```typescript
// tests/accessibility.test.tsx
test('buttons meet WCAG touch target size (48x48px)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/view/LOGIN_PAGE');

  const submitBtn = page.locator('button[type="submit"]');
  const box = await submitBtn.boundingBox();

  expect(box?.height).toBeGreaterThanOrEqual(48);
  expect(box?.width).toBeGreaterThanOrEqual(48);
});
```

### Responsive Testing

```typescript
const viewports = [
  { width: 375, height: 667, name: 'iPhone SE' },
  { width: 768, height: 1024, name: 'iPad' },
  { width: 1440, height: 900, name: 'Desktop' },
];

viewports.forEach(({ width, height, name }) => {
  test(`Responsive layout: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/view/DIARY_LIST');

    const container = page.locator('.engine-container');
    const padding = await container.evaluate((el) =>
      window.getComputedStyle(el).padding
    );

    if (width < 768) {
      expect(padding).toBe('16px');
    } else if (width < 1024) {
      expect(padding).toBe('24px');
    } else {
      expect(padding).toBe('50px');
    }
  });
});
```

---

## Dependencies (의존성)

### Depends on
- Architect: JSONB 스키마
- Planner: component_props 설계

### Blocks
- Frontend Engineer: CSS 클래스 적용
- QA Engineer: Visual Regression Testing

---

## Deliverables (산출물)

1. **반응형 CSS 파일**: `layout.css`, `field.css` 수정
2. **React Native StyleSheet**: `commonStyles.ts`
3. **CSS 클래스 가이드**: `css_classes.md`

---

**다음 단계**: QA Engineer plan.md 작성 (Visual Regression + E2E 테스트)
