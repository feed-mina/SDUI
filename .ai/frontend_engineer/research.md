# Frontend Engineer — Research

> 이 파일은 프론트엔드 구현 분석 결과를 기록한다.

---

## 핵심 파일 지도 (2026-02-28 기준)

### DynamicEngine 코어

| 파일                                              | 역할                            | 변경 빈도               |
| ------------------------------------------------- | ------------------------------- | ----------------------- |
| `components/DynamicEngine/DynamicEngine.tsx`    | 트리 순회 + 컴포넌트 렌더링     | 낮음 (핵심 엔진)        |
| `components/DynamicEngine/useDynamicEngine.tsx` | 데이터 바인딩 로직              | 낮음                    |
| `components/DynamicEngine/type.ts`              | Metadata 타입 정의              | 중간                    |
| `components/constants/componentMap.tsx`         | component_type → 컴포넌트 매핑 | 중간 (신규 컴포넌트 시) |
| `components/constants/screenMap.ts`             | URL → screen_id 매핑           | 중간 (신규 화면 시)     |

### 액션 핸들러 계층

```
usePageHook (라우터)
  ├── useUserActions (인증 관련)
  │     액션: LOGIN_SUBMIT, LOGOUT, REGISTER_SUBMIT, VERIFY_CODE,
  │           SOS, TOGGLE_PW, KAKAO_LOGOUT, LINK, ROUTE
  └── useBusinessActions (데이터 관련)
        액션: SUBMIT, ROUTE_DETAIL, ROUTE_MODIFY, LINK, ROUTE

공통: useBaseActions
  - handleChange(id, value): formData 상태 업데이트
  - togglePassword(): 비밀번호 표시 토글
  - getMetaInfo(meta): 메타데이터 필드 정규화
  - flattenMetadata(): 트리 → 배열 변환
```

### 데이터 흐름 레이어

```
MetadataProvider
  → React Query: GET /api/ui/{screenId}
  → 캐시 키: {rolePrefix}_{screenId}
  → stale: 5분

usePageMetadata
  → 메타데이터 로드 (Provider 캐시 활용)
  → AUTO_FETCH 컴포넌트 탐지
  → POST /api/execute/{sqlKey} (pageData 획득)
  → JSONB 필드 파싱 (selected_times, daily_slots)
  → 날짜 정규화 (T 제거, 하이픈 → 점)
  → 페이지네이션 데이터 구성
  → returns: { metadata, pageData, loading, totalCount }

useDynamicEngine
  → treeData: 서버에서 이미 트리로 온 메타데이터
  → getComponentData(node, rowData):
      우선순위: formData[refId] > rowData > pageData[refId] > pageData
```

### 상태 관리

```
AuthContext (context/AuthContext.tsx)
  - user: { userId, userSqno, email, socialType, isLoggedIn, role }
  - login(userData): 로그인 상태 설정
  - logout(): 상태 초기화 + LOGIN_PAGE 이동
  - checkAccess(roles): RBAC 확인
  - 초기화: /api/auth/me 호출 (세션 복구)

formData (useBaseActions)
  - React useState로 관리
  - formDataRef: 즉각적 읽기용 (액션 핸들러에서 사용)
  - 메타데이터 변경 시 자동 초기화
  - 수정 화면: initialData로 자동 채움
```

### Axios 인터셉터 (`services/axios.tsx`)

```
Request:
  → Authorization: Bearer {token} (localStorage)
  → withCredentials: true

Response:
  → 401 수신 시:
      POST /api/auth/refresh
      → 성공: 새 토큰 저장 + 원래 요청 재시도
      → 실패: 로그아웃 + LOGIN_PAGE 이동
  → 에러 코드 처리: AUTH_001, AUTH_004 등
```

---

## 타입 시스템 분석

### Metadata 인터페이스 (type.ts) — 주의: 이중 필드 패턴

```typescript
// 서버 응답은 camelCase, DB 직접 응답은 snake_case일 수 있음
// 두 형태 모두 지원해야 하므로 타입에 양쪽 정의됨

interface Metadata {
  componentId: string;         // camelCase
  component_id: string;        // snake_case (둘 중 하나만 올 수 있음)
  componentType: string;
  component_type?: string;
  parentGroupId?: string | null;
  parent_group_id?: string | null;
  // ... 모든 필드가 이중으로 정의됨
  children?: Metadata[] | null;
}
```

