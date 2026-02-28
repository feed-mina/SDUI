# Planner — Research

> 이 파일은 기획 분석 결과를 기록한다. 신규 기능/화면 기획의 근거가 된다.

---

## 현재 화면 인벤토리 (2026-02-28 기준)

| screen_id | URL 경로 | 인증 필요 | 설명 |
|-----------|----------|-----------|------|
| MAIN_PAGE | `/` | No | 메인 화면 |
| LOGIN_PAGE | `/LOGIN_PAGE` | No | 로그인 화면 |
| DIARY_LIST | `/DIARY_LIST` | **Yes** | 일기 목록 |
| DIARY_WRITE | `/DIARY_WRITE` | **Yes** | 일기 작성 |
| DIARY_DETAIL | `/DIARY_DETAIL` | **Yes** | 일기 상세 |
| DIARY_MODIFY | `/DIARY_MODIFY` | **Yes** | 일기 수정 |
| SET_TIME_PAGE | `/SET_TIME_PAGE` | ? | 시간 설정 |
| TUTORIAL_PAGE | `/TUTORIAL_PAGE` | No | 튜토리얼 |
| (미정) | `/MY_PAGE` | **Yes** | 마이페이지 (코드 참조됨) |
| (미정) | `/VERIFY_CODE_PAGE` | No | 이메일 인증 (코드 참조됨) |
| (미정) | `/REGISTER_PAGE` | No | 회원가입 (코드 참조됨) |

---

## 현재 컴포넌트 인벤토리

| component_type | React 컴포넌트 | 용도 |
|----------------|---------------|------|
| INPUT | InputField | 텍스트 입력 |
| TEXT | TextField | 텍스트 표시 |
| PASSWORD | PasswordField | 비밀번호 입력 |
| BUTTON | ButtonField | 일반 버튼 |
| SNS_BUTTON | ButtonField | SNS(카카오) 버튼 |
| IMAGE | ImageField | 이미지 표시 |
| EMAIL_SELECT | EmailSelectField | 이메일 도메인 선택 |
| EMOTION_SELECT | EmotionSelectField | 감정 선택 (일기) |
| SELECT | SelectField | 드롭다운 선택 |
| TEXTAREA | TextAreaField | 여러 줄 텍스트 |
| TIME_RECORD_WIDGET | RecordTimeComponent | 시간 기록 위젯 |
| DATETIME_PICKER | DateTimePicker | 날짜/시간 선택 |
| TIME_SELECT | TimeSelect | 시간 선택 |
| TIME_SLOT_RECORD | TimeSlotRecord | 타임 슬롯 기록 |
| ADDRESS_SEARCH_GROUP | AddressSearchGroup | 주소 검색 (다음 API) |
| MODAL | Modal | 모달 다이얼로그 |
| GROUP | GroupComponent | 레이아웃 그룹 |

---

## 현재 액션 타입 인벤토리

### 사용자 인증 액션 (useUserActions)
| action_type | 설명 |
|-------------|------|
| LOGIN_SUBMIT | 로그인 폼 제출 |
| LOGOUT | 로그아웃 |
| REGISTER_SUBMIT | 회원가입 폼 제출 |
| VERIFY_CODE | 이메일 인증 코드 확인 |
| SOS | 긴급 위치 전송 (WebSocket) |
| TOGGLE_PW | 비밀번호 보기/숨기기 |
| KAKAO_LOGOUT | 카카오 로그아웃 |
| LINK / ROUTE | 화면 이동 |

### 비즈니스 액션 (useBusinessActions)
| action_type | 설명 |
|-------------|------|
| SUBMIT | 데이터 저장 (일반 폼) |
| ROUTE_DETAIL | 상세 화면으로 이동 (ID 포함) |
| ROUTE_MODIFY | 수정 화면으로 이동 (ID 포함) |
| LINK / ROUTE | 화면 이동 |

---

## 기존 사용자 플로우 분석

### 인증 플로우
```
[비로그인]
  → REGISTER_PAGE (회원가입)
    → REGISTER_SUBMIT
    → 이메일 발송
    → VERIFY_CODE_PAGE
      → VERIFY_CODE
      → LOGIN_PAGE

  → LOGIN_PAGE (로그인)
    → LOGIN_SUBMIT → MAIN_PAGE or DIARY_LIST
    → SNS_BUTTON(카카오) → 카카오 OAuth → 자동 로그인

[로그인 상태]
  → DIARY_LIST (목록)
    → 일기 클릭 → ROUTE_DETAIL → DIARY_DETAIL
    → 수정 버튼 → ROUTE_MODIFY → DIARY_MODIFY
  → DIARY_WRITE (작성)
    → SUBMIT → DIARY_LIST
```

### 데이터 필요 화면
| 화면 | 데이터 소스 | 설명 |
|------|------------|------|
| DIARY_LIST | query_master (AUTO_FETCH) | 사용자 일기 목록, 페이지네이션 |
| DIARY_DETAIL | query_master (AUTO_FETCH) | refId로 특정 일기 조회 |
| DIARY_MODIFY | query_master (AUTO_FETCH) | refId로 수정할 일기 로드 |

---

## 갭(Gap) 분석 — 기획 관점

### 미구현/미완성 화면
1. `MY_PAGE` — `PROTECTED_SCREENS`에 정의됨, `screenMap`에 없음
2. `REGISTER_PAGE` — 코드에서 참조됨, screenMap에 없음
3. `VERIFY_CODE_PAGE` — 코드에서 참조됨, screenMap에 없음

### 잠재적 신규 기능 후보
- 알림/푸시 기능 (WebSocket 기반 인프라 있음)
- 관리자 화면 (`ROLE_ADMIN` 역할 코드에 존재)
- 프로필 설정 (`MY_PAGE`)

---

## 기획 히스토리

| 날짜 | 분석 내용 | 결론 |
|------|-----------|------|
| 2026-02-28 | 전체 화면/컴포넌트 인벤토리 작성 | 위 내용 도출 |