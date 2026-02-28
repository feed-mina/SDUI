# QA Engineer — Research

> 이 파일은 QA 분석 결과를 기록한다. 테스트 전략 수립의 근거가 된다.

---

## 현재 테스트 환경 (2026-02-28 기준)

### 테스트 스택

| 도구 | 버전 | 용도 |
|------|------|------|
| Jest | 29.7.0 | 단위/통합 테스트 러너 |
| React Testing Library | 16.3.2 | React 컴포넌트 테스팅 |
| MSW (Mock Service Worker) | 2.7.0 | API 모킹 |
| @swc/jest | 0.2.37 | TypeScript 변환 (빠른 빌드) |
| ts-jest | 29.2.5 | TypeScript 타입 지원 |
| Playwright | 1.50.0 | E2E 브라우저 테스팅 |

### 설정 파일

| 파일 | 역할 |
|------|------|
| `jest.config.js` | Jest 설정 (모듈 별칭, transform, coverage) |
| `jest.setup.js` | @testing-library/jest-dom 설정 |
| `playwright.config.ts` | E2E 브라우저/기기 설정 |

---

## 현재 테스트 파일 목록

| 파일 경로 | 테스트 유형 | 검증 내용 |
|----------|-----------|---------|
| `tests/api_duplicated.test.tsx` | 통합 | 동일 화면에서 메타데이터 API 2회 이상 호출 방지 |
| `tests/rendering_optimization.test.tsx` | 통합/성능 | withRenderTrack 렌더 카운트 |
| `tests/components/TimeSelect.test.tsx` | 단위 | TimeSelect 컴포넌트 동작 |
| `tests/auth.setup.ts` | 설정 | 인증 MSW 핸들러 (로그인 모킹) |
| `tests/test-utils.tsx` | 유틸 | 커스텀 render (모든 Provider 포함) |
| `tests/TestLogger.ts` | 유틸 | HTML 리포트 생성기 |

### 테스트 명령어

```bash
npm run test                          # 전체 Jest 테스트
npx jest tests/path/to/file.test.tsx  # 단일 파일
npx playwright test                   # E2E 전체
```

### 리포트 위치
- `tests/logs/frontend-report.html`

---

## SDUI 특화 테스트 시나리오

### DynamicEngine 핵심 테스트 케이스

#### 1. componentMap 매핑 검증
```typescript
// 모든 component_type이 componentMap에서 올바른 컴포넌트를 반환하는가?
// 알 수 없는 component_type은 에러 없이 스킵되는가?
```

#### 2. 데이터 바인딩 우선순위 검증
```typescript
// 조건: formData[refId] 있음 → formData 값 사용
// 조건: formData[refId] 없음, pageData[refId] 있음 → pageData 값 사용
// 조건: 둘 다 없음 → undefined/empty string (에러 아님)
```

#### 3. Repeater(배열 렌더링) 검증
```typescript
// ref_data_id 있는 group + pageData[refId] = ['a','b','c']
// → 3개의 자식 컴포넌트 렌더링
// → pageData[refId] = [] → 자식 0개 (에러 아님)
// → pageData[refId] = null → 렌더링 스킵 (에러 아님)
```

#### 4. 그룹 레이아웃 검증
```typescript
// group_direction=ROW → className에 'flex-row-layout' 포함
// group_direction=COLUMN → className에 'flex-col-layout' 포함
```

#### 5. 엣지 케이스
```typescript
// 빈 metadata 배열 → 빈 DOM (에러 없음)
// 중복 componentId → 첫 번째 것 사용 (경고 로그)
// 고아 노드 (parent 없음) → 루트 노드로 렌더링
// MODAL 컴포넌트 → activeModal === componentId 일 때만 표시
```

---

## MSW 모킹 시나리오

### API 모킹 경로

```typescript
// 메타데이터 API
GET /api/ui/{screenId} → { data: mockMetadataTree }

// 인증 API
POST /api/auth/login → { data: { accessToken, user } }
POST /api/auth/login (실패) → { code: 'AUTH_001', message: '...' }
POST /api/auth/refresh → { data: { accessToken } }
POST /api/auth/refresh (실패) → 401

// 데이터 API
POST /api/execute/{sqlKey} → { data: mockPageData }
POST /api/execute/{sqlKey} (빈 결과) → { data: [] }

// 일기 API
POST /api/diary → { data: { diaryId: 1 } }
```

---

## 커버리지 갭 분석

### 현재 미테스트 영역 (확인 필요)

| 영역 | 우선순위 | 설명 |
|------|---------|------|
| useUserActions (LOGIN_SUBMIT) | High | 로그인 성공/실패 시나리오 |
| useUserActions (REGISTER_SUBMIT) | High | 회원가입 + 이메일 발송 |
| useBusinessActions (SUBMIT) | High | 일기 저장 플로우 |
| 401 자동 토큰 갱신 | High | Axios 인터셉터 |
| 보호 화면 리다이렉트 | Medium | 비로그인 접근 |
| 페이지네이션 | Medium | DIARY_LIST 페이지 전환 |
| AddressSearchGroup | Low | 다음 API 연동 |
| EmotionSelectField | Low | 감정 선택 UI |

---

## E2E 테스트 핵심 플로우