---

## 현재 필드 컴포넌트 목록 (`components/fields/`)

| 파일                    | component_type         | 특이사항                                       |
| ----------------------- | ---------------------- | ---------------------------------------------- |
| InputField.tsx          | INPUT                  | Enter키 SUBMIT, 비밀번호 감지                  |
| TextField.tsx           | TEXT                   | 표시 전용                                      |
| PasswordField.tsx       | PASSWORD               | showPassword prop                              |
| ButtonField.tsx         | BUTTON, SNS_BUTTON     | onAction 콜백                                  |
| SelectField.tsx         | SELECT                 | 드롭다운                                       |
| TextAreaField.tsx       | TEXTAREA               | 여러 줄                                        |
| Modal.tsx               | MODAL                  | activeModal === componentId 조건부 표시        |
| ImageField.tsx          | IMAGE                  |                                                |
| DateTimePicker.tsx      | DATETIME_PICKER        |                                                |
| TimeSelect.tsx          | TIME_SELECT            |                                                |
| TimeSlotRecord.tsx      | TIME_SLOT_RECORD       |                                                |
| AddressSearchGroup.tsx  | ADDRESS_SEARCH_GROUP   | 다음 우편번호 API                              |
| EmotionSelectField.tsx  | EMOTION_SELECT         | 감정 인덱스(정수)                              |
| EmailSelectField.tsx    | EMAIL_SELECT           | 도메인 선택                                    |
| ArrivalButton.tsx       | ❌ componentMap 미등록 | 도착 버튼 (RecordTimeComponent 내부 직접 사용) |
| RecordTimeComponent.tsx | TIME_RECORD_WIDGET     |                                                |
| Pagination.tsx          | (DynamicEngine 외부)   | CONTENT_LIST에서 직접 사용                     |
|                         |                        |                                                |

---

## 테스트 환경

| 항목             | 기술                       | 설정 파일                           |
| ---------------- | -------------------------- | ----------------------------------- |
| 단위/통합 테스트 | Jest 29.7                  | `jest.config.js`                  |
| React 테스팅     | React Testing Library 16.3 | -                                   |
| API 모킹         | MSW 2.7                    | -                                   |
| E2E              | Playwright 1.50            | `playwright.config.ts`            |
| 리포트           | TestLogger.ts              | `tests/logs/frontend-report.html` |
| 변환기           | @swc/jest                  | jest.config.js                      |

---

## 성능 관련 확인 사항

| 패턴                  | 구현 위치                    | 목적                   |
| --------------------- | ---------------------------- | ---------------------- |
| withRenderTrack HOC   | componentMap의 모든 컴포넌트 | 렌더 횟수 추적         |
| React.memo / useMemo  | 개별 컴포넌트                | 불필요한 리렌더링 방지 |
| React Query stale 5분 | MetadataProvider             | API 중복 호출 방지     |
| formDataRef           | useBaseActions               | 클로저 문제 방지       |

---

## [P2] Security Audit — JWT & XSS 취약점 현황 분석 (코드 재검증)

**분석 일시:** 2026-02-28
**참고 커밋:** b2ec8d5 (fix: 민감정보 로깅 삭제 및 보안 로직 보강)

> **⚠️ 상태 업데이트:** 이전 분석은 commit b2ec8d5 이전 코드 기준.
> 재검증 결과: 프론트엔드 민감 로그 수정됨. 백엔드 HttpOnly 쿠키 지원 추가됨.
> 그러나 프론트엔드가 여전히 localStorage를 읽고 있어 XSS 취약점 유효.
> **백엔드 보안 설정 상세 (HttpOnly 쿠키 코드, System.out.println 이슈 등) → `backend_engineer/research.md` 참고**

---

### JWT 토큰 저장 방식 현황 (실제 코드 기준)

