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
| 2026-02-28 | [P1] 보안 감사 — anyRequest().permitAll() 위험도 분석 | 아래 섹션 참고 |

---

## [P1] 백엔드 보안 감사 결과 ← 서브에이전트 분석 (2026-02-28)

### 현황 요약
`SecurityConfig.java:75`의 `.anyRequest().permitAll()` 폴백 규칙으로 인해 명시되지 않은 모든 엔드포인트가
인증 없이 공개되어 있다. 특히 `/api/execute/{sqlKey}`(동적 SQL 실행),
`/api/auth/editPassword`(비밀번호 변경), `/api/auth/non-user`(회원탈퇴)가 인증 없이 호출 가능하며,
새 엔드포인트 추가 시 개발자가 별도로 지정하지 않으면 자동으로 전체 공개된다.

---

### 전체 엔드포인트 인증 재분석 (위험도 포함)

| 엔드포인트 | HTTP | 현재 권한 | 필요 권한 | 위험도 |
|-----------|------|----------|----------|-------|
| `/api/auth/login` | POST | permitAll | PUBLIC | 정상 |
| `/api/auth/register` | POST | permitAll | PUBLIC | 정상 |
| `/api/auth/me` | GET | permitAll | PUBLIC | 정상 |
| `/api/auth/refresh` | POST | permitAll | PUBLIC | 정상 |
| `/api/auth/logout` | POST | permitAll | PUBLIC | 정상 |
| `/api/auth/verify-code` | POST | permitAll | PUBLIC | 정상 |
| `/api/auth/resend-code` | POST | permitAll | PUBLIC | 정상 |
| `/api/auth/confirm-email` | GET | permitAll | PUBLIC | 정상 |
| `/api/auth/check-verification` | GET | permitAll | PUBLIC | 중간 |
| **`/api/auth/editPassword`** | POST | **permitAll** | **USER** | **높음** |
| **`/api/auth/non-user`** | POST | **permitAll** | **USER** | **높음** |
| `/api/diary/**` | ALL | authenticated | USER | 정상 |
| **`/api/execute/{sqlKey}`** | GET,POST | **permitAll** | **ADMIN** | **매우높음** |
| **`/api/goalTime/**`** | ALL | **permitAll** | **USER** | **높음** |
| `/api/timer/**` | GET | permitAll | PUBLIC | 정상 |
| `/api/kakao/**` | ALL | permitAll | PUBLIC | 정상 (OAuth) |
| `/api/ui/**` | GET | permitAll | PUBLIC | 정상 |
| `/topic/location/**` (WS) | WS | **permitAll** | **USER** | **높음** |

---

### 가장 위험한 엔드포인트 Top 3

#### 1. `POST /api/execute/{sqlKey}` — CRITICAL
`query_master` 테이블에 등록된 SQL을 인증 없이 실행 가능.
```bash
# 공격 예시: 인증 없이 임의 쿼리 실행
curl -X GET http://localhost:8080/api/execute/user_list
curl -X POST http://localhost:8080/api/execute/diary_delete -d '{"diaryId":1}'
```

#### 2. `POST /api/auth/editPassword` — HIGH
인증 없이 타인의 이메일만 알면 비밀번호 변경 가능.
```bash
curl -X POST http://localhost:8080/api/auth/editPassword \
  -d '{"email":"victim@email.com","newPassword":"hacked123"}'
```

#### 3. `POST /api/auth/non-user` — HIGH
인증 없이 타인 계정 삭제 가능 (이메일만 알면 됨).
```bash
curl -X POST http://localhost:8080/api/auth/non-user \
  -d '{"email":"victim@email.com"}'
```

---

### 근본 원인

```java
// SecurityConfig.java:71-76
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/me", "/api/auth/login", ...).permitAll()
    .requestMatchers("/api/diary/**").authenticated()
    .anyRequest().permitAll()  // ← 화이트리스트 누락 = 자동 공개
)
```

---

### 수정 방향

#### [FIX-1] `anyRequest().denyAll()` 으로 변경 (화이트리스트 방식)

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
    // PUBLIC
    .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/signup").permitAll()
    .requestMatchers("/api/auth/me", "/api/auth/refresh", "/api/auth/logout").permitAll()
    .requestMatchers("/api/auth/verify-code", "/api/auth/resend-code",
                     "/api/auth/confirm-email", "/api/auth/check-verification").permitAll()
    .requestMatchers("/api/kakao/**").permitAll()
    .requestMatchers("/api/ui/**").permitAll()
    .requestMatchers("/api/timer/**").permitAll()
    // USER 인증 필수
    .requestMatchers("/api/auth/editPassword", "/api/auth/non-user").authenticated()
    .requestMatchers("/api/diary/**").authenticated()
    .requestMatchers("/api/goalTime/**").authenticated()
    // ADMIN 전용
    .requestMatchers("/api/execute/**").hasRole("ADMIN")
    // 기본 차단
    .anyRequest().denyAll()  // ← 핵심 수정
)
```

#### [FIX-2] `editPassword` / `non-user` — 본인 인증 추가

```java
@PostMapping("/editPassword")
public ResponseEntity<?> editPassword(
    @RequestBody PasswordDto dto,
    @AuthenticationPrincipal CustomUserDetails userDetails) {
    if (userDetails == null) return ResponseEntity.status(401).build();
    authService.editPassword(dto);
    return ResponseEntity.ok("비밀번호 변경 성공");
}
```

#### [FIX-3] `CommonQueryController` — `@PreAuthorize("hasRole('ADMIN')")`

```java
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping(value = "/{sqlKey}", method = {RequestMethod.GET, RequestMethod.POST})
public ResponseEntity<?> execute(..., Authentication auth) {
    if (auth == null) return ResponseEntity.status(403).build();
}
```

---

### 우선순위 수정 체크리스트

| 항목 | 우선순위 |
|------|---------|
| `anyRequest().denyAll()` 로 변경 | **P0 — 즉시** |
| `/api/execute/**` 관리자 권한 | **P0 — 즉시** |
| `/api/auth/editPassword` 인증 추가 | **P1** |
| `/api/auth/non-user` 인증 + 본인 확인 | **P1** |
| `/api/goalTime/**` authenticated | **P1** |
| WebSocket 위치 데이터 JWT 검증 | **P2** |