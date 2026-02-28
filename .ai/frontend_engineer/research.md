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