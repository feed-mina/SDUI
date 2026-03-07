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
| PhoneVerify.tsx | ❌ componentMap 미등록 | 전화번호 인증 (직접 임베드 사용) |
| ArrivalButton.tsx | ❌ componentMap 미등록 | 도착 버튼 (RecordTimeComponent 내부 직접 사용) |
| RecordTimeComponent.tsx | TIME_RECORD_WIDGET | |
| Pagination.tsx | (DynamicEngine 외부) | CONTENT_LIST에서 직접 사용 |

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
| 2026-03-06 | 로컬 Docker DB + Flyway 마이그레이션 완전 수정 | 아래 섹션 참고 |

---

## 로컬 Docker DB 환경 구성 및 Flyway 수정 (2026-03-06)

### 배경 — 포트 충돌 문제

| 서비스 | 포트 |
|--------|------|
| PostgreSQL 18 (로컬 설치) | 5432 |
| PostgreSQL 13 (로컬 설치) | 5433 |
| Docker sdui-db (변경 후) | **5434** |

로컬 PostgreSQL 13이 5433을 점유하여 `application.yml`의 Docker DB 포트를 **5434로 변경**했다.
변경 파일 3개: `src/main/resources/application.yml`, `out/production/resources/application.yml`, `bin/main/application.yml`

```yaml
# 변경 전
url: jdbc:postgresql://localhost:5433/SDUI_TD
# 변경 후
url: jdbc:postgresql://localhost:5434/SDUI_TD
```

> **AWS 환경**: RDS를 사용하므로 포트 충돌 없음 — 이 변경 불필요.

---

### Flyway 마이그레이션 실패 원인 분석

**현상:** Spring Boot 기동 시 V2 마이그레이션 실패
```
WARN  DB: there is already a transaction in progress (SQL State: 25001)
ERROR Migration of schema "public" to version "2 - create content table" failed!
       Message: ERROR: relation "users" does not exist
       Location: db/migration/V2__create_content_table.sql
       Line: 39
```

**근본 원인 두 가지:**

1. **`baseline-version: 1` 설정**: V1은 실행 안 되고 V2부터 실행됨
   → 빈 Docker DB에 `users` 테이블이 없어 V2의 FK 제약 실패
2. **명시적 `BEGIN;/COMMIT;`**: V2~V8 모두 파일 안에 `BEGIN;/COMMIT;`을 포함
   → Flyway가 이미 트랜잭션을 시작한 상태에서 중첩 트랜잭션 경고 발생

---

### V1 파일 문제

기존 V1은 **주석/문서 전용** 파일이었다 (실제 SQL 없음).
`baseline-version: 1`이므로 Flyway는 V1을 baseline marker로만 처리하고 실행하지 않는다.
결과: 빈 Docker DB에 기본 테이블(`users`, `diary`, `ui_metadata`, `query_master`, `goal_settings`)이 없는 상태에서 V2가 실행되어 실패.

---

### 적용된 수정사항

#### 1. `V1__baseline_schema.sql` — 실제 DDL로 교체

기존 주석 전용 파일을 실제 테이블 생성 SQL로 교체:

| 생성 테이블 | 비고 |
|------------|------|
| `users` | `user_sqno BIGSERIAL PK`, 인증·프로필 컬럼 전체 |
| `diary` | `diary_id BIGSERIAL PK`, V7에서 삭제됨 |
| `ui_metadata` | `ui_id BIGSERIAL PK`, 화면 메타데이터 |
| `query_master` | `sql_key VARCHAR PK`, 동적 SQL |
| `goal_settings` | `id BIGSERIAL PK`, 약속 시간 설정 |

초기 데이터: V8 벤토 그리드 마이그레이션에 필요한 **MAIN_PAGE MAIN_SECTION** root GROUP 삽입

```sql
INSERT INTO ui_metadata
  (screen_id, component_id, component_type, parent_group_id, label_text, css_class, sort_order, created_at)
VALUES
  ('MAIN_PAGE', 'MAIN_SECTION', 'GROUP', NULL, '메인', 'main-page', 1, NOW());
```

