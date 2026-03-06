# Frontend Engineer — Research

> 이 파일은 프론트엔드 구현 분석 결과를 기록한다.

---

## 핵심 파일 지도 (2026-02-28 기준)

### DynamicEngine 코어

| 파일 | 역할 | 변경 빈도 |
|------|------|----------|
| `components/DynamicEngine/DynamicEngine.tsx` | 트리 순회 + 컴포넌트 렌더링 | 낮음 (핵심 엔진) |
| `components/DynamicEngine/useDynamicEngine.tsx` | 데이터 바인딩 로직 | 낮음 |
| `components/DynamicEngine/type.ts` | Metadata 타입 정의 | 중간 |
| `components/constants/componentMap.tsx` | component_type → 컴포넌트 매핑 | 중간 (신규 컴포넌트 시) |
| `components/constants/screenMap.ts` | URL → screen_id 매핑 | 중간 (신규 화면 시) |

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

| 파일 | component_type | 특이사항 |
|------|----------------|---------|
| InputField.tsx | INPUT | Enter키 SUBMIT, 비밀번호 감지 |
| TextField.tsx | TEXT | 표시 전용 |
| PasswordField.tsx | PASSWORD | showPassword prop |
| ButtonField.tsx | BUTTON, SNS_BUTTON | onAction 콜백 |
| SelectField.tsx | SELECT | 드롭다운 |
| TextAreaField.tsx | TEXTAREA | 여러 줄 |
| Modal.tsx | MODAL | activeModal === componentId 조건부 표시 |
| ImageField.tsx | IMAGE | |
| DateTimePicker.tsx | DATETIME_PICKER | |
| TimeSelect.tsx | TIME_SELECT | |
| TimeSlotRecord.tsx | TIME_SLOT_RECORD | |
| AddressSearchGroup.tsx | ADDRESS_SEARCH_GROUP | 다음 우편번호 API |
| EmotionSelectField.tsx | EMOTION_SELECT | 감정 인덱스(정수) |
| EmailSelectField.tsx | EMAIL_SELECT | 도메인 선택 |
| PhoneVerify.tsx | (미등록?) | 전화번호 인증 |
| ArrivalButton.tsx | (미등록?) | 도착 버튼 |
| RecordTimeComponent.tsx | TIME_RECORD_WIDGET | |
| Pagination.tsx | (DynamicEngine 외부) | DIARY_LIST에서 직접 사용 |

---

## 테스트 환경

| 항목 | 기술 | 설정 파일 |
|------|------|----------|
| 단위/통합 테스트 | Jest 29.7 | `jest.config.js` |
| React 테스팅 | React Testing Library 16.3 | - |
| API 모킹 | MSW 2.7 | - |
| E2E | Playwright 1.50 | `playwright.config.ts` |
| 리포트 | TestLogger.ts | `tests/logs/frontend-report.html` |
| 변환기 | @swc/jest | jest.config.js |

---

## 성능 관련 확인 사항

| 패턴 | 구현 위치 | 목적 |
|------|----------|------|
| withRenderTrack HOC | componentMap의 모든 컴포넌트 | 렌더 횟수 추적 |
| React.memo / useMemo | 개별 컴포넌트 | 불필요한 리렌더링 방지 |
| React Query stale 5분 | MetadataProvider | API 중복 호출 방지 |
| formDataRef | useBaseActions | 클로저 문제 방지 |

---

## 분석 히스토리

| 날짜 | 분석 내용 | 결론 |
|------|-----------|------|
| 2026-02-28 | 전체 프론트엔드 코드 초기 분석 | 위 내용 도출 |
| 2026-02-28 | [P2] 민감정보 로그 노출 감사 | 아래 섹션 참고 |

---

## [P2] Security Audit — JWT & XSS 취약점 현황 분석 (코드 재검증)

**분석 일시:** 2026-02-28
**참고 커밋:** b2ec8d5 (fix: 민감정보 로깅 삭제 및 보안 로직 보강)

> **⚠️ 상태 업데이트:** 이전 분석은 commit b2ec8d5 이전 코드 기준.
> 재검증 결과: 프론트엔드 민감 로그 수정됨. 백엔드 HttpOnly 쿠키 지원 추가됨.
> 그러나 프론트엔드가 여전히 localStorage를 읽고 있어 XSS 취약점 유효.

---

### JWT 토큰 저장 방식 현황 (실제 코드 기준)

| 파일 | 위치 | 저장 방식 | 위험도 |
|------|------|----------|--------|
| `axios.tsx` | Line 19 | `localStorage.getItem('accessToken')` | **HIGH** — XSS 시 탈취 가능 |
| `axios.tsx` | Line 49 | `localStorage.setItem('accessToken', newAccessToken)` | **HIGH** |
| `axios.tsx` | Line 57 | `localStorage.removeItem('accessToken')` | MEDIUM |
| `AuthContext.tsx` | Line 73-74 | `/api/auth/me` 호출 (HttpOnly 쿠키 자동 전송) | **LOW** — 안전 |

**결론:** 백엔드는 HttpOnly 쿠키로 토큰을 전달하지만, 프론트엔드 `axios.tsx`가 여전히 localStorage를 읽어 아키텍처 불일치 + XSS 취약점 유효.

### 백엔드 로그인 응답 분석 (AuthController.java) — 업데이트됨 ✅

**로그인 응답 방식:** HttpOnly Set-Cookie (Lines 86-122)

