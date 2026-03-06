# Architect — Research

> 이 파일은 아키텍처 분석 결과를 기록한다. 모든 설계 결정의 근거가 된다.

---

## 현재 시스템 구조 분석 (2026-02-28 기준)

### 전체 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| Frontend | Next.js | 16.1.3 |
| UI Library | React | 19.2.3 |
| Language (FE) | TypeScript | 5.7.3 |
| Styling | Tailwind CSS | 4.0.0 |
| Data Fetching | TanStack React Query | 5.66.0 |
| HTTP Client | Axios | 1.7.9 |
| Backend | Spring Boot | 3.1.4 |
| Language (BE) | Java | 17 |
| ORM | JPA/Hibernate + MyBatis | - |
| Database | PostgreSQL | 15 |
| Cache | Redis | latest |
| Auth | JWT (jjwt 0.11.5) | - |
| WebSocket | STOMP | - |
| Container | Docker Compose | - |

---

### SDUI 핵심 데이터 플로우

```
URL /view/{screenId}/{refId?}
  → MetadataProvider
      → React Query: GET /api/ui/{screenId}
      → Query Key: {rolePrefix}_{screenId} (RBAC)
      → Stale Time: 5분
  → CommonPage
      → usePageMetadata
          → AUTO_FETCH 컴포넌트 감지
          → POST /api/execute/{sqlKey} (pageData)
      → usePageHook (액션 라우터)
  → DynamicEngine
      → useDynamicEngine (데이터 바인딩)
      → componentMap[component_type] → 렌더링
```

### ui_metadata 테이블 필드 전체 목록

```
ui_id               (PK, auto-increment)
screen_id           (화면 식별자: LOGIN_PAGE, DIARY_LIST 등)
component_id        (컴포넌트 고유 ID)
component_type      (React 컴포넌트 타입: INPUT, TEXT, BUTTON 등)
label_text          (표시 텍스트)
sort_order          (렌더링 순서)
is_required         (필수 입력 여부)
is_readonly         (읽기 전용 여부)
placeholder         (입력 힌트 텍스트)
css_class           (적용할 CSS 클래스명)
action_type         (클릭 시 실행 액션: LOGIN_SUBMIT, ROUTE 등)
ref_data_id         (pageData 키 연결, Repeater 식별자)
group_id            (자신의 그룹 ID)
parent_group_id     (부모 그룹 ID — 트리 구조 핵심)
group_direction     (ROW: 가로 | COLUMN: 세로)
is_visible          (가시성 조건)
inline_style        (인라인 CSS)
data_sql_key        (query_master 연결 키)
default_value       (기본값)
submit_group_id     (폼 제출 그룹)
submit_group_order  (제출 순서)
submit_group_separator (제출 구분자)
```

### 트리 빌딩 알고리즘 분석 (UiService.java)

```
시간 복잡도: O(n) — LinkedHashMap 활용
공간 복잡도: O(n)

단계:
1. screen_id로 모든 레코드 조회 (sort_order ASC)
2. LinkedHashMap<componentId, UiResponseDto> 생성
3. 순회: parent_group_id 있으면 부모의 children에 추가
4. 루트 노드 = parent_group_id가 null 또는 Map에 없는 것
5. 고아 노드(부모 없음) → 루트로 승격

리스크:
- 중복 componentId → 감지 로직 있음 (경고 로그)
- 순환 참조 → 현재 감지 로직 없음 (잠재 무한루프)
```

### Redis 캐시 키 구조

| 키 패턴 | 값 | TTL | 무효화 시점 |
|---------|----|-----|------------|
| `SQL:{sqlKey}` | query_master.query_text | 영구 | query_master 변경 시 수동 삭제 |
| `{userId}` (Refresh Token) | RefreshToken 객체 | 7일 | logout, 토큰 재발급 |

### React Query 캐시 키 구조

| 키 패턴 | Stale Time | 무효화 시점 |
|---------|------------|------------|
| `[metadata, {rolePrefix}_{screenId}]` | 5분 | SUBMIT 액션 후 invalidate |

### componentMap 현황 (17개 타입)

```
MODAL, INPUT, TEXT, PASSWORD, BUTTON, SNS_BUTTON, IMAGE,
EMAIL_SELECT, EMOTION_SELECT, SELECT, TEXTAREA,
TIME_RECORD_WIDGET, DATETIME_PICKER, TIME_SELECT,
TIME_SLOT_RECORD, ADDRESS_SEARCH_GROUP, GROUP
```

### screenMap 현황 (8개 화면)

```
"/"              → MAIN_PAGE
"/LOGIN_PAGE"    → LOGIN_PAGE
"/DIARY_LIST"    → DIARY_LIST
"/DIARY_WRITE"   → DIARY_WRITE
"/DIARY_DETAIL"  → DIARY_DETAIL
"/DIARY_MODIFY"  → DIARY_MODIFY
"/SET_TIME_PAGE" → SET_TIME_PAGE
"/TUTORIAL_PAGE" → TUTORIAL_PAGE
```

### 보호 화면 목록 (인증 필요)

```
DIARY_LIST, DIARY_WRITE, DIARY_DETAIL, DIARY_MODIFY, MY_PAGE
```

### 인증 플로우 분석

```
회원가입: POST /api/auth/register → 이메일 발송 → VERIFY_CODE_PAGE
인증:     POST /api/auth/verify-code → verifyYn='Y'
로그인:   POST /api/auth/login → AccessToken(1h) + RefreshToken(7d)
카카오:   GET  /api/kakao → OAuth → 자동 회원가입/로그인
갱신:     POST /api/auth/refresh → 새 AccessToken
로그아웃: POST /api/auth/logout → Redis RefreshToken 삭제
```

### 현재 확인된 아키텍처 리스크

1. **순환 참조 감지 없음**: `UiService` 트리 빌딩 시 `parent_group_id` 순환 참조 발생 시 무한 루프 가능성
2. **Redis 캐시 수동 관리**: `SQL:{sqlKey}` 캐시는 자동 만료 없음. 쿼리 변경 시 수동 삭제 필요
3. **Metadata 이중 필드**: `Metadata` 타입에 `componentId`와 `component_id` 모두 존재 (snake_case, camelCase 혼용)
4. **단일 DynamicEngine**: 모든 화면이 동일한 엔진을 사용. 특정 화면 전용 로직이 엔진에 추가될 위험

---

## 분석 히스토리

| 날짜 | 분석 내용 | 결론 |
|------|-----------|------|
| 2026-02-28 | 전체 코드베이스 초기 분석 | 위 내용 도출 |