| 파일                | 위치       | 저장 방식                                               | 위험도                             |
| ------------------- | ---------- | ------------------------------------------------------- | ---------------------------------- |
| `axios.tsx`       | Line 19    | `localStorage.getItem('accessToken')`                 | ✅ **해결** — HttpOnly 쿠키 전환 (2026-03-01) |
| `axios.tsx`       | Line 49    | `localStorage.setItem('accessToken', newAccessToken)` | ✅ **해결**                  |
| `axios.tsx`       | Line 57    | `localStorage.removeItem('accessToken')`              | ✅ **해결**                        |
| `AuthContext.tsx` | Line 73-74 | `/api/auth/me` 호출 (HttpOnly 쿠키 자동 전송)         | **LOW** — 안전              |

**결론:** 백엔드는 HttpOnly 쿠키로 토큰을 전달하지만, 프론트엔드 `axios.tsx`가 여전히 localStorage를 읽어 아키텍처 불일치 + XSS 취약점 유효.

> ✅ **2026-03-01 수정:** axios.tsx에서 localStorage 제거, HttpOnly 쿠키 전환 완료.

---

### 민감 정보 로깅 현황 (commit b2ec8d5 이후 재스캔)

#### 프론트엔드 (수정 완료 ✅)

| 파일                   | 라인          | 내용                                          | 상태                    |
| ---------------------- | ------------- | --------------------------------------------- | ----------------------- |
| `useUserActions.tsx` | ~76 (구 위치) | `console.log('loginData', loginData)`       | ✅**삭제됨**      |
| `useUserActions.tsx` | ~70 (구 위치) | `console.log('뭐야 ')`                      | ✅**삭제됨**      |
| `AuthContext.tsx`    | 46            | `console.error("Logout API error:", err)`   | ✅ 안전 (에러 메시지만) |
| `useUserActions.tsx` | 146, 159      | `console.error(...)`, `console.warn(...)` | ✅ 안전 (디버그 메시지) |

**프론트엔드 민감 로그: 0개 (commit b2ec8d5로 해결)**
**백엔드 System.out.println (~35개) 미정리 → `backend_engineer/research.md` 참고 (P2)**

---

### CSP / 보안 헤더 현황 (next.config.ts)

**구성 현황 (Line 1-28):**

- rewrites: `/api/*` → `http://localhost:8080/api/*` (프록시)
- redirects: `/` → `/view/MAIN_PAGE`

**보안 헤더:**

| 헤더                      | 설정 여부                  |
| ------------------------- | -------------------------- |
| Content-Security-Policy   | ✅ 이미 구현됨             |
| X-Frame-Options           | ✅ 이미 구현됨             |
| X-Content-Type-Options    | ✅ 이미 구현됨             |
| Strict-Transport-Security | ✅ 이미 구현됨             |
| Content-Security-Policy   | ✅ 구현됨 (next.config.ts) |
| X-Frame-Options           | ✅ 구현됨 (next.config.ts) |
| X-Content-Type-Options    | ✅ 구현됨 (next.config.ts) |
| Strict-Transport-Security | ✅ 구현됨 (next.config.ts) |

---

### XSS 공격 시나리오 위험도

| 시나리오                      | 현재 위험도   | 이유                                                        |
| ----------------------------- | ------------- | ----------------------------------------------------------- |
| XSS로 Access Token 탈취       | **LOW** | localStorage 제거됨 — HttpOnly 쿠키 전환 완료 (2026-03-01) |
| XSS로 Refresh Token 탈취      | **LOW** | HttpOnly 쿠키 — JavaScript 접근 불가                       |
| 탈취 AccessToken으로 API 접근 | **LOW** | 쿠키 기반 전환으로 XSS 탈취 불가                            |
| CSP 없어 XSS 삽입 쉬움        | **LOW** | CSP 헤더 구현됨 (next.config.ts)                            |

---

### 권고 수정안 (현재 기준)

**단기 (즉시, 프론트엔드만 수정):**

1. `next.config.ts`에 보안 헤더 추가:

```typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self'; object-src 'none'" }
    ]
  }]
}
```

**중기 (아키텍처 변경, ✅ 완료):**

1. **✅ Access Token → HttpOnly 쿠키 전환** (`axios.tsx` localStorage 제거 완료, 2026-03-01):

   - 로그인 시 HttpOnly 쿠키만 사용 (백엔드 지원 + 프론트엔드 localStorage 제거 완료)
   - `axios.tsx:19,49` `localStorage.get/setItem` 제거됨

