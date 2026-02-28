# Backend Engineer — Research

> 이 파일은 백엔드 구현 분석 결과를 기록한다.

---

## 패키지 구조 (2026-02-28 기준)

```
com.domain.demo_backend/
├── domain/
│   ├── diary/          # 일기 도메인
│   ├── Location/       # 위치 서비스
│   ├── time/           # 시간/목표 추적
│   ├── token/          # 토큰 관리
│   ├── ui/             # ★ SDUI 핵심 — 메타데이터 트리 빌딩
│   ├── user/           # 인증 & 사용자
│   └── query/          # 동적 쿼리 실행
├── global/
│   ├── common/         # ApiResponse, 유틸리티
│   ├── config/         # Security, Redis, WebSocket, CORS
│   ├── error/          # 예외 처리
│   ├── security/       # JWT, 비밀번호, SSO
│   └── infra/          # 이메일
└── DemoBackendApplication.java
```

---

## API 엔드포인트 전체 목록

| 경로 | 메서드 | 인증 | 컨트롤러 | 설명 |
|------|--------|------|----------|------|
| `/api/ui/{screenId}` | GET | No | UiController | SDUI 메타데이터 트리 반환 |
| `/api/auth/login` | POST | No | AuthController | 로그인 |
| `/api/auth/register` | POST | No | AuthController | 회원가입 |
| `/api/auth/verify-code` | POST | No | AuthController | 이메일 인증 |
| `/api/auth/logout` | POST | No | AuthController | 로그아웃 |
| `/api/auth/me` | GET | No | AuthController | 현재 사용자 정보 |
| `/api/auth/refresh` | POST | No | AuthController | 토큰 갱신 |
| `/api/auth/signup` | POST | No | AuthController | 인증 이메일 발송 |
| `/api/kakao/**` | ALL | No | KakaoController | 카카오 OAuth |
| `/api/diary/**` | ALL | **Yes** | DiaryController | 일기 CRUD |
| `/api/execute/{sqlKey}` | POST | **Yes** | CommonQueryController | 동적 쿼리 실행 |
| `/api/goalTime/**` | ALL | No | GoalTimeController | 목표 시간 |
| `/api/location/**` | ALL | ? | LocationController | 위치 서비스 |

---

## 핵심 엔티티 분석

### UiMetadata (`domain/ui/domain/UiMetadata.java`)

| 필드 | 타입 | 설명 |
|------|------|------|
| uiId | BIGINT PK | 자동 증가 |
| screenId | VARCHAR(50) | 화면 식별자 |
| componentId | VARCHAR(50) | 컴포넌트 고유 ID |
| componentType | VARCHAR(20) | React 컴포넌트 타입 |
| labelText | VARCHAR(100) | 표시 텍스트 |
| sortOrder | INT | 렌더링 순서 |
| isRequired | BOOLEAN | 필수 입력 |
| isReadonly | BOOLEAN | 읽기 전용 |
| placeholder | VARCHAR(255) | 입력 힌트 |
| cssClass | VARCHAR(100) | CSS 클래스명 |
| actionType | VARCHAR(50) | 액션 타입 |
| refDataId | VARCHAR(50) | pageData 키, Repeater 식별자 |
| groupId | VARCHAR(50) | 자신의 그룹 ID |
| parentGroupId | VARCHAR(50) | 부모 그룹 ID (트리 구조 핵심) |
| groupDirection | VARCHAR(10) | ROW / COLUMN |
| isVisible | VARCHAR(50) | 가시성 조건 |
| inlineStyle | TEXT | 인라인 CSS |
| dataSqlKey | VARCHAR(50) | query_master 연결 키 |
| defaultValue | VARCHAR(255) | 기본값 |
| submitGroupId | VARCHAR(50) | 제출 그룹 |
| submitGroupOrder | INT | 제출 순서 |
| submitGroupSeparator | VARCHAR(10) | 제출 구분자 |

### User (`domain/user/domain/User.java`)

