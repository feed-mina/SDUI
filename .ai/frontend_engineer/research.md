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

## [P2] 민감정보 로그 노출 감사 결과 ← 서브에이전트 분석 (2026-02-28)

### 현황 요약
프로젝트 전체에서 **75개 이상의 민감정보 노출 로그**가 발견되었다. 프론트엔드에서는
`useUserActions.tsx:76`이 로그인 시 사용자 비밀번호를 `console.log`로 직접 노출하고 있으며,
백엔드에서는 원본 비밀번호·JWT 클레임·이메일 인증코드·SQL 쿼리+파라미터가 `System.out.println`으로
서버 로그에 그대로 기록된다. `axios.tsx`의 `localStorage` 기반 JWT 저장은 XSS 공격 시 토큰 탈취를 허용한다.

---

### Critical 위험 목록 (즉시 삭제 필요)

| 파일 | 라인 | 문제 | 수정 방법 |
|-----|------|-----|---------|
| `hook/useUserActions.tsx` | 70 | `console.log('뭐야 ')` | 삭제 |
| **`hook/useUserActions.tsx`** | **76** | **`console.log('loginData', loginData)`** — 이메일+비밀번호 노출 | **즉시 삭제** |
| `SDUI-server/.../PasswordUtil.java` | **76-77** | `System.out.println("원래 비밀번호: " + rawPassword)` | **즉시 삭제** |
| `SDUI-server/.../JwtAuthenticationFilter.java` | 93,102-107,130,134,137 | JWT Claims·이메일·userSqno·authorities 로깅 | **즉시 삭제** |
| `SDUI-server/.../JwtUtil.java` | 110 | `System.out.println("issuer 값: " + issuer)` | 삭제 |
| `SDUI-server/.../infra/EmailUtil.java` | 15 | 이메일 + 인증코드 평문 노출 | 삭제 |
| `SDUI-server/.../DynamicExecutor.java` | 26-29 | 실행 SQL 전체 + 바인딩 파라미터 로깅 | 삭제 또는 마스킹 |
| `SDUI-server/.../KakaoService.java` | 98-101 | 카카오 이메일·userId 로깅 | 삭제 |
| `SDUI-server/.../QueryMasterService.java` | 30,35 | SQL 쿼리 키 노출 | 삭제 |

**Critical 합계: 19줄**

---

### Warning 목록 (logger.debug()로 교체 권장)

| 파일 | 줄 수 | 내용 |
|-----|------|-----|
| `domain/diary/service/DiaryService.java` | 7개 | offset, diaryReq, diary 객체 |
| `domain/diary/controller/DiaryController.java` | 11개 | 요청 객체, IP, diaryRequest |
| `domain/query/controller/CommonQueryController.java` | 3개 | SQL 쿼리 및 바인딩 파라미터 |
| `domain/user/service/AuthService.java` | 4개 | User 객체·에러 메시지 |
| `domain/time/service/GoalTimeQueryService.java` | 10개 | 캐시 키, SQL, params, targetTime |
| `domain/time/controller/GoalTimeController.java` | 2개 | targetTime, userSqno |
| `domain/ui/controller/UiController.java` | 3개 | screenId 요청 로깅 |
| `domain/ui/service/UiService.java` | 2개 | 컴포넌트 ID |

**Warning 합계: 56줄 | 전체 합계: 75개**

---

### localStorage JWT 저장 문제 (`axios.tsx:19, 49`)

**현재 코드**
```typescript
const token = localStorage.getItem('accessToken');   // XSS 시 탈취 가능
localStorage.setItem('accessToken', newAccessToken); // XSS 시 저장·노출
```

**위험성**: XSS 공격으로 `localStorage.accessToken` 접근 → JWT 탈취 → 계정 완전 장악

**마이그레이션 방향**
- 백엔드: `Set-Cookie: accessToken=...; HttpOnly; Secure; SameSite=Strict`
- 프론트엔드: `axios.tsx` localStorage 코드 제거, `withCredentials: true` 유지

---

### 즉시 삭제해야 할 로그 목록 (파일:라인)

```
[프론트엔드]
useUserActions.tsx:70   — console.log('뭐야 ')
useUserActions.tsx:76   — console.log('loginData', loginData)   ← 최우선

[백엔드 Critical]
PasswordUtil.java:76-77             — 원본/암호화 비밀번호 출력   ← 최우선
JwtAuthenticationFilter.java:93,102-107,130,134,137 — JWT 클레임
JwtUtil.java:110                    — issuer 값
EmailUtil.java:15                   — 이메일+인증코드
DynamicExecutor.java:26-29          — SQL+파라미터
KakaoService.java:98-101            — 카카오 이메일·userId
QueryMasterService.java:30,35       — SQL 캐시 키
```

---

### 대응 우선순위
1. **24시간 내**: `useUserActions.tsx:76`, `PasswordUtil.java:76-77`, `JwtAuthenticationFilter` 전체 민감 로그 삭제
2. **1주일 내**: 나머지 Warning 로그를 `SLF4J logger.debug()`로 전환, 프로덕션 DEBUG 비활성화
3. **중기**: localStorage → HttpOnly 쿠키 마이그레이션, CSP 헤더 추가