```
1. 회원가입 → 이메일 인증 → 로그인
2. 로그인 → 일기 작성 → 목록 확인
3. 일기 목록 → 상세 보기 → 수정
4. 비로그인 → 보호 화면 접근 → 로그인 페이지 리다이렉트
5. 카카오 로그인 플로우
6. 토큰 만료 → 자동 갱신 → 화면 유지
```

---

## 분석 히스토리

| 날짜 | 분석 내용 | 결론 |
|------|-----------|------|
| 2026-02-28 | 전체 테스트 환경 초기 분석 | 위 내용 도출, 커버리지 갭 식별 |
| 2026-02-28 | [P3] 모달 시스템 버그 추적 | 아래 섹션 참고 |

---

## [P3] 모달 시스템 버그 분석 결과 ← 서브에이전트 분석 (2026-02-28)

### 버그 요약
`CommonPage`가 `usePageHook`에서 `activeModal`/`closeModal`을 destructure하지 않고
`DynamicEngine`에도 전달하지 않아, **모든 화면에서 모달이 영구적으로 렌더링되지 않는다.**
추가로 `usePageHook`의 `isUserDomain` 분기로 인해 비즈니스 화면에서는 `activeModal` 자체가 반환조차 안 된다.

---

### 데이터 흐름 추적 (버그 경로)

```
activeModal 생성: useUserActions.tsx:17
  → const [activeModal, setActiveModal] = useState<string | null>(null);
         ↓
usePageHook 반환: NO
  → isUserDomain = false (DIARY_LIST 등)일 때 targetActions = businessActions
  → businessActions에는 activeModal 상태 없음
  → usePageHook.tsx:31-34에서 ...targetActions만 spread → activeModal 누락
         ↓
CommonPage destructure: NO
  → page.tsx:42: const {formData, handleChange, handleAction, showPassword, pwType} = usePageHook(...)
  → activeModal 구조분해 없음
         ↓
DynamicEngine prop: NO
  → page.tsx:80-88에서 activeModal={} closeModal={} 미전달
  → DynamicEngine은 activeModal = undefined
         ↓
renderModals 실행: FAIL
  → DynamicEngine.tsx:144: undefined === "SOME_ID" → 항상 false → 모달 절대 렌더링 안 됨
```

---

### 근본 원인 (Root Cause)

#### Primary: usePageHook 도메인 분기 설계 결함 (`usePageHook.tsx:28-34`)
```typescript
const isUserDomain = screenId === "REGISTER_PAGE" || screenId.includes("LOGIN");
const targetActions = isUserDomain ? userActions : businessActions;

return {
    ...targetActions,     // ← businessActions에는 activeModal 없음
    handleAction: combinedHandleAction
};
```

#### Secondary: CommonPage에서 activeModal 미처리 (`page.tsx:42`)
```typescript
const {formData, handleChange, handleAction, showPassword, pwType} = usePageHook(...);
// activeModal, closeModal 누락
```

#### Tertiary: DynamicEngine prop 누락 (`page.tsx:80-88`)
```typescript
<DynamicEngine ... />
// activeModal={activeModal}  ← 미전달
// closeModal={closeModal}    ← 미전달
```

---

### 부가 버그 발견

#### Bug-1: renderModals의 undefined 반환 (`DynamicEngine.tsx:155`)
```typescript
.map(node => {
    if (activeModal === cid) { return <ModalComponent />; }
    // return null;  ← 주석 처리됨 → undefined이 배열에 쌓임
});
```

#### Bug-2: renderModals가 최상위 레벨만 탐색
```typescript
nodes.filter(node => ... === 'MODAL')  // 최상위만 필터 → 중첩 MODAL 발견 불가
```

---

### 최소 수정 방법

#### 수정 1: `usePageHook.tsx` — activeModal 항상 반환 ★ 핵심
```typescript
return {
    ...targetActions,
    handleAction: combinedHandleAction,
    activeModal: userActions.activeModal,  // ← 추가
    closeModal: userActions.closeModal     // ← 추가
};
```

#### 수정 2: `page.tsx:42` — activeModal, closeModal destructure
```typescript
const {
    formData, handleChange, handleAction, showPassword, pwType,
    activeModal, closeModal   // ← 추가
} = usePageHook(screenId, metadata, pageData);
```

#### 수정 3: `page.tsx:80-88` — DynamicEngine에 prop 전달
```typescript
<DynamicEngine
    ...
    activeModal={activeModal}    // ← 추가
    closeModal={closeModal}      // ← 추가
/>
```

#### 수정 4: `DynamicEngine.tsx:155` — undefined 배열 요소 제거
```typescript
// return null;  ← 주석 해제
return null;
```

---

### 수정 후 기대 데이터 흐름

```
activeModal 생성 → usePageHook 반환(YES) → CommonPage destructure(YES)
→ DynamicEngine prop(YES) → renderModals 매칭 → 모달 렌더링 성공
```

### 수정 범위
- 수정 파일 수: 3개 (`usePageHook.tsx`, `page.tsx`, `DynamicEngine.tsx`)
- 변경 라인 수: 약 7줄 추가, 1줄 주석 해제
- 기존 LOGIN/REGISTER 화면 동작: 영향 없음 (호환성 유지)