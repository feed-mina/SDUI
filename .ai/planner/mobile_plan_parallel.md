# Planner — Mobile+Web Integration Plan (병행 접근 방식)

**접근 방식**: Next.js 웹 + React Native 모바일 병행 운영
**작성일**: 2026-03-01
**담당**: Planner Agent

---

## Research Analysis (연구 분석)

### 현재 화면 구성

**주요 화면** (screen_id 기준):
- LOGIN_PAGE: 로그인 화면
- REGISTER_PAGE: 회원가입 화면
- DIARY_LIST: 다이어리 리스트 화면
- DIARY_WRITE: 다이어리 작성 화면
- DIARY_DETAIL: 다이어리 상세 화면
- MAIN_PAGE: 메인 화면

### 플랫폼별 UI 차이점 분석

#### LOGIN_PAGE

| 요소 | 웹 (Desktop) | 웹 (Mobile < 768px) | 모바일 앱 |
|------|-------------|---------------------|----------|
| 레이아웃 | 중앙 정렬 (max-width: 400px) | 전체 너비 (padding: 16px) | 전체 너비 (padding: 16px) |
| 버튼 높이 | 40px | 48px (터치 타겟) | 48px (터치 타겟) |
| 입력 필드 | focus border 색상 | focus + 확대 방지 | 네이티브 키보드 |
| 소셜 로그인 | 카카오 팝업 | 카카오 앱 연동 | 카카오 SDK |

#### DIARY_LIST

| 요소 | 웹 (Desktop) | 웹 (Mobile) | 모바일 앱 |
|------|-------------|-------------|----------|
| 레이아웃 | 그리드 (3열) | 리스트 (1열) | 리스트 (1열) |
| 카드 크기 | 300x200px | 100vw x 100px | 100% x 100px |
| 무한 스크롤 | Intersection Observer | Intersection Observer | FlatList |
| 스와이프 삭제 | 미지원 | 미지원 | ✅ 지원 (React Native Swipeable) |

#### DIARY_WRITE

| 요소 | 웹 (Desktop) | 웹 (Mobile) | 모바일 앱 |
|------|-------------|-------------|----------|
| 텍스트 에리어 | 고정 높이 (200px) | 키보드 대응 높이 | 키보드 자동 회피 (KeyboardAvoidingView) |
| 날짜 선택 | HTML5 date input | HTML5 date input | 네이티브 DateTimePicker |
| 이미지 업로드 | `<input type="file">` | `<input type="file">` | 카메라/갤러리 선택 (ImagePicker) |
| 위치 검색 | 다음 지도 API | 다음 지도 API | Google Maps (React Native Maps) |

### component_props JSONB 구조 설계

```json
{
  "common": {
    "type": "submit",
    "className": "primary-button"
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
}
```

---

## Implementation Plan (구현 계획)

### 1. DATABASE 설계 (component_props 설정)

#### 1.1 LOGIN_PAGE 메타데이터

```sql
-- 이메일 입력 필드
UPDATE ui_metadata SET component_props = '{
  "common": {
    "type": "email",
    "placeholder": "이메일을 입력하세요",
    "required": true
  },
  "mobile": {
    "autoComplete": "email",
    "keyboardType": "email-address",
    "autoCapitalize": "none"
  },
  "web": {
    "autoComplete": "email"
  }
}'::jsonb WHERE component_id = 'loginEmailInput';

-- 비밀번호 입력 필드
UPDATE ui_metadata SET component_props = '{
  "common": {
    "type": "password",
    "placeholder": "비밀번호를 입력하세요",
    "required": true
  },
  "mobile": {
    "secureTextEntry": true,
    "autoComplete": "password"
  },
  "web": {
    "autoComplete": "current-password"
  }
}'::jsonb WHERE component_id = 'loginPasswordInput';

-- 로그인 버튼
UPDATE ui_metadata SET component_props = '{
  "common": {
    "type": "submit",
    "text": "로그인"
  },
  "mobile": {
    "minHeight": 48,
    "fontSize": 16,
    "hapticFeedback": true,
    "activeOpacity": 0.7
  },
  "web": {
    "minHeight": 40,
    "fontSize": 14
  }
}'::jsonb WHERE component_id = 'loginSubmitBtn';

-- 카카오 로그인 버튼
UPDATE ui_metadata SET component_props = '{
  "common": {
    "backgroundColor": "#FEE500",
    "color": "#000000",
    "icon": "kakao"
  },
  "mobile": {
    "minHeight": 48,
    "sdkType": "native"
  },
  "web": {
    "minHeight": 44,
    "sdkType": "popup"
  }
}'::jsonb WHERE component_id = 'kakaoLoginBtn';
```

#### 1.2 DIARY_LIST 메타데이터