---

// [메모] Sidebar에서 약속관리 항목 로그인 할때만 보이도록 한다.  추가로 GLOBAL_HEAD는 allowd_role 과 관련이 있을까?

### 수정 우선순위

| 항목                                    | 우선순위     | 상태              |
| --------------------------------------- | ------------ | ----------------- |
| `useUserActions.tsx:76` 민감 로그     | 완료         | ✅ commit b2ec8d5 |
| `axios.tsx` localStorage → 쿠키 전환 | **P1** | ✅ 이미 구현됨    |
| CSP / 보안 헤더 추가                    | **P1** | ✅ 이미 구현됨    |

## 분석 (2026-03-05)

### 전체 흐름

```
URL /view/{screenId}
    ↓
[MetadataProvider] (components/providers/MetadataProvider.tsx)
    React Query: GET /api/ui/{screenId}
    캐시 키: {rolePrefix}_{screenId}  stale: 5분
    제공값: screenId, refId, menuTree
    ↓
[CommonPage] (app/view/[...slug]/page.tsx)
    usePageMetadata(screenId, currentPage, isOnlyMine, refId)
      → metadata, pageData, totalCount, loading
    usePageHook(screenId, metadata, pageData)
      → formData, handleChange, handleAction, activeModal, closeModal
    combineData = { ...pageData, ...formData }  ← formData가 pageData 덮어씀
    ↓
[DynamicEngine] (components/DynamicEngine/DynamicEngine.tsx)
    useDynamicEngine(metadata, pageData, formData) → treeData, getComponentData
    useDeviceType() → deviceClass ("is-pc" | "is-mobile")
    ↓
    renderNodes(treeData)   ← 재귀 순회
    renderModals(treeData)  ← MODAL 전용 별도 렌더링
```

---

### renderNodes 분기 로직 (DynamicEngine.tsx:26)

```
노드 하나 수신
  │
  ├── isVisible === false  →  null 반환 (렌더링 제외)
  │
  ├── children 있음 (Group 노드)
  │    │  className: "group-{componentId} {cssClass} flex-row/col-layout"
  │    │
  │    ├── refDataId 있음 → Repeater
  │    │    pageData[refId] 배열을 .map() 순회
  │    │    각 item을 rowData로 전달하며 renderNodes(children, item) 재귀
  │    │
  │    └── refDataId 없음 → 일반 Group
  │         <div className={combinedClassName}>
  │           renderNodes(children, rowData) 재귀
  │         </div>
  │
  └── children 없음 (Leaf 노드)
       typeKey = componentType.toUpperCase()
       Component = componentMap[typeKey]
       Component 없거나 typeKey === "DATA_SOURCE" → null
       finalData = getComponentData(node, rowData)
       <Component id meta data onChange onAction {...rest} />
```

---

### 데이터 바인딩 우선순위 (useDynamicEngine.tsx:11)

```typescript
getComponentData(node, rowData):

1순위  formData[refId]      // 사용자가 현재 입력 중인 값 (입력 즉시 반영)
2순위  rowData              // 리피터 안 개별 행 데이터 (목록 페이지)
3순위  pageData[refId]      // 서버에서 가져온 데이터 (상세/조회 페이지)
         └─ 단일 컴포넌트인데 배열로 왔을 때 → [0] 추출
4순위  pageData 전체        // fallback
```

---

### MODAL 렌더링 (DynamicEngine.tsx:143)

- `renderNodes`와 **완전히 분리**된 `renderModals()` 함수로 처리
- `activeModal === componentId` 조건 충족 시에만 렌더링
- 일반 DOM 트리 흐름 밖에 위치 (레이아웃 영향 없음)

```tsx
// 출력 구조
<div className="engine-container is-pc|is-mobile">
  <div className="content-area">
    {renderNodes(treeData)}    // 일반 컴포넌트
  </div>
  {renderModals(treeData)}     // MODAL (activeModal 조건부)
</div>
```

---

### 주의: CommonPage 레벨 screen_id 분기 (page.tsx:77, 95)