| 필드 | 타입 | 설명 |
|------|------|------|
| userSqno | BIGINT PK | 자동 증가 |
| userId | VARCHAR(50) UNIQUE | 사용자 ID |
| email | VARCHAR(100) UNIQUE | 이메일 |
| password | VARCHAR(255) | 원본 (사용 지양) |
| hashedPassword | VARCHAR(255) | BCrypt 해시 |
| role | VARCHAR(50) | ROLE_USER, ROLE_ADMIN 등 |
| verifyYn | CHAR(1) | 이메일 인증 여부 (Y/N) |
| verificationCode | VARCHAR(10) | 6자리 인증 코드 |
| verificationExpiredAt | DATETIME | 인증 코드 만료 시간 |
| socialType | VARCHAR(20) | K (카카오) |
| zipCode | VARCHAR(10) | 우편번호 |
| roadAddress | VARCHAR(255) | 도로명 주소 |
| detailAddress | VARCHAR(255) | 상세 주소 |
| timeUsingType | VARCHAR(50) | 시간 사용 유형 |
| drugUsingType | VARCHAR(50) | 약물 사용 유형 |

### Diary (`domain/diary/domain/Diary.java`)

| 필드 | 타입 | 설명 |
|------|------|------|
| diaryId | BIGINT PK | 자동 증가 |
| userSqno | BIGINT FK | users.user_sqno |
| title | VARCHAR(255) | 제목 |
| content | TEXT | 내용 |
| emotion | INT | 감정 인덱스 |
| dayTag1~3 | VARCHAR | 태그 1~3 |
| selectedTimes | JSON | 선택한 시간 슬롯 배열 |
| dailySlots | JSON | 일일 시간 배분 맵 |
| diaryStatus | ENUM | 'true'(공개) / 'false'(초안) |
| regDt, updtDt | TIMESTAMP | 등록/수정 일시 |
| frstRegIp, lastUpdtIp | VARCHAR | IP 주소 |

---

## 보안 설정 현황

### JWT 토큰 설정 (`JwtUtil.java`)

| 항목 | 값 |
|------|---|
| Access Token TTL | 1시간 |
| Refresh Token TTL | 7일 |
| 암호화 | AES-256 + PBKDF2 |
| 저장소 | Refresh Token → Redis |

### CORS 허용 Origin (`SecurityConfig.java`)

```
localhost:3000 (Next.js 개발)
localhost:8080 (Backend 개발)
프로덕션 도메인 (EC2/Vercel)
```

### 공개 엔드포인트 (인증 불필요)

```
/api/auth/**
/api/ui/**
/api/goalTime/**
/api/kakao/**
```

---

## Redis 캐시 전략

| 키 | 값 | TTL | 관리 |
|---|---|-----|------|
| `SQL:{sqlKey}` | 쿼리 텍스트 | 영구 | 수동 삭제 |
| `{userId}` | RefreshToken 객체 | 7일 | 자동 만료 |

**주의:** `SQL:{sqlKey}` 캐시는 자동 만료되지 않음. `query_master` 쿼리 변경 시 Redis에서 해당 키 수동 삭제 필요.

---

## 도메인별 의존성 지도

```
UiController → UiService → UiMetadataRepository
                         → Redis (조회 캐시? 확인 필요)

AuthController → AuthService → UserRepository
                             → EmailUtil
                             → JwtUtil → Redis (RefreshToken)

CommonQueryController → QueryMasterService → QueryMasterRepository (query_master 테이블)
                                           → Redis (SQL:{key})
                                           → DynamicExecutor (SQL 실행)
```

---

## Gradle 주요 의존성

| 의존성 | 버전 | 용도 |
|-------|------|------|
| spring-boot-starter-data-jpa | - | ORM |
| spring-boot-starter-security | - | 보안 |
| spring-boot-starter-data-redis | - | Redis |
| spring-boot-starter-mail | - | 이메일 |
| spring-boot-starter-websocket | - | WebSocket |
| postgresql | - | DB 드라이버 |
| mybatis-spring-boot-starter | 3.0.3 | MyBatis |
| jjwt-api | 0.11.5 | JWT |
| springdoc-openapi-starter-webmvc-ui | 2.2.0 | Swagger |
| net.nurigo:sdk | 4.3.0 | SMS |

---

## 분석 히스토리

| 날짜 | 분석 내용 | 결론 |
|------|-----------|------|
| 2026-02-28 | 전체 백엔드 코드 초기 분석 | 위 내용 도출 |