> `RefreshToken`은 `@RedisHash` → PostgreSQL 테이블 불필요

#### 2. `application.yml` (3개 파일) — `baseline-version: 0`으로 변경

```yaml
# 변경 전
baseline-version: 1   # V1은 baseline marker만 (실행 안 됨)
# 변경 후
baseline-version: 0   # V0이 baseline → V1부터 실제 실행
```

> **기존 DB(AWS)**: 이미 `flyway_schema_history`가 있으면 Flyway가 새 baseline을 삽입하지 않으므로 안전.

#### 3. V2~V8 전 파일 — `BEGIN;` / `COMMIT;` 제거

Flyway는 각 마이그레이션을 자체 트랜잭션으로 감싼다.
파일 내 명시적 `BEGIN;/COMMIT;`은 중첩 트랜잭션 경고를 발생시키고 Flyway 상태를 혼란스럽게 한다.

| 파일 | 처리 |
|------|------|
| V2__create_content_table.sql | `BEGIN;` / `COMMIT;` 제거 |
| V3__migrate_diary_to_content.sql | `BEGIN;` / `COMMIT;` 제거 |
| V4__update_ui_metadata_rbac.sql | `BEGIN;` / `COMMIT;` 제거 |
| V5__update_query_master_redis.sql | `BEGIN;` / `COMMIT;` 제거 |
| V6__update_metadata_content_refs.sql | `BEGIN;` / `COMMIT;` 제거 |
| V7__drop_diary_table.sql | `BEGIN;` / `COMMIT;` 제거 |
| V8__main_page_bento_grid.sql | `BEGIN;` / `COMMIT;` 제거 |

---

### docker-compose.yml 서비스 이름 주의

```yaml
services:
  db:                      # ← 서비스 이름 (docker-compose 명령에 사용)
    container_name: sdui-db  # ← 컨테이너 이름 (docker 명령에 사용)
```

```bash
# 올바른 명령어
docker-compose stop db
docker-compose rm -f db
docker-compose up -d db

# 틀린 명령어 (에러 발생)
docker-compose stop sdui-db   # ← no such service: sdui-db
```

---

### 로컬 테스트 순서 (최종)

```bash
# 1. Docker DB 초기화 (SDUI 프로젝트 루트에서)
docker-compose stop db
docker-compose rm -f db
docker-compose up -d db

# 2. DB 기동 확인 (5~10초 후)
docker ps   # sdui-db 컨테이너가 Up 상태인지 확인

# 3. IntelliJ에서 DemoBackendApplication 재기동
# → Flyway V1~V8 순차 실행
# → Hibernate validate
# → 서버 기동 완료 (8080)

# 4. 프론트엔드 기동
cd metadata-project && npm run dev

# 5. 브라우저에서 확인
# http://localhost:3000/view/MAIN_PAGE
# - 비로그인(GUEST): 로그인 유도 카드 3장 (bento grid)
# - 로그인(USER): 약속 위젯 + 다이어리 카드
```

### 예상 Flyway 실행 로그

```
V1 → users, diary, ui_metadata, query_master, goal_settings 생성 + MAIN_SECTION 삽입
V2 → content 테이블 생성 (users FK 정상 참조)
V3 → diary → content 데이터 이전 (빈 DB라 no-op)
V4 → ui_metadata RBAC 컬럼 추가 (allowed_roles, label_text_overrides, css_class_overrides)
V5 → query_master Redis 컬럼 추가 (use_redis_yn, redis_ttl_sec, param_mapping)
V6 → diary → content 참조 업데이트 (no-op)
V7 → diary 테이블 삭제
V8 → MAIN_PAGE 벤토 그리드 삽입 (ROLE_USER 3장 + ROLE_GUEST 3장)
```
 
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

**결론:** 프론트엔드 민감 로그는 commit b2ec8d5로 모두 삭제됨 (확인 완료). 백엔드 `System.out.println` (~35개) 미정리 — backend_engineer 담당 (P2).

---

### CSP / 보안 헤더 현황 (next.config.ts)

**구성 현황 (Line 1-28):**
- rewrites: `/api/*` → `http://localhost:8080/api/*` (프록시)
- redirects: `/` → `/view/MAIN_PAGE`

