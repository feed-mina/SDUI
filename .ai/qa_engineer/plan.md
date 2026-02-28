# QA Engineer — Plan

> 이 파일은 테스트 계획을 기록한다.
> 사용자의 명시적 승인("YES") 후에만 테스트 코드를 작성한다.
> 테스트 설계도 '기획'이다 — 구현보다 먼저 설계한다.

---

## Plan 작성 템플릿

```markdown
## [기능 이름] 테스트 계획 — {날짜}

### 배경
- 테스트 대상: 어떤 기능/컴포넌트/API
- 관련 구현 계획: frontend_engineer plan.md / backend_engineer plan.md

### 테스트 전략

| 레벨 | 도구 | 범위 |
|------|------|------|
| 단위 | Jest + RTL | 개별 컴포넌트, 훅 로직 |
| 통합 | Jest + MSW | DynamicEngine + 메타데이터 + API 모킹 |
| E2E | Playwright | 전체 사용자 플로우 |

### 테스트 케이스 목록

#### 단위 테스트

```typescript
// 파일: tests/components/{ComponentName}.test.tsx

describe('{ComponentName}', () => {
  // TC-001: 정상 렌더링
  // Given: 기본 props (value, meta)
  // When: 컴포넌트 렌더링
  // Then: label_text 표시됨, value 표시됨

  // TC-002: 읽기 전용 상태
  // Given: isReadonly=true
  // When: 입력 시도
  // Then: 입력 불가 (disabled 또는 readOnly)

  // TC-003: onChange 콜백
  // Given: onChange 모킹
  // When: 사용자 입력 (userEvent.type)
  // Then: onChange(componentId, 입력값) 호출됨

  // TC-004: onAction 콜백
  // Given: onAction 모킹, action_type 있는 버튼
  // When: 버튼 클릭
  // Then: onAction(meta, undefined) 호출됨

  // TC-005: 엣지 케이스 — null value
  // Given: value=null
  // When: 렌더링
  // Then: 에러 없이 빈 상태 표시
});
```

#### 통합 테스트 (DynamicEngine)

```typescript
// 파일: tests/integration/{feature}.test.tsx

describe('DynamicEngine — {feature}', () => {
  // TC-010: 메타데이터 → 올바른 컴포넌트 렌더링
  // Given: MSW로 /api/ui/{screenId} → mock metadata 반환
  // When: DynamicEngine 마운트
  // Then: componentMap 매핑대로 렌더링

  // TC-011: 데이터 바인딩 우선순위
  // Given: formData[refId]='user-input', pageData[refId]='server-data'
  // When: 컴포넌트 렌더링
  // Then: 'user-input' 표시 (formData 우선)

  // TC-012: Repeater 렌더링
  // Given: ref_data_id='items', pageData.items=['a','b','c']
  // When: DynamicEngine 렌더링
  // Then: 자식 컴포넌트 3개 렌더링
});
```

#### E2E 테스트 (Playwright)

```typescript
// 파일: e2e/{flow}.spec.ts

test('{사용자 플로우 이름}', async ({ page }) => {
  // Step 1: [페이지 이동]
  await page.goto('/view/LOGIN_PAGE');

  // Step 2: [사용자 인터랙션]
  await page.fill('[data-testid="userId-input"]', 'testuser');

  // Step 3: [결과 검증]
  await expect(page).toHaveURL('/view/DIARY_LIST');
});
```

### MSW 핸들러

```typescript
// 이 테스트에 필요한 API 모킹
http.get('/api/ui/{screenId}', () => {
  return HttpResponse.json({ data: mockMetadata });
}),
http.post('/api/auth/login', () => {
  return HttpResponse.json({ data: { accessToken: 'mock-token' } });
}),
```

### 테스트 파일 위치

| 파일 | 설명 |
|------|------|
| `tests/components/{ComponentName}.test.tsx` | 단위 테스트 |
| `tests/integration/{feature}.test.tsx` | 통합 테스트 |
| `e2e/{flow}.spec.ts` | E2E 테스트 |

### 성공 기준

| 기준 | 목표 |
|------|------|
| 단위 테스트 커버리지 | 80% 이상 |
| 렌더 카운트 (withRenderTrack) | 이전 대비 증가 없음 |
| E2E 통과율 | 100% |
| frontend-report.html | 모든 테스트 green |

### 담당자 연락 사항

- Frontend Engineer: 테스트 작성에 필요한 data-testid 속성 추가 요청
- Backend Engineer: API 응답 구조 확정 (MSW 모킹 전 필요)

### 승인 상태
[ ] 사용자 승인 대기 중
[x] 사용자 승인 완료 (날짜: ...)
[ ] 테스트 작성 완료
[ ] 전체 테스트 통과 (frontend-report.html 링크: ...)
```

---

## 현재 계획 없음

아직 작성된 테스트 계획이 없습니다.