엔진 외부(CommonPage)에서 `CONTENT_LIST` 전용 분기가 존재함.
agent.md 규칙("DynamicEngine 내부에 screen_id 분기 금지")의 위반은 아니지만,
신규 화면 추가 시 이 패턴을 무분별하게 확장하지 않도록 주의.

```tsx
// CommonPage 레벨 분기 (엔진 외부이므로 허용)
{screenId === "CONTENT_LIST" && <FilterToggle ... />}
{screenId === "CONTENT_LIST" && <Pagination ... />}
```

## 전체 레이아웃 구조 분석 (2026-03-05)

> 분석 파일: `app/layout.tsx`, `components/layout/AppShell.tsx`,
> `components/layout/Header.tsx`, `components/layout/Sidebar.tsx`,
> `components/fields/RecordTimeComponent.tsx`

### Provider 계층 (app/layout.tsx)

```
ReactQueryProvider
  └── AuthProvider
        └── MetadataProvider
              └── AppShell
                    └── {children}  ← CommonPage → DynamicEngine
```

---

### AppShell 렌더링 분기 (AppShell.tsx)

```
<div class="app-wrapper is-pc|is-mobile">

  [PC]     → <Sidebar />
  [Mobile] → <Header />

  <main class="main-contents-area">
    [PC only] <div class="pc-top-utility">
                <RecordTimeComponent />
              </div>

    <section class="page-view-container">
      {children}  ← SDUI DynamicEngine 렌더링 영역
    </section>
  </main>
</div>
```

---

### Header.tsx (모바일 전용, isMobile === false 시 null 반환)

```
<header class="mobile-header">
  <div class="header-top-row">
    로고 (ROUTE → /view/MAIN_PAGE)
    | 로그인 버튼 or 로그아웃 버튼 (GLOBAL_HEADER 메타데이터)
  </div>
  <div class="header-bottom-row">
    <div class="time-card">
      <RecordTimeComponent />   ← 모바일에도 이미 존재
    </div>
  </div>
</header>
```

- GLOBAL_HEADER 메타데이터를 `flattenMetadata()`로 평탄화 후 특정 componentId 직접 조회
- DynamicEngine을 통하지 않고 `handleAction`으로 수동 렌더링
- 로그인 여부: `AuthContext.isLoggedIn` 기준
- socialType === 'K' → kakao 로그아웃 / 그 외 → 일반 로그아웃

---

### Sidebar.tsx (PC 전용, isPc === false 시 null 반환)

```
<aside class="pc-sidebar">
  <div class="sidebar-top">
    로고 (ROUTE → /view/MAIN_PAGE)
    <nav>
      홈        → /view/MAIN_PAGE   (하드코딩)
      약속 관리  → /view/SET_TIME_PAGE (하드코딩)
    </nav>
  </div>
  <div class="sidebar-footer">
    로그인 or 로그아웃 버튼 (GLOBAL_HEADER 메타데이터)
  </div>
</aside>
```

- nav 항목은 SDUI 메타데이터가 아닌 하드코딩
- RecordTimeComponent 없음 (AppShell의 pc-top-utility에서 처리)

---

### RecordTimeComponent 위치 요약

| 플랫폼 | 파일         | 위치                                  |
| ------ | ------------ | ------------------------------------- |
| PC     | AppShell.tsx | `pc-top-utility` (메인 콘텐츠 상단) |
| Mobile | Header.tsx   | `header-bottom-row > time-card`     |

**RecordTimeComponent는 PC/모바일 모두 이미 존재함.**

#### RecordTimeComponent 렌더링 분기

```
goalTime 없음:
  <div class="no-goal-container" onClick={handleLinkToSetup}>
    <p>오늘의 약속 시간은 언제인가요?</p>
    <button class="setup-button">시간 설정하기</button>
  </div>

goalTime 있음:
  <div class="time-record-container">
    clock-display-box: 목표시간 / formatTimePretty / remainTimeText
    arrival-button-container: <ArrivalButton />
    more-list-section:
      + 시간 추가 버튼 (항상 표시)
      ••• 버튼 (goalList.length > 0 일 때)
        → goal-list-popup (isListOpen 시 표시)
  </div>
```