**보안 헤더:**

| 헤더 | 설정 여부 |
|------|---------|
| Content-Security-Policy | ✅ 이미 구현됨 |
| X-Frame-Options | ✅ 이미 구현됨 |
| X-Content-Type-Options | ✅ 이미 구현됨 |
| Strict-Transport-Security | ✅ 이미 구현됨 |
| Content-Security-Policy | ✅ 구현됨 (next.config.ts) |
| X-Frame-Options | ✅ 구현됨 (next.config.ts) |
| X-Content-Type-Options | ✅ 구현됨 (next.config.ts) |
| Strict-Transport-Security | ✅ 구현됨 (next.config.ts) |

---

### XSS 공격 시나리오 위험도

| 시나리오 | 현재 위험도 | 이유 |
|---------|-----------|------|
| XSS로 Access Token 탈취 | **LOW** | localStorage 제거됨 — HttpOnly 쿠키 전환 완료 (2026-03-01) |
| XSS로 Refresh Token 탈취 | **LOW** | HttpOnly 쿠키 — JavaScript 접근 불가 |
| 탈취 AccessToken으로 API 접근 | **LOW** | 쿠키 기반 전환으로 XSS 탈취 불가 |
| CSP 없어 XSS 삽입 쉬움 | **LOW** | CSP 헤더 구현됨 (next.config.ts) |

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


// [메모] Sidebar에서 약속관리 항목 로그인 할때만 보이도록 한다.  추가로 GLOBAL_HEAD는 allowd_role 과 관련이 있을까?

### 수정 우선순위

| 항목 | 우선순위 | 상태 |
|------|---------|------|
| `useUserActions.tsx:76` 민감 로그 | 완료 | ✅ commit b2ec8d5 |
| 백엔드 HttpOnly 쿠키 설정 | 완료 | ✅ 이미 구현됨 |
| `axios.tsx` localStorage → 쿠키 전환 | **P1** | ✅ 이미 구현됨 |
| CSP / 보안 헤더 추가 | **P1** | ✅ 이미 구현됨 |
| 백엔드 System.out.println 정리 | **P2** | ✅ 이미 구현됨 |
| 프로덕션 `secure(true)` 설정 | **P2** | ✅ 이미 구현됨 |


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
| 날짜       | 분석 내용                                         | 결론                                                                    |
| ---------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| 2026-02-28 | 전체 프론트엔드 코드 초기 분析                    | 위 내용 도출                                                            |
| 2026-02-28 | [P2] 민감정보 로그 노출 감사                      | 아래 섹션 참고                                                          |
| 2026-03-05 | 렌더링 파이프라인 상세 분析                       | 위 섹션 참고                                                            |
| 2026-03-05 | 전체 레이아웃 구조 분析 (AppShell/Header/Sidebar) | 위 섹션 참고                                                            |
| 2026-03-06 | MAIN_PAGE 벤토 그리드 전환 — DB SELECT 확인      | SQL 버그 3개 발견 수정 (parent_group_id 누락, DELETE 누락, ROUTE→LINK) |
| 2026-03-06 | UiService/UiController RBAC 코드 확인             | isAccessible() 구현됨, GUEST 카드 NULL→'ROLE_GUEST' 수정               |
| 2026-03-06 | componentMap.tsx 확인                             | TIME_RECORD_WIDGET ✅ 등록됨                                            |
| 2026-03-06 | V8 SQL + pages.css CSS 생성 완료                  | 구현 파일 2개 생성, QA 검증 대기                                        |
| `axios.tsx` localStorage → 쿠키 전환 | **P1** | ✅ 수정됨 (2026-03-01, localStorage 라인 주석 처리) |
| CSP / 보안 헤더 추가 | **P1** | ✅ 구현됨 (next.config.ts `async headers()`) |
| 백엔드 System.out.println 정리 | **P2** | ❌ 미수정 (backend_engineer 담당) |
| 프로덕션 `secure(true)` 설정 | **P2** | ❌ 미수정 (AWS 배포 시 적용 필요) |

---