```java
// AuthController.java:87-102
ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", tokenResponse.getAccessToken())
        .httpOnly(true)       // ✅ JavaScript 접근 불가
        .secure(false)        // 로컬 테스트용 (프로덕션: true 필요)
        .path("/")
        .maxAge(60 * 60)      // 1시간
        .sameSite("Lax")
        .build();

ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
        .httpOnly(true)       // ✅ JavaScript 접근 불가
        .secure(false)
        .path("/")
        .maxAge(60 * 60 * 24 * 7)  // 7일
        .sameSite("Lax")
        .build();
```

**이전 분석(localStorage → HttpOnly 마이그레이션 필요)의 백엔드 부분은 이미 완료됨.**
프론트엔드(`axios.tsx`) 수정만 남음.

### Refresh Token 저장 방식

| 저장 위치 | 방식 | 위험도 |
|----------|------|--------|
| 백엔드 응답 | HttpOnly 쿠키 (7일) | **LOW** — JavaScript 접근 불가 |
| 프론트엔드 읽기 | localStorage 미사용 (쿠키 자동 전송) | **LOW** — 안전 |

**Refresh Token은 안전하게 처리됨.** Access Token의 localStorage 사용이 유일한 문제.

---

### 민감 정보 로깅 현황 (commit b2ec8d5 이후 재스캔)

#### 프론트엔드 (수정 완료 ✅)

| 파일 | 라인 | 내용 | 상태 |
|------|------|------|------|
| `useUserActions.tsx` | ~76 (구 위치) | `console.log('loginData', loginData)` | ✅ **삭제됨** |
| `useUserActions.tsx` | ~70 (구 위치) | `console.log('뭐야 ')` | ✅ **삭제됨** |
| `AuthContext.tsx` | 46 | `console.error("Logout API error:", err)` | ✅ 안전 (에러 메시지만) |
| `useUserActions.tsx` | 146, 159 | `console.error(...)`, `console.warn(...)` | ✅ 안전 (디버그 메시지) |

**프론트엔드 민감 로그: 0개 (commit b2ec8d5로 해결)**

#### 백엔드 (잔존 이슈 — System.out.println ~35개)

| 파일 | 개수 | 민감도 |
|------|-----|--------|
| `AuthService.java` | 4개 | MEDIUM — User 객체, 에러 메시지 |
| `DiaryService.java` | 7개 | MEDIUM — 다이어리 요청 객체 |
| `GoalTimeQueryService.java` | 10개 | MEDIUM — 캐시키, SQL, params |
| `UiController.java` | 3개 | LOW — screenId 로깅 |
| `JwtAuthenticationFilter.java` | 1개 | LOW — System.err |
| 기타 | 10개 | LOW |

**결론:** 백엔드 민감 로그(원본 비밀번호, JWT 클레임, 이메일+인증코드)가 이전 분석에서 발견되었으나, commit b2ec8d5 범위에서 수정 여부 재확인 필요. `System.out.println` 전반적 정리 권고.

---

### CSP / 보안 헤더 현황 (next.config.ts)

**구성 현황 (Line 1-28):**
- rewrites: `/api/*` → `http://localhost:8080/api/*` (프록시)
- redirects: `/` → `/view/MAIN_PAGE`

**보안 헤더:**

| 헤더 | 설정 여부 |
|------|---------|
| Content-Security-Policy | ❌ 미구성 |
| X-Frame-Options | ❌ 미구성 |
| X-Content-Type-Options | ❌ 미구성 |
| Strict-Transport-Security | ❌ 미구성 |

---

### XSS 공격 시나리오 위험도

| 시나리오 | 현재 위험도 | 이유 |
|---------|-----------|------|
| XSS로 Access Token 탈취 | **CRITICAL** | localStorage 사용 중 — JavaScript 접근 가능 |
| XSS로 Refresh Token 탈취 | **LOW** | HttpOnly 쿠키 — JavaScript 접근 불가 |
| 탈취 AccessToken으로 API 접근 | **CRITICAL** | 1시간 동안 계정 완전 제어 가능 |
| CSP 없어 XSS 삽입 쉬움 | **HIGH** | 인라인 스크립트 실행 차단 없음 |

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

2. 백엔드 `System.out.println` → `logger.debug()` 전환 (프로덕션 배포 전)

**중기 (아키텍처 변경):**

1. **Access Token → Memory 저장** (`axios.tsx` localStorage 제거):
   - 로그인 시 HttpOnly 쿠키만 사용 (이미 백엔드 지원)
   - `axios.tsx:19` `localStorage.getItem` → 삭제 (쿠키 자동 전송으로 대체)
   - `axios.tsx:49` `localStorage.setItem` → 삭제

2. **프로덕션 배포 시 필수:**
   - `AuthController.java` `secure(false)` → `secure(true)`
   - `sameSite("Lax")` → `sameSite("Strict")` 검토

---

### 수정 우선순위

| 항목 | 우선순위 | 상태 |
|------|---------|------|
| `useUserActions.tsx:76` 민감 로그 | 완료 | ✅ commit b2ec8d5 |
| 백엔드 HttpOnly 쿠키 설정 | 완료 | ✅ 이미 구현됨 |
| `axios.tsx` localStorage → 쿠키 전환 | **P1** | ❌ 미수정 |
| CSP / 보안 헤더 추가 | **P1** | ❌ 미수정 |
| 백엔드 System.out.println 정리 | **P2** | ❌ 미수정 |
| 프로덕션 `secure(true)` 설정 | **P2** | ❌ 미수정 |