### MAIN_PAGE 벤토 그리드 전환 시 영향 범위

| 변경 항목                     | 대상                                            | 방식                                               | 상태               |
| ----------------------------- | ----------------------------------------------- | -------------------------------------------------- | ------------------ |
| 벤토 그리드 레이아웃          | `app/styles/pages.css` line 1715~             | 신규 CSS 추가                                      | ✅ 완료            |
| MAIN_PAGE root css_class      | DB `ui_metadata` MAIN_SECTION                 | UPDATE →`main-bento`                            | ✅ V8 SQL 포함     |
| 기존 카드 삭제                | DB `ui_metadata` (MAIN_TOP_CARD 등 + 자식)    | DELETE                                             | ✅ V8 SQL 포함     |
| USER 벤토 카드 3개            | DB `ui_metadata` 신규 INSERT                  | GROUP/TEXT/BUTTON/TIME_RECORD_WIDGET               | ✅ V8 SQL 포함     |
| GUEST 벤토 카드 3개           | DB `ui_metadata` 신규 INSERT (`ROLE_GUEST`) | GROUP/TEXT/BUTTON/TIME_RECORD_WIDGET               | ✅ V8 SQL 포함     |
| RecordTimeComponent 위치 변경 | 변경 없음                                       | 기존 AppShell/Header 유지, MAIN_PAGE에 DB로도 추가 | ✅ TSX 수정 불필요 |

---

## MAIN_PAGE 벤토 그리드 구현 결과 (2026-03-06)

### 생성된 파일

| 파일                                                                         | 내용                                                       |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `SDUI-server/src/main/resources/db/migration/V8__main_page_bento_grid.sql` | UPDATE+DELETE+INSERT (USER 11행, GUEST 11행)               |
| `metadata-project/app/styles/pages.css` (line 1715~)                       | `.main-bento`, `.bento-card*`, RecordTime override CSS |

### DB 구조 확인 결과 (실제 SELECT 기반)

| 항목              | 실제 값                                            | 비고                      |
| ----------------- | -------------------------------------------------- | ------------------------- |
| root component_id | `MAIN_SECTION`                                   | parent_group_id IS NULL   |
| 현재 css_class    | `main-responsive-grid`                           | →`main-bento`로 UPDATE |
| 기존 카드 3개     | MAIN_TOP_CARD, MAIN_LOGIN_CARD, MAIN_TUTORIAL_CARD | 전체 삭제                 |
| action_type       | `LINK`                                           | 초안의 `ROUTE` 수정됨   |
| group_direction   | `COLUMN` (기본값)                                | 모든 기존 행 동일         |

### RBAC 구현 확인 결과 (UiService.java + UiController.java)

| 항목                   | 내용                                                  |
| ---------------------- | ----------------------------------------------------- |
| 필터링 구현            | ✅`isAccessible()` 구현됨 (2026-03-01 추가)         |
| 미인증 role 값         | `"ROLE_GUEST"` — Controller에서 자동 적용          |
| `allowed_roles=NULL` | 모든 역할에게 표시 →**GUEST 카드에 사용 금지** |
| GUEST 카드 설정값      | `'ROLE_GUEST'` (NULL 아님)                          |
| USER 카드 설정값       | `'ROLE_USER'`                                       |

### componentMap 확인 결과 (componentMap.tsx)

`TIME_RECORD_WIDGET` ✅ 등록됨:

```typescript
TIME_RECORD_WIDGET: withRenderTrack(RecordTimeComponent, "RecordTimeComponent")
```

전체 등록 component_type: MODAL, INPUT, TEXT, PASSWORD, BUTTON, SNS_BUTTON, LINK_BUTTON, IMAGE, EMAIL_SELECT, EMOTION_SELECT, SELECT, TEXTAREA, TIME_RECORD_WIDGET, DATETIME_PICKER, TIME_SELECT, TIME_SLOT_RECORD, ADDRESS_SEARCH_GROUP, GROUP (18개)

### CSS 구조 핵심 사항

