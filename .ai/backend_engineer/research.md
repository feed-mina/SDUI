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
| `ui:metadata:{screenId}` | List&lt;UiMetadata&gt; JSON | **1시간** | UiMetadataService 자동 (수동 삭제도 가능) |
| `{userId}` | RefreshToken 객체 | 7일 | 자동 만료 |

**주의:** `SQL:{sqlKey}` 캐시는 자동 만료되지 않음. `query_master` 쿼리 변경 시 Redis에서 해당 키 수동 삭제 필요.

---

## 도메인별 의존성 지도

```
UiController → UiService → UiMetadataService → UiMetadataRepository
                                              → Redis (`ui:metadata:{screenId}`, TTL 1h) ✅ 구현됨

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
| 2026-02-28 | [P1] 보안 감사 — anyRequest().permitAll() 위험도 분析 | 아래 섹션 참고 |
| 2026-03-06 | 보안 체크리스트 재확인, Redis/UiService 확인 | P0-2 JWT role ✅ 수정됨, EXCLUDE_URLS 오타 ✅ 수정됨, ui:metadata Redis 캐시 확인됨 |

---

## [P0] Security Fix 상세 분석 — 코드 재검증 (2026-02-28)

> **⚠️ 상태 업데이트:** 이전 분석([P1])의 `anyRequest().permitAll()` 진단은 구버전 기준.
> 실제 현재 코드에서는 `anyRequest().denyAll()`이 이미 적용됨. 그러나 새로운 P0 취약점 3개 발견.

---

### 현재 SecurityConfig permitAll 화이트리스트 (실제 코드 기준)

**파일:** `SecurityConfig.java:72-90`

| 경로 패턴 | HTTP Method | 비고 |
|-----------|------------|------|
| `/**` | OPTIONS | CORS preflight |
| `/api/auth/login` | POST | 로그인 |
| `/api/auth/register` | POST | 회원가입 |
| `/api/auth/signup`, `/api/auth/signUp` | POST | 이메일 인증 발송 |
| `/api/auth/me` | GET | 현재 사용자 (게스트 응답 가능) |
| `/api/auth/refresh` | POST | 토큰 갱신 |
| `/api/auth/logout` | POST | 로그아웃 |
| `/api/auth/verify-code` | POST | 인증 코드 검증 |
| `/api/auth/resend-code` | POST | 인증 코드 재발송 |
| `/api/auth/confirm-email` | GET | 이메일 확인 링크 |
| `/api/auth/check-verification` | GET | 인증 상태 확인 |
| `/api/kakao/**` | ALL | OAuth (공개) |
| `/api/ui/**` | GET | SDUI 메타데이터 (공개 의도) |
| `/api/timer/**` | GET | 타이머 (공개) |
| **`/api/goalTime/**`** | **ALL** | **⚠️ 전체 공개 — 컨트롤러 레벨 인증만 부분 적용** |
| **`/api/execute/**`** | **GET, POST** | **🔴 CRITICAL — 동적 SQL 무인증 실행 가능** |

**인증 필수 (SecurityConfig 레벨):**

| 경로 | HTTP | 권한 |
|------|------|------|
| `/api/auth/editPassword` | POST | `.authenticated()` ✅ |
| `/api/auth/non-user` | POST | `.authenticated()` ✅ |
| `/api/diary/**` | ALL | `.authenticated()` ✅ |

**기본 정책:** `.anyRequest().denyAll()` ✅ (이미 적용됨)

---

### 발견된 P0 취약점 3개

#### [P0-1] `GET/POST /api/execute/{sqlKey}` — CRITICAL 🔴

**파일:** `CommonQueryController.java:29`

```java
// 현재: @PreAuthorize 없음, Authentication 파라미터는 있으나 null 허용
@RequestMapping(value = "/{sqlKey}", method = {RequestMethod.GET, RequestMethod.POST})
public ResponseEntity<?> execute(
    @PathVariable String sqlKey,
    @RequestParam(required = false) Map<String, Object> queryParams,
    @RequestBody(required = false) Map<String, Object> bodyParams,
    Authentication authentication) {  // null이어도 동작

    if (authentication != null) {  // null 허용 — 인증 없어도 계속 실행
        params.put("userSqno", userDetails.getUserSqno());
    }
    // ... SQL 실행
}
```

**위험:** SecurityConfig Line 85에 `permitAll()` + 컨트롤러 내 인증 체크 없음
→ 누구나 `query_master` 테이블의 모든 SQL 쿼리 실행 가능

```bash
# 공격 예시:
curl -X POST http://localhost:8080/api/execute/user_list
curl -X GET http://localhost:8080/api/execute/diary_delete?diaryId=1
```

**권고 수정:**
```java
@PreAuthorize("hasRole('ADMIN')")  // 또는 authenticated() + 쿼리별 권한 체크
@RequestMapping(value = "/{sqlKey}", method = {RequestMethod.GET, RequestMethod.POST})
public ResponseEntity<?> execute(..., Authentication authentication) {
    if (authentication == null)
        return ResponseEntity.status(403).body(Map.of("message", "권한이 없습니다."));
    // ...
}
```

SecurityConfig에서도:
```java
.requestMatchers("/api/execute/**").hasRole("ADMIN")  // permitAll 대신
```

---

#### [P0-2] JwtAuthenticationFilter — DB 역할 무시, ROLE_USER 하드코딩 🔴

**파일:** `JwtAuthenticationFilter.java:123`

```java
// 현재: DB의 role 필드 무시, 모든 인증 사용자 = ROLE_USER
List<GrantedAuthority> authorities = List.of(() -> "ROLE_USER");
```

**영향:**
- DB에 `ROLE_ADMIN`이 있어도 Spring Security에서는 `ROLE_USER`로만 처리
- `@PreAuthorize("hasRole('ADMIN')")` 기반 접근 제어가 절대 작동 안 함
- `/api/execute/**`에 관리자 권한을 추가해도 무의미

**권고 수정:**
```java
// JwtAuthenticationFilter.java에서 DB에서 실제 역할 조회:
User user = userRepository.findByEmail(email).orElse(null);
String role = (user != null) ? user.getRole() : "ROLE_USER";
List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));
```

---

#### [P0-3] WebSocket 인증 없음 — HIGH 🟠

**파일:** `LocationController.java:22-45`

```java
@MessageMapping("/location/update")
public void updateLocation(LocationRequest message) {
    // JWT 검증 없음 — 누구나 위치 데이터 브로드캐스트 가능
    stringRedisTemplate.opsForGeo().add("active_workers", ...);
    messagingTemplate.convertAndSend("/sub/admin/locations", message);
}

@MessageMapping("/location/emergency")
public void handleEmergency(LocationRequest message) {
    // JWT 검증 없음 — 누구나 긴급 신호 발송 가능
    messagingTemplate.convertAndSend("/sub/admin/emergency", message);
}
```

**WebSocketConfig.java:19:** `.setAllowedOriginPatterns("*")` — 모든 도메인 허용

**위험:** 거짓 위치 데이터, 긴급 신호 스팸, 직원 위치 무단 수신

**권고 수정:**
```java
@MessageMapping("/location/update")
public void updateLocation(LocationRequest message,
        @Header("Authorization") String token) {
    if (!jwtUtil.validateToken(token)) throw new AccessDeniedException("인증 필요");
    // ...
}
```

---

### /api/auth 취약점 재분석 (구버전 진단 수정)

| 엔드포인트 | 이전 진단 | 실제 현황 | 재진단 |
|-----------|----------|----------|--------|
| `/api/auth/editPassword` | ❌ permitAll | ✅ `.authenticated()` + `@AuthenticationPrincipal` null 체크 | 보호됨 |
| `/api/auth/non-user` | ❌ permitAll | ✅ `.authenticated()` + `@AuthenticationPrincipal` null 체크 | 보호됨 |
| `/api/execute/{sqlKey}` | ❌ permitAll + 무인증 | ❌ 여전히 permitAll + 무인증 | **CRITICAL** |

**주의:** `editPassword`에 현재 비밀번호 검증 로직이 없음 (인증은 됨).

---

### /api/goalTime/** 부분 인증 현황

| 메서드 | 경로 | @AuthenticationPrincipal | null 허용 | 위험 |
|--------|------|-------------------------|----------|------|
| getGoalTime | `/getGoalTime` | ✅ 있음 | ⚠️ null 허용 (삼항 연산자) | 타인 데이터 조회 가능 |
| saveGoalTime | `/save` | ✅ 있음 | ✅ null 체크 후 401 | 안전 |
| getGoalList | `/getGoalList` | ✅ 있음 | ⚠️ null 허용 | 타인 데이터 조회 가능 |
| recordArrival | `/arrival` | ✅ 있음 | ✅ null 체크 후 401 | 안전 |

---

### JwtAuthenticationFilter EXCLUDE_URLS 오타 발견

**파일:** `JwtAuthenticationFilter.java:27-34`

```java
private static final List<String> EXCLUDE_URLS = List.of(
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/kakao/login",
    "/api/kakao/callback",
    "/api/ui/LOGIN_PAGE",
    "api/ui/MAIN_PAGE"   // ← 오타: 앞에 '/' 없음 → 필터 통과 안 됨
);
```

→ `/api/ui/MAIN_PAGE` 요청은 JWT 검증을 받게 되어 토큰 없는 첫 방문자가 차단될 수 있음.

---

### 우선순위 수정 체크리스트

| 항목 | 우선순위 | 상태 |
|------|---------|------|
| `/api/execute/**` → `hasRole('ADMIN')` + SecurityConfig permitAll 제거 | **P0 — 즉시** | ❌ 미수정 (여전히 permitAll) |
| JwtAuthenticationFilter 역할 하드코딩 → JWT 클레임 role 읽기 | **P0 — 즉시** | ✅ 수정됨 (line 125: `claims.get("role")`, ROLE_USER는 폴백만) |
| WebSocket 인증 추가 (`/location/update`, `/location/emergency`) | **P0** | ❌ 미수정 (LocationController JWT 검증 없음) |
| `/api/goalTime/getGoalTime`, `getGoalList` null 체크 강화 | **P1** | ❌ 미수정 (삼항 연산자로 null 허용 유지) |
| `/api/auth/editPassword` 현재 비밀번호 검증 추가 | **P1** | ❌ 미수정 |
| JwtAuthenticationFilter EXCLUDE_URLS 오타 수정 (`"api/ui/MAIN_PAGE"`) | **P2** | ✅ 수정됨 (line 33: `"/api/ui/MAIN_PAGE"` 슬래시 추가됨) |
| WebSocket Origin `*` → 실제 도메인으로 제한 | **P2** | ❌ 미수정 (WebSocketConfig `setAllowedOriginPatterns("*")` 유지) |
| `anyRequest().denyAll()` 유지 확인 | — | ✅ 이미 적용됨 |
| `/api/auth/editPassword`, `/api/auth/non-user` authenticated | — | ✅ 이미 적용됨 |

---

### 2026-03-07: 이슈 및 해결 기록

#### 1. 카카오 로그인 리다이렉트 문제 (해결됨)
- **현상:** 카카오 로그인 후 백엔드에서 프론트엔드로 리다이렉트되지 않고 JSON 응답이 표시됨 (`/api/kakao/callback`).
- **원인:** `KakaoController`가 모바일/웹 분기 처리 없이 무조건 JSON(`ResponseEntity.ok`)을 반환하도록 구현되어 있었음.
- **해결:** `state` 파라미터(platform)를 확인하여 `mobile`이 아닐 경우 `webUrl`로 `302 Found` 리다이렉트하도록 수정함.

#### 2. 배포 후 데이터 불일치 미스터리 (진행 중)
- **현상:** 배포된 환경에서 일반 로그인은 정상적으로 되는데, DB의 `users` 테이블을 조회하면 데이터가 없음.
- **가설:**
    - 애플리케이션이 바라보는 DB(`SDUI_LAB` vs `SDUI_TD`)와 사용자가 직접 조회하는 DB가 다를 가능성이 높음.
    - `deploy.yml` 설정상 `lab` 브랜치는 `SDUI_LAB` 데이터베이스를 사용하고, `main` 브랜치는 `SDUI_TD`를 사용함.