```sql
-- 다이어리 리스트 컨테이너
UPDATE ui_metadata SET component_props = '{
  "mobile": {
    "viewType": "list",
    "itemHeight": 100,
    "enableSwipeActions": true,
    "swipeThreshold": 50
  },
  "web": {
    "viewType": "grid",
    "columns": 3,
    "gap": 16
  }
}'::jsonb WHERE component_id = 'diaryListContainer';

-- 다이어리 카드
UPDATE ui_metadata SET component_props = '{
  "mobile": {
    "height": 100,
    "borderRadius": 8,
    "padding": 12
  },
  "web": {
    "minHeight": 200,
    "borderRadius": 12,
    "padding": 16,
    "hoverEffect": true
  }
}'::jsonb WHERE component_id = 'diaryCard';

-- 필터 토글 버튼
UPDATE ui_metadata SET component_props = '{
  "mobile": {
    "position": "bottom-sheet",
    "height": "60%"
  },
  "web": {
    "position": "modal",
    "width": 400
  }
}'::jsonb WHERE component_id = 'filterToggle';
```

#### 1.3 DIARY_WRITE 메타데이터

```sql
-- 제목 입력 필드
UPDATE ui_metadata SET component_props = '{
  "common": {
    "placeholder": "제목을 입력하세요",
    "maxLength": 100
  },
  "mobile": {
    "fontSize": 18,
    "padding": 16
  },
  "web": {
    "fontSize": 16,
    "padding": 12
  }
}'::jsonb WHERE component_id = 'diaryTitleInput';

-- 내용 입력 필드
UPDATE ui_metadata SET component_props = '{
  "common": {
    "placeholder": "내용을 입력하세요",
    "maxLength": 5000
  },
  "mobile": {
    "minHeight": 300,
    "keyboardAvoidance": true,
    "multiline": true
  },
  "web": {
    "minHeight": 400,
    "multiline": true
  }
}'::jsonb WHERE component_id = 'diaryContentTextarea';

-- 날짜 선택
UPDATE ui_metadata SET component_props = '{
  "common": {
    "label": "날짜 선택"
  },
  "mobile": {
    "pickerType": "native",
    "mode": "date",
    "display": "spinner"
  },
  "web": {
    "pickerType": "html5",
    "type": "date"
  }
}'::jsonb WHERE component_id = 'diaryDatePicker';

-- 이미지 업로드
UPDATE ui_metadata SET component_props = '{
  "mobile": {
    "sourceType": "camera-or-library",
    "maxSize": 5242880,
    "quality": 0.8
  },
  "web": {
    "sourceType": "file-input",
    "accept": "image/*",
    "maxSize": 10485760
  }
}'::jsonb WHERE component_id = 'diaryImageUpload';

-- 주소 검색
UPDATE ui_metadata SET component_props = '{
  "mobile": {
    "mapProvider": "google",
    "showCurrentLocation": true,
    "searchRadius": 1000
  },
  "web": {
    "mapProvider": "kakao",
    "searchType": "address"
  }
}'::jsonb WHERE component_id = 'diaryAddressSearch';
```

#### 1.4 MODAL 메타데이터

```sql
-- 모달 컨테이너
UPDATE ui_metadata SET component_props = '{
  "mobile": {
    "animationType": "slide",
    "presentationStyle": "pageSheet",
    "transparent": false
  },
  "web": {
    "overlay": true,
    "backdropClose": true,
    "width": 400
  }
}'::jsonb WHERE component_id = 'confirmModal';
```

### 2. 화면별 컴포넌트 구성표

#### 2.1 LOGIN_PAGE 구성

```
GROUP: loginContainer (flex-col-layout)
├── GROUP: loginHeader (flex-col-layout)
│   └── TEXT: loginTitle (labelText: "로그인")
├── GROUP: loginForm (flex-col-layout)
│   ├── INPUT: loginEmailInput (type: email)
│   ├── INPUT: loginPasswordInput (type: password)
│   └── BUTTON: loginSubmitBtn (action: LOGIN_SUBMIT)
└── GROUP: socialLoginGroup (flex-col-layout)
    └── BUTTON: kakaoLoginBtn (action: KAKAO_LOGIN)
```

**플랫폼별 차이**:
- 웹: loginContainer max-width 400px, 중앙 정렬
- 모바일: loginContainer 전체 너비, padding 16px

#### 2.2 DIARY_LIST 구성

```
GROUP: diaryListContainer (flex-col-layout)
├── GROUP: diaryListHeader (flex-row-layout)
│   ├── TEXT: diaryListTitle
│   └── BUTTON: filterToggleBtn (action: SHOW_FILTER)
├── GROUP: diaryListContent (ref_data_id: diaryList) [REPEATER]
│   └── GROUP: diaryCard (flex-col-layout)
│       ├── IMAGE: diaryCardImage
│       ├── TEXT: diaryCardTitle
│       └── TEXT: diaryCardDate
└── GROUP: diaryListFooter
    └── BUTTON: writeBtn (action: GO_TO_WRITE)
```