```
pages.css 추가 클래스:
  .main-bento             → grid 컨테이너 (3열, 모바일 1열)
  .bento-card             → 공통 카드 (overflow:visible — popup 클리핑 방지)
  .col-span-2 / .col-span-3 → 그리드 열 점유
  .bento-card-appointment/no-goal/diary/login/dark → 타입별 배경색
  .bento-card-body/icon/title/desc/arrow/tag → 카드 내부 레이아웃
  .bento-card .time-record-container → position:sticky override (relative로)
  .bento-card .no-goal-container    → flex:8 override (flex:1로)
```

---

## 이슈 및 해결 기록

### 2026-03-07: 레이아웃 CSS / SSR Hydration 불일치

- **현상:** 모바일 뷰에서 `pc-top-utility` 안의 `RecordTimeComponent`(⏰ 카드)가 벤토 그리드 위에 중복 표시되는 경우가 간헐적으로 발생. 또한 1000~1023px 구간에서 JS는 PC로 판단하는데 CSS가 모바일 레이아웃을 강제 적용하는 불일치 존재.
- **원인 1 — CSS 미디어 쿼리 불일치:**

  - `pages.css:229`: `@media (max-width: 1023px)`로 `.group-MAIN_TOP_CARD` 모바일 레이아웃 적용
  - JS `useDeviceType` 기준은 `< 1000px` (999px 이하가 모바일)
  - 1000~1023px 구간: JS는 `is-pc` 클래스 부여 → PC 레이아웃 의도, CSS는 여전히 모바일 강제
- **원인 2 — SSR Hydration 플래시:**

  - `useDeviceType.tsx`: 초기값 `useState(false)` → 서버/첫 렌더링 시 항상 `isMobile = false`
  - `AppShell`에서 `isPc = true`로 시작 → 모바일 기기에서도 첫 렌더에 `pc-top-utility` + `RecordTimeComponent` 렌더링
  - `useEffect`가 실행되며 `isMobile = true`로 전환되지만 그 전에 이미 화면에 그려짐
- **해결:**

  - `pages.css:229`: `@media (max-width: 1023px)` → `@media (max-width: 999px)` (JS 기준 통일)
  - `useDeviceType.tsx`: 초기값 `false` → `true` (모바일 우선 — SSR 렌더는 모바일 레이아웃으로 시작, 실제 PC라면 `useEffect` 후 전환)
- **관련 파일:**

  - `metadata-project/app/styles/pages.css` line 229
  - `metadata-project/hooks/useDeviceType.tsx` line 4

---

## 분석 히스토리

| 날짜                                    | 분석 내용                                         | 결론                                                                    |
| --------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| 2026-02-28                              | 전체 프론트엔드 코드 초기 분석                    | 위 내용 도출                                                            |
| 2026-02-28                              | [P2] 민감정보 로그 노출 감사                      | 아래 섹션 참고                                                          |
| 2026-03-05                              | 렌더링 파이프라인 상세 분석                       | 위 섹션 참고                                                            |
| 2026-03-05                              | 전체 레이아웃 구조 분석 (AppShell/Header/Sidebar) | 위 섹션 참고                                                            |
| 2026-03-06                              | MAIN_PAGE 벤토 그리드 전환 — DB SELECT 확인      | SQL 버그 3개 발견 수정 (parent_group_id 누락, DELETE 누락, ROUTE→LINK) |
| 2026-03-06                              | UiService/UiController RBAC 코드 확인             | isAccessible() 구현됨, GUEST 카드 NULL→'ROLE_GUEST' 수정               |
| 2026-03-06                              | componentMap.tsx 확인                             | TIME_RECORD_WIDGET ✅ 등록됨                                            |
| 2026-03-06                              | V8 SQL + pages.css CSS 생성 완료                  | 구현 파일 2개 생성, QA 검증 대기                                        |
| 2026-03-06                              | 로컬 Docker DB + Flyway 마이그레이션 완전 수정 | `backend_engineer/research.md` 참고                                          |
| 2026-03-08                              | 어드민 URL 라우팅 패턴 도입 (`/view/admin/*`) | MetadataProvider.tsx — admin 세그먼트 감지, page.tsx PROTECTED_SCREENS에 USER_LIST 추가 |
| `axios.tsx` localStorage → 쿠키 전환 | **P1**                                      | ✅ 수정됨 (2026-03-01, localStorage 라인 주석 처리)                     |
| CSP / 보안 헤더 추가                    | **P1**                                      | ✅ 구현됨 (next.config.ts `async headers()`)                          |
| 백엔드 System.out.println 정리          | **P2**                                      | → `backend_engineer/research.md` 참고                                  |
| 프로덕션 `secure(true)` 설정          | **P2**                                      | → `backend_engineer/research.md` 참고                                  |

