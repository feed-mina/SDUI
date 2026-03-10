# Planner — Mobile+Web Integration Plan (단계적 전환 방식)

**접근 방식**: Hybrid (Next.js 웹 유지 → Expo 모바일 추가 → 데이터 기반 통합 결정)
**작성일**: 2026-03-01
**담당**: Planner Agent

---

## Research Analysis (연구 분석)

### 단계적 전환 전략

Planner는 **Phase 1**에서 한 번만 작업:

```
Phase 1 (Month 1-2): component_props JSONB 설계 및 DB 설정
  → 플랫폼별 메타데이터 구성
  → 웹/모바일 동시 지원

Phase 2 (Month 3-5): Expo 앱 개발
  → Planner 작업 없음 (Phase 1에서 준비 완료)

Phase 3 (Month 6): 데이터 기반 결정
  → Planner 작업 없음
```

### 주요 화면별 플랫폼 차이점

| 화면 | 웹 (Desktop) | 웹 (Mobile <768px) | Expo 모바일 앱 |
|------|-------------|-------------------|----------------|
| LOGIN_PAGE | 중앙 정렬 (400px) | 전체 너비 | 전체 너비 + 네이티브 키보드 |
| DIARY_LIST | 그리드 (3열) | 리스트 (1열) | 리스트 + FlatList + 스와이프 |
| DIARY_WRITE | 다음 지도 | 다음 지도 | Google Maps + ImagePicker |

---

## Implementation Plan (구현 계획)

### Phase 1: component_props JSONB 설계 (Month 1-2)

#### 목표
- 모든 주요 화면 component_props 설정
- 플랫폼별 props 분리 (common, mobile, web)
- Phase 2에서 Expo 앱이 그대로 사용 가능하도록 준비

#### 1.1 LOGIN_PAGE 메타데이터

```sql
-- 이메일 입력
UPDATE ui_metadata SET component_props = '{
  "common": {
    "type": "email",
    "placeholder": "이메일을 입력하세요",
    "required": true
  },
  "mobile": {
    "keyboardType": "email-address",
    "autoCapitalize": "none",
    "autoComplete": "email"
  },
  "web": {
    "autoComplete": "email"
  }
}'::jsonb WHERE component_id = 'loginEmailInput';

-- 로그인 버튼
UPDATE ui_metadata SET component_props = '{
  "common": {
    "type": "submit",
    "text": "로그인"
  },
  "mobile": {
    "minHeight": 48,
    "fontSize": 16,
    "hapticFeedback": true
  },
  "web": {
    "minHeight": 40,
    "fontSize": 14
  }
}'::jsonb WHERE component_id = 'loginSubmitBtn';
```

#### 1.2 DIARY_LIST 메타데이터

```sql
-- 리스트 컨테이너
UPDATE ui_metadata SET component_props = '{
  "mobile": {
    "viewType": "list",
    "itemHeight": 100,
    "enableSwipeActions": true
  },
  "web": {
    "viewType": "grid",
    "columns": 3,
    "gap": 16
  }
}'::jsonb WHERE component_id = 'diaryListContainer';
```

#### 1.3 DIARY_WRITE 메타데이터

```sql
-- 날짜 선택
UPDATE ui_metadata SET component_props = '{
  "mobile": {
    "pickerType": "native",
    "mode": "date"
  },
  "web": {
    "pickerType": "html5",
    "type": "date"
  }
}'::jsonb WHERE component_id = 'diaryDatePicker';

-- 주소 검색
UPDATE ui_metadata SET component_props = '{
  "mobile": {
    "mapProvider": "google"
  },
  "web": {
    "mapProvider": "kakao"
  }
}'::jsonb WHERE component_id = 'diaryAddressSearch';
```

#### Phase 1 완료 기준
- ✅ 모든 주요 화면 component_props 설정
- ✅ 백엔드 JSONB 병합 로직 확인
- ✅ 웹에서 플랫폼별 메타데이터 정상 수신

---

### Phase 2-3: Planner 작업 없음

Phase 1에서 component_props를 완벽하게 설계했으므로, Phase 2(Expo 앱 개발)와 Phase 3(통합 결정)에서 Planner 작업 불필요.

---

## Security Considerations (보안 고려사항)

### component_props 입력 검증

```sql
-- 관리자 페이지에서 component_props 수정 시 검증 필요
-- 백엔드에서 JSON 유효성 검사 필수
```

---

## Dependencies (의존성)

### Depends on
- Architect: JSONB 스키마 정의

### Blocks
- Designer: css_class 정의
- Frontend Engineer: componentMap 구현
- Backend Engineer: JSONB 병합 로직

---

## Deliverables (산출물)

1. **component_props SQL 스크립트**: `mobile_component_props.sql`
2. **화면별 구성표**: `screen_component_map.md`

---

**다음 단계**: Designer plan.md 작성 (CSS 반응형 처리)