**플랫폼별 차이**:
- 웹: diaryListContent grid (3열)
- 모바일: diaryListContent list (1열) + swipe actions

#### 2.3 DIARY_WRITE 구성

```
GROUP: diaryWriteContainer (flex-col-layout)
├── INPUT: diaryTitleInput
├── TEXTAREA: diaryContentTextarea
├── DATETIME_PICKER: diaryDatePicker
├── EMOTION_SELECT: diaryEmotionSelect
├── IMAGE: diaryImageUpload
├── ADDRESS_SEARCH_GROUP: diaryAddressSearch
└── GROUP: diaryWriteActions (flex-row-layout)
    ├── BUTTON: cancelBtn (action: CANCEL_WRITE)
    └── BUTTON: submitBtn (action: SUBMIT_DIARY)
```

**플랫폼별 차이**:
- 웹: 다음 지도 API
- 모바일: Google Maps + ImagePicker + 네이티브 DateTimePicker

### 3. 신규 컴포넌트 타입 제안

#### 3.1 BOTTOM_SHEET (모바일 전용)

```sql
INSERT INTO ui_metadata (
  screen_id, component_id, component_type, parent_group_id,
  label_text, component_props, allowed_roles, order_index
) VALUES (
  'DIARY_LIST', 'filterBottomSheet', 'BOTTOM_SHEET', 'diaryListContainer',
  '필터', '{
    "mobile": {
      "snapPoints": ["30%", "60%", "90%"],
      "backdropOpacity": 0.5
    }
  }'::jsonb, 'ROLE_USER,ROLE_ADMIN', 30
);
```

#### 3.2 SWIPEABLE_LIST_ITEM (모바일 전용)

```sql
UPDATE ui_metadata SET component_props = '{
  "mobile": {
    "leftActions": [
      {"icon": "star", "color": "#FFD700", "action": "FAVORITE"}
    ],
    "rightActions": [
      {"icon": "trash", "color": "#FF3B30", "action": "DELETE"}
    ]
  }
}'::jsonb WHERE component_id = 'diaryCard' AND screen_id = 'DIARY_LIST';
```

### 4. css_class_overrides 활용

```sql
-- 버튼 클래스 플랫폼별 분기
UPDATE ui_metadata SET
  css_class = 'content-btn primary-action',
  css_class_overrides = '{
    "mobile": "content-btn-mobile primary-action",
    "web": "content-btn primary-action"
  }'::jsonb
WHERE component_id = 'loginSubmitBtn';
```

---

## Security Considerations (보안 고려사항)

### 1. component_props 입력 검증

**위협**: 관리자 페이지에서 component_props 수정 시 악의적 JSON 삽입

**완화 방안**:
- 백엔드에서 JSON 유효성 검증 (Backend Engineer와 협업)
- 화이트리스트 기반 key 검증 (허용된 키만 저장)

### 2. 민감 정보 노출

**위협**: 모바일 화면에서 전체 내용 노출 (DIARY_LIST)

**완화 방안**:
```sql
-- DIARY_LIST에서 preview만 노출
UPDATE ui_metadata SET component_props = '{
  "mobile": {
    "contentMaxLength": 50,
    "showPreviewOnly": true
  },
  "web": {
    "contentMaxLength": 100
  }
}'::jsonb WHERE component_id = 'diaryCardContent';
```

---

## Test Plan (테스트 계획)

### 화면별 메타데이터 검증

```sql
-- LOGIN_PAGE 플랫폼별 메타데이터 확인
SELECT component_id, component_type, component_props
FROM ui_metadata
WHERE screen_id = 'LOGIN_PAGE'
ORDER BY order_index;

-- DIARY_LIST 모바일 메타데이터 검증
SELECT component_id,
       component_props->'mobile' as mobile_props
FROM ui_metadata
WHERE screen_id = 'DIARY_LIST';
```

### 사용자 플로우 테스트

**시나리오 1: 로그인 → 리스트 → 상세**
- 웹 (Desktop): 그리드 레이아웃, 마우스 호버 효과
- 웹 (Mobile): 리스트 레이아웃, 터치 타겟 48px
- 모바일 앱: 리스트 + 스와이프 삭제

**시나리오 2: 다이어리 작성**
- 웹: 다음 지도 주소 검색, HTML5 date input
- 모바일 앱: Google Maps, 네이티브 DateTimePicker, 카메라/갤러리

---

## Dependencies (의존성)

### Depends on
- Architect: JSONB 스키마 정의

### Blocks
- Designer: css_class 정의 필요
- Frontend Engineer: componentMap 구현 필요
- Backend Engineer: component_props 병합 로직 필요

---

## Deliverables (산출물)

1. **component_props 설정 SQL 스크립트**: `mobile_component_props.sql`
2. **화면별 컴포넌트 구성표**: `screen_component_map.md`
3. **신규 컴포넌트 타입 정의**: `new_component_types.md`

---

**다음 단계**: Designer plan.md 작성 (CSS 클래스 정의)