---

## 튜토리얼 페이지 (Playground) 구현 분석 (2026-03-07)

### 개요
SDUI의 작동 원리를 시각적으로 보여주기 위한 인터랙티브 튜토리얼 페이지입니다.
사용자가 UI를 조작하면 JSON 메타데이터가 실시간으로 변하는 것을 확인할 수 있습니다.

### 주요 기능
1. **Split View**: 좌측(Preview) ↔ 우측(Editor & JSON) 분할 레이아웃
2. **실시간 렌더링**: `DynamicEngine`을 재사용하여 메타데이터 변경 즉시 반영
3. **Drag & Drop**: 컴포넌트 리스트 순서 변경 (HTML5 Drag API 사용)
4. **Versioning**:
   - '적용' 시 DB에 `TUTORIAL_DEMO`로 저장
   - 기존 데이터는 `TUTORIAL_DEMO_v{timestamp}`로 자동 백업
   - '히스토리' 버튼으로 이전 버전 조회 및 롤백 가능

### 기술 스택 및 파일
| 구분 | 파일명 | 역할 |
|---|---|---|
| **DB** | `V9__tutorial_page.sql` | `TUTORIAL_PAGE` 화면 및 `TUTORIAL_PLAYGROUND` 컴포넌트 정의 |
| **FE** | `TutorialPlayground.tsx` | 메인 로직 (State 관리, D&D, API 호출) |
| **BE** | `TutorialController.java` | `/api/ui/tutorial/*` 엔드포인트 제공 |
| **BE** | `TutorialService.java` | 저장, 히스토리 관리, 버전 백업 로직 |

### API 명세
| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/ui/tutorial/save` | 현재 메타데이터 저장 (기존 데이터 백업 수행) |
| `GET` | `/api/ui/tutorial/history` | 저장된 히스토리 버전 목록 조회 |
| `GET` | `/api/ui/tutorial/history/{id}` | 특정 버전의 메타데이터 상세 조회 |

---

## 어드민 URL 라우팅 패턴 (2026-03-08)

### 개요

관리자 전용 화면을 일반 화면과 URL 레벨에서 분리하기 위해 `/view/admin/{screenId}` 패턴 도입.

### URL 구조

| 경로 | screenId | refId | 용도 |
|---|---|---|---|
| `/view/MAIN_PAGE` | `MAIN_PAGE` | null | 일반 화면 |
| `/view/CONTENT_DETAIL/42` | `CONTENT_DETAIL` | `42` | 일반 화면 + refId |
| `/view/admin/USER_LIST` | `USER_LIST` | null | 관리자 화면 |
| `/view/admin/USER_DETAIL/5` | `USER_DETAIL` | `5` | 관리자 화면 + refId |

### 수정 파일

- **`MetadataProvider.tsx`**
  - `finalScreenId` useMemo: `pathSegments[viewIndex+1] === 'admin'`이면 `pathSegments[viewIndex+2]` 반환
  - `contextValue` useMemo: `isAdminPath = slug[0] === 'admin'` 플래그로 `slug[1]` → screenId, `slug[2]` → refId

- **`page.tsx`**: `PROTECTED_SCREENS`에 `"USER_LIST"` 추가 (로그인 필수)

### 주의사항

- `screenMap.ts` 수정 불필요 — admin 경로는 URL 파싱으로 처리, SCREEN_MAP 룩업을 타지 않음
- DB의 `screen_id`는 그대로 `USER_LIST` 사용 (백엔드 `/api/ui/{screenId}` 요청도 `USER_LIST`로 그대로 전달)
- 추후 admin 전용 레이아웃이 필요하면 `isAdminPath` 플래그를 Context에 추가해 활용 가능

---
