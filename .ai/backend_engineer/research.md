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

| 경로                      | 메서드 | 인증          | 컨트롤러              | 설명                      |
| ------------------------- | ------ | ------------- | --------------------- | ------------------------- |
| `/api/ui/{screenId}`    | GET    | No            | UiController          | SDUI 메타데이터 트리 반환 |
| `/api/auth/login`       | POST   | No            | AuthController        | 로그인                    |
| `/api/auth/register`    | POST   | No            | AuthController        | 회원가입                  |
| `/api/auth/verify-code` | POST   | No            | AuthController        | 이메일 인증               |
| `/api/auth/logout`      | POST   | No            | AuthController        | 로그아웃                  |
| `/api/auth/me`          | GET    | No            | AuthController        | 현재 사용자 정보          |
| `/api/auth/refresh`     | POST   | No            | AuthController        | 토큰 갱신                 |
| `/api/auth/signup`      | POST   | No            | AuthController        | 인증 이메일 발송          |
| `/api/kakao/**`         | ALL    | No            | KakaoController       | 카카오 OAuth              |
| `/api/diary/**`         | ALL    | **Yes** | DiaryController       | 일기 CRUD                 |
| `/api/execute/{sqlKey}` | POST   | **Yes** | CommonQueryController | 동적 쿼리 실행            |
| `/api/goalTime/**`      | ALL    | No            | GoalTimeController    | 목표 시간                 |
| `/api/location/**`      | ALL    | ?             | LocationController    | 위치 서비스               |
| `/api/admin/users`      | GET    | **ADMIN** | AdminUserController   | 사용자 목록 조회 (keyword/role 필터, 페이징) |
| `/api/admin/users/role` | PUT    | **ADMIN** | AdminUserController   | 사용자 권한 변경 (최대 5명) |

---

## 핵심 엔티티 분석

### UiMetadata (`domain/ui/domain/UiMetadata.java`)

| 필드                 | 타입         | 설명                          |
| -------------------- | ------------ | ----------------------------- |
| uiId                 | BIGINT PK    | 자동 증가                     |
| screenId             | VARCHAR(50)  | 화면 식별자                   |
| componentId          | VARCHAR(50)  | 컴포넌트 고유 ID              |
| componentType        | VARCHAR(20)  | React 컴포넌트 타입           |
| labelText            | VARCHAR(100) | 표시 텍스트                   |
| sortOrder            | INT          | 렌더링 순서                   |
| isRequired           | BOOLEAN      | 필수 입력                     |
| isReadonly           | BOOLEAN      | 읽기 전용                     |
| placeholder          | VARCHAR(255) | 입력 힌트                     |
| cssClass             | VARCHAR(100) | CSS 클래스명                  |
| actionType           | VARCHAR(50)  | 액션 타입                     |
| refDataId            | VARCHAR(50)  | pageData 키, Repeater 식별자  |
| groupId              | VARCHAR(50)  | 자신의 그룹 ID                |
| parentGroupId        | VARCHAR(50)  | 부모 그룹 ID (트리 구조 핵심) |
| groupDirection       | VARCHAR(10)  | ROW / COLUMN                  |
| isVisible            | VARCHAR(50)  | 가시성 조건                   |
| inlineStyle          | TEXT         | 인라인 CSS                    |
| dataSqlKey           | VARCHAR(50)  | query_master 연결 키          |
| defaultValue         | VARCHAR(255) | 기본값                        |
| submitGroupId        | VARCHAR(50)  | 제출 그룹                     |
| submitGroupOrder     | INT          | 제출 순서                     |
| submitGroupSeparator | VARCHAR(10)  | 제출 구분자                   |

### User (`domain/user/domain/User.java`)

| 필드                  | 타입                | 설명                     |
| --------------------- | ------------------- | ------------------------ |
| userSqno              | BIGINT PK           | 자동 증가                |
| userId                | VARCHAR(50) UNIQUE  | 사용자 ID                |
| email                 | VARCHAR(100) UNIQUE | 이메일                   |
| password              | VARCHAR(255)        | 원본 (사용 지양)         |
| hashedPassword        | VARCHAR(255)        | BCrypt 해시              |
| role                  | VARCHAR(50)         | ROLE_USER, ROLE_ADMIN 등 |
| verifyYn              | CHAR(1)             | 이메일 인증 여부 (Y/N)   |
| verificationCode      | VARCHAR(10)         | 6자리 인증 코드          |
| verificationExpiredAt | DATETIME            | 인증 코드 만료 시간      |
| socialType            | VARCHAR(20)         | K (카카오)               |
| zipCode               | VARCHAR(10)         | 우편번호                 |
| roadAddress           | VARCHAR(255)        | 도로명 주소              |
| detailAddress         | VARCHAR(255)        | 상세 주소                |
| timeUsingType         | VARCHAR(50)         | 시간 사용 유형           |
| drugUsingType         | VARCHAR(50)         | 약물 사용 유형           |

### Diary (`domain/diary/domain/Diary.java`)

| 필드                  | 타입         | 설명                         |
| --------------------- | ------------ | ---------------------------- |
| diaryId               | BIGINT PK    | 자동 증가                    |
| userSqno              | BIGINT FK    | users.user_sqno              |
| title                 | VARCHAR(255) | 제목                         |
| content               | TEXT         | 내용                         |
| emotion               | INT          | 감정 인덱스                  |
| dayTag1~3             | VARCHAR      | 태그 1~3                     |
| selectedTimes         | JSON         | 선택한 시간 슬롯 배열        |
| dailySlots            | JSON         | 일일 시간 배분 맵            |
| diaryStatus           | ENUM         | 'true'(공개) / 'false'(초안) |
| regDt, updtDt         | TIMESTAMP    | 등록/수정 일시               |
| frstRegIp, lastUpdtIp | VARCHAR      | IP 주소                      |

---

## 보안 설정 현황

### JWT 토큰 설정 (`JwtUtil.java`)

| 항목              | 값                     |
| ----------------- | ---------------------- |
| Access Token TTL  | 1시간                  |
| Refresh Token TTL | 7일                    |
| 암호화            | AES-256 + PBKDF2       |
| 저장소            | Refresh Token → Redis |

### 로그인 응답 — HttpOnly 쿠키 설정 (AuthController.java:87-102) ✅

```java
// 로그인/카카오 OAuth 모두 동일 방식으로 쿠키 설정
ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", tokenResponse.getAccessToken())
        .httpOnly(true)       // ✅ JavaScript 접근 불가
        .secure(false)        // 로컬 테스트용 (프로덕션: true 필요 — P2)
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

**프로덕션 배포 시 필수:** `secure(false)` → `secure(true)` 변경 (P2, ❌ 미수정)

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

| 키                         | 값                          | TTL             | 관리                                      |
| -------------------------- | --------------------------- | --------------- | ----------------------------------------- |
| `SQL:{sqlKey}`           | 쿼리 텍스트                 | 영구            | 수동 삭제                                 |
| `ui:metadata:{screenId}` | List&lt;UiMetadata&gt; JSON | **1시간** | UiMetadataService 자동 (수동 삭제도 가능) |
| `{userId}`               | RefreshToken 객체           | 7일             | 자동 만료                                 |

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

| 의존성                              | 버전   | 용도        |
| ----------------------------------- | ------ | ----------- |
| spring-boot-starter-data-jpa        | -      | ORM         |
| spring-boot-starter-security        | -      | 보안        |
| spring-boot-starter-data-redis      | -      | Redis       |
| spring-boot-starter-mail            | -      | 이메일      |
| spring-boot-starter-websocket       | -      | WebSocket   |
| postgresql                          | -      | DB 드라이버 |
| mybatis-spring-boot-starter         | 3.0.3  | MyBatis     |
| jjwt-api                            | 0.11.5 | JWT         |
| springdoc-openapi-starter-webmvc-ui | 2.2.0  | Swagger     |
| net.nurigo:sdk                      | 4.3.0  | SMS         |

### 민감 정보 로깅 — System.out.println → SLF4J 전환 ✅ 완료 (2026-03-08)

> **출처:** frontend_engineer/research.md에서 이동 (commit b2ec8d5 이후 재스캔 기준)
> **2026-03-08 완료:** 11개 파일, 활성 println 45개 전부 SLF4J로 전환

| 파일                             | 개수 | 민감도                              | 상태                                       |
| -------------------------------- | ---- | ----------------------------------- | ------------------------------------------ |
| `ContentService.java`          | 8개  | MEDIUM — 콘텐츠 요청, 에러         | ✅ 완료 (log.debug / log.error)            |
| `ContentController.java`       | 11개 | MEDIUM — 요청 정보, IP             | ✅ 완료 (log.debug / log.warn / log.error) |
| `AuthService.java`             | 3개  | MEDIUM — User 객체, 에러 메시지    | ✅ 완료 (log.debug)                        |
| `GoalTimeQueryService.java`    | 9개  | MEDIUM — 캐시키, SQL, params       | ✅ 완료 (log.debug)                        |
| `GoalTimeController.java`      | 2개  | LOW — userSqno, targetTime         | ✅ 완료 (log.debug)                        |
| `UiController.java`            | 3개  | LOW — screenId 로깅                | ✅ 완료 (log.debug)                        |
| `UiService.java`               | 2개  | LOW — 데이터 정합성 경고           | ✅ 완료 (log.warn)                         |
| `JwtAuthenticationFilter.java` | 1개  | LOW — System.err + printStackTrace | ✅ 완료 (log.warn + e 객체 포함)           |
| `KakaoController.java`         | 1개  | LOW — kakaoUserInfo                | ✅ 완료 (log.debug)                        |
| `MockAuthFilter.java`          | 1개  | LOW — 필터 실행 로그               | ✅ 완료 (log.debug)                        |
| `PasswordUtil.java`            | 2개  | LOW — 비밀번호 일치 여부           | ✅ 완료 (log.debug)                        |

**비고:** 주석 블록(`//`, `/* */`) 내 잔존 println 3건은 비활성 코드로 그대로 유지.

---

## 로컬 Docker DB 환경 구성 및 Flyway 수정 (2026-03-06)

> _출처: frontend_engineer/research.md에서 이동 (2026-03-08)_

### 배경 — 포트 충돌 문제

| 서비스                    | 포트           |
| ------------------------- | -------------- |
| PostgreSQL 18 (로컬 설치) | 5432           |
| PostgreSQL 13 (로컬 설치) | 5433           |
| Docker sdui-db (변경 후)  | **5434** |

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

| 생성 테이블       | 비고                                               |
| ----------------- | -------------------------------------------------- |
| `users`         | `user_sqno BIGSERIAL PK`, 인증·프로필 컬럼 전체 |
| `diary`         | `diary_id BIGSERIAL PK`, V7에서 삭제됨           |
| `ui_metadata`   | `ui_id BIGSERIAL PK`, 화면 메타데이터            |
| `query_master`  | `sql_key VARCHAR PK`, 동적 SQL                   |
| `goal_settings` | `id BIGSERIAL PK`, 약속 시간 설정                |

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

| 파일                                 | 처리                          |
| ------------------------------------ | ----------------------------- |
| V2__create_content_table.sql         | `BEGIN;` / `COMMIT;` 제거 |
| V3__migrate_diary_to_content.sql     | `BEGIN;` / `COMMIT;` 제거 |
| V4__update_ui_metadata_rbac.sql      | `BEGIN;` / `COMMIT;` 제거 |
| V5__update_query_master_redis.sql    | `BEGIN;` / `COMMIT;` 제거 |
| V6__update_metadata_content_refs.sql | `BEGIN;` / `COMMIT;` 제거 |
| V7__drop_diary_table.sql             | `BEGIN;` / `COMMIT;` 제거 |
| V8__main_page_bento_grid.sql         | `BEGIN;` / `COMMIT;` 제거 |

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

# 3. DemoBackendApplication 재기동
# → Flyway V1~V8 순차 실행 → Hibernate validate → 서버 기동 완료 (8080)

# 4. 프론트엔드 기동
cd metadata-project && npm run dev
```

### Flyway 실패 시 특정 버전 재실행

```sql
-- flyway_schema_history에서 해당 버전 삭제 후 Spring Boot 재기동
DELETE FROM flyway_schema_history WHERE version = '8';
```

### 완료된 마이그레이션 현황

| 버전 | 내용                                                         | 상태    |
| ---- | ------------------------------------------------------------ | ------- |
| V1   | 기본 테이블 생성 (users, ui_metadata 등) + MAIN_SECTION root | ✅ 완료 |
| V2   | content 테이블 생성                                          | ✅ 완료 |
| V3   | diary → content 데이터 이전                                 | ✅ 완료 |
| V4   | ui_metadata RBAC 컬럼 추가 (allowed_roles 등)                | ✅ 완료 |
| V5   | query_master Redis 컬럼 추가                                 | ✅ 완료 |
| V6   | diary → content 참조 업데이트                               | ✅ 완료 |
| V7   | diary 테이블 삭제                                            | ✅ 완료 |
| V8   | MAIN_PAGE 벤토 그리드 삽입                                   | ✅ 완료 |
| V9   | USER 카드 라벨 변경                                          | ✅ 완료 |
| V10  | 벤토 카드 전체 클릭 가능 전환                                | ✅ 완료 |

---

## [P0] Security Fix 상세 분석 — 코드 재검증 (2026-02-28)

> **⚠️ 상태 업데이트:** 이전 분석([P1])의 `anyRequest().permitAll()` 진단은 구버전 기준.
> 실제 현재 코드에서는 `anyRequest().denyAll()`이 이미 적용됨. 그러나 새로운 P0 취약점 3개 발견.

---

### 현재 SecurityConfig permitAll 화이트리스트 (실제 코드 기준)

**파일:** `SecurityConfig.java:72-90`

| 경로 패턴                                  | HTTP Method         | 비고                                                       |
| ------------------------------------------ | ------------------- | ---------------------------------------------------------- |
| `/**`                                    | OPTIONS             | CORS preflight                                             |
| `/api/auth/login`                        | POST                | 로그인                                                     |
| `/api/auth/register`                     | POST                | 회원가입                                                   |
| `/api/auth/signup`, `/api/auth/signUp` | POST                | 이메일 인증 발송                                           |
| `/api/auth/me`                           | GET                 | 현재 사용자 (게스트 응답 가능)                             |
| `/api/auth/refresh`                      | POST                | 토큰 갱신                                                  |
| `/api/auth/logout`                       | POST                | 로그아웃                                                   |
| `/api/auth/verify-code`                  | POST                | 인증 코드 검증                                             |
| `/api/auth/resend-code`                  | POST                | 인증 코드 재발송                                           |
| `/api/auth/confirm-email`                | GET                 | 이메일 확인 링크                                           |
| `/api/auth/check-verification`           | GET                 | 인증 상태 확인                                             |
| `/api/kakao/**`                          | ALL                 | OAuth (공개)                                               |
| `/api/ui/**`                             | GET                 | SDUI 메타데이터 (공개 의도)                                |
| `/api/timer/**`                          | GET                 | 타이머 (공개)                                              |
| **`/api/goalTime/**`**             | **ALL**       | **⚠️ 전체 공개 — 컨트롤러 레벨 인증만 부분 적용** |
| **`/api/execute/**`**              | **GET, POST** | **🔴 CRITICAL — 동적 SQL 무인증 실행 가능**         |

**인증 필수 (SecurityConfig 레벨):**

| 경로                       | HTTP | 권한                    |
| -------------------------- | ---- | ----------------------- |
| `/api/auth/editPassword` | POST | `.authenticated()` ✅ |
| `/api/auth/non-user`     | POST | `.authenticated()` ✅ |
| `/api/diary/**`          | ALL  | `.authenticated()` ✅ |

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

| 엔드포인트                 | 이전 진단             | 실제 현황                                                       | 재진단             |
| -------------------------- | --------------------- | --------------------------------------------------------------- | ------------------ |
| `/api/auth/editPassword` | ❌ permitAll          | ✅`.authenticated()` + `@AuthenticationPrincipal` null 체크 | 보호됨             |
| `/api/auth/non-user`     | ❌ permitAll          | ✅`.authenticated()` + `@AuthenticationPrincipal` null 체크 | 보호됨             |
| `/api/execute/{sqlKey}`  | ❌ permitAll + 무인증 | ❌ 여전히 permitAll + 무인증                                    | **CRITICAL** |

**주의:** `editPassword`에 현재 비밀번호 검증 로직이 없음 (인증은 됨).

---

### /api/goalTime/** 부분 인증 현황 //[메모] 로그인 하지 않은 경우, 페이지에 처음 진입했을때 nogoal 상태를 보여주기  위해 

| 메서드        | 경로             | @AuthenticationPrincipal | null 허용                    | 위험                  |
| ------------- | ---------------- | ------------------------ | ---------------------------- | --------------------- |
| getGoalTime   | `/getGoalTime` | ✅ 있음                  | ⚠️ null 허용 (삼항 연산자) | 타인 데이터 조회 가능 |
| saveGoalTime  | `/save`        | ✅ 있음                  | ✅ null 체크 후 401          | 안전                  |
| getGoalList   | `/getGoalList` | ✅ 있음                  | ⚠️ null 허용               | 타인 데이터 조회 가능 |
| recordArrival | `/arrival`     | ✅ 있음                  | ✅ null 체크 후 401          | 안전                  |

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

| 항목                                                                                                                                                             | 우선순위             | 상태                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------ |
| `/api/execute/**` → query_master.required_role 컬럼 기반 쿼리별 권한 검증 (Option B 채택)                                                                   | **P0 — 즉시** | ✅ 코드 수정 완료 (QueryMaster.requiredRole + CommonQueryController 검증 로직), V15 migration 폴더 배치 완료, **로컬 DB 적용(서버 실행) 대기** |
| JwtAuthenticationFilter 역할 하드코딩 → JWT 클레임 role 읽기                                                                                                    | **P0 — 즉시** | ✅ 수정됨 (line 125:`claims.get("role")`, ROLE_USER는 폴백만)    |
| WebSocket 인증 추가 (`/location/update`, `/location/emergency`)                                                                                              | **P0**         | ❌ 미수정 (LocationController JWT 검증 없음)                       |
| `/api/goalTime/getGoalTime`, `getGoalList` null 체크 강화 <br />//[메모] 로그인 하지 않은 경우, 페이지에 처음 진입했을때 <br />nogoal 상태를 보여주기  위해 | **P1**         | ❌ 미수정 (삼항 연산자로 null 허용 유지)                           |
| `/api/auth/editPassword` 현재 비밀번호 검증 추가                                                                                                               | **P1**         | ❌ 미수정                                                          |
| JwtAuthenticationFilter EXCLUDE_URLS 오타 수정 (`"api/ui/MAIN_PAGE"`)                                                                                          | **P2**         | ✅ 수정됨 (line 33:`"/api/ui/MAIN_PAGE"` 슬래시 추가됨)          |
| WebSocket Origin `*` → 실제 도메인으로 제한                                                                                                                   | **P2**         | ❌ 미수정 (WebSocketConfig `setAllowedOriginPatterns("*")` 유지) |
| `anyRequest().denyAll()` 유지 확인                                                                                                                             | —                   | ✅ 이미 적용됨                                                     |
| `/api/auth/editPassword`, `/api/auth/non-user` authenticated                                                                                                 | —                   | ✅ 이미 적용됨                                                     |

---

### 2026-03-07: 이슈 및 해결 기록

#### 1. 카카오 로그인 리다이렉트 문제 (1차 수정 완료 → 2차 버그 발견)

- **1차 현상(해결됨):** 카카오 로그인 후 JSON 응답이 표시됨. state 분기 처리로 수정.
- **2차 현상(2026-03-07 발견):** 배포 후 카카오 로그인 시 로그인이 안되고 바로 메인페이지로 이동.
- **2차 원인 (쿠키 도메인 불일치):**
  - `KAKAO_REDIRECT_URI`가 백엔드 직접 URL(`yerin.duckdns.org/api/kakao/callback`)로 설정되어 있었음.
  - 카카오가 브라우저를 `yerin.duckdns.org`로 직접 리다이렉트 → 백엔드가 쿠키를 `yerin.duckdns.org` 도메인에 설정 후 Vercel(sdui-delta.vercel.app)로 302.
  - 브라우저가 Vercel에 도착하면 `yerin.duckdns.org` 도메인 쿠키는 전송되지 않음 → `accessToken` 없음 → 로그인 안된 상태로 메인페이지 표시.
  - `WEB_URL`도 deploy.yml에 미주입, `http://` 기본값 사용.
- **2차 해결:**
  - `deploy.yml`: `KAKAO_REDIRECT_URI=https://sdui-delta.vercel.app/api/kakao/callback` (비밀이 아니므로 하드코딩), `WEB_URL=https://sdui-delta.vercel.app` 추가.
  - `application-prod.yml`: WEB_URL 기본값을 `https://`로 수정.
  - `V11__fix_kakao_redirect_uri.sql`: DB `ui_metadata`의 카카오 버튼 `action_url`도 새 redirect_uri로 업데이트.
  - **사용자가 수동으로 해야 할 일**: 카카오 개발자 콘솔에서 `https://sdui-delta.vercel.app/api/kakao/callback`을 Redirect URI로 등록.
- **동작 원리:** `sdui-delta.vercel.app/api/kakao/callback` → Next.js rewrite → `yerin.duckdns.org/api/kakao/callback` → 백엔드 처리 후 302+Set-Cookie → Next.js가 응답 전달 → 쿠키가 `sdui-delta.vercel.app` 도메인에 설정됨 ✓

#### 2. 배포 후 데이터 불일치 미스터리 (진행 중)

- **현상:** 배포된 환경에서 일반 로그인은 정상적으로 되는데, DB의 `users` 테이블을 조회하면 데이터가 없음.
- **가설:**
  - 애플리케이션이 바라보는 DB(`SDUI_LAB` vs `SDUI_TD`)와 사용자가 직접 조회하는 DB가 다를 가능성이 높음.
  - `deploy.yml` 설정상 `lab` 브랜치는 `SDUI_LAB` 데이터베이스를 사용하고, `main` 브랜치는 `SDUI_TD`를 사용함.

#### 3. DB 백업 전략 변경 (2026-03-07)

- **EC2 로컬 저장 + 7일 보관 주기(Retention)** 방식으로 변경.
- **스크립트:** `.ai/scripts/backup_sdui_db_to_ec2.sh`

---

## RBAC / User Role 구현 현황 상세 분석 (2026-03-08)

### Role 값의 전체 흐름

```
DB (users.role 컬럼)
  → JWT 발급 시 "role" 클레임에 포함 (JwtUtil)
    → JwtAuthenticationFilter: JWT 검증 시 클레임에서 읽어 GrantedAuthority 생성
      → SecurityContextHolder에 인증 저장
        → UiController.extractRole(): UserDetails.getAuthorities() 첫 번째 값 추출
          → UiService.getUiTree(screenId, userRole): isAccessible() 필터링
```

### JwtAuthenticationFilter — Role 처리 (line 127-135)

```java
// JWT 클레임에서 role 읽기 (DB 역할 체계 반영, 2026-03-01)
String role = claims.get("role", String.class);
if (role == null || role.isBlank()) {
    role = "ROLE_USER"; // 폴백 (기존 토큰 호환)
}
List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));

CustomUserDetails userDetails = new CustomUserDetails(user);  // DB에서 조회한 User 객체
Authentication authentication = new UsernamePasswordAuthenticationToken(
    userDetails, null, authorities  // ⚠️ authorities는 JWT 기반, userDetails.getAuthorities()는 DB 기반
);
```

**⚠️ 주의:** `UsernamePasswordAuthenticationToken`에 전달되는 `authorities`는 JWT 클레임 기반이고, `userDetails.getAuthorities()`는 DB `users.role` 기반으로 **소스가 다름**. `UiController.extractRole()`은 `userDetails.getAuthorities()`를 사용하므로 DB role이 최종 결정.

### SecurityConfig — 엔드포인트별 접근 제어

| 엔드포인트           | 설정                | 비고                                             |
| -------------------- | ------------------- | ------------------------------------------------ |
| `/api/ui/**`       | `permitAll()`     | RBAC는 컨트롤러+서비스 레이어에서 처리           |
| `/api/goalTime/**` | `permitAll()`     | 컨트롤러 레벨에서 부분 인증 처리                 |
| `/api/execute/**`  | `permitAll()`     | **🟡 P0 — Controller 레벨 required_role 검증 추가됨 (V15 DB 적용 후 완전 적용)** |
| `/api/content/**`  | `authenticated()` | Spring Security 레벨 보호                        |
| `/api/admin/**`    | `hasRole("ADMIN")` | ✅ 2026-03-08 추가 — ADMIN 전용 (SecurityConfig line 90) |
| 나머지               | `denyAll()`       | 기본 차단                                        |

**Spring Security 레벨의 `hasRole()` 접근 규칙: `/api/admin/**`에 최초 적용 (2026-03-08)**

### UiController → UiService RBAC (ui_metadata 컴포넌트 필터링)

```java
// UiController.getUiMetadataList()
String userRole = (userDetails != null)
    ? extractRole(userDetails)   // UserDetails.getAuthorities().stream().findFirst()
    : "ROLE_GUEST";              // 비인증 → ROLE_GUEST

// UiService.isAccessible()
private boolean isAccessible(UiMetadata entity, String userRole) {
    String allowedRoles = entity.getAllowedRoles();
    if (allowedRoles == null || allowedRoles.trim().isEmpty()) return true; // NULL → 전체 허용
    return Arrays.stream(allowedRoles.split(","))
            .map(String::trim)
            .anyMatch(role -> role.equals(userRole));
}
```

### allowed_roles 값별 가시성

| `allowed_roles` 값 | ROLE_GUEST | ROLE_USER |
| -------------------- | ---------- | --------- |
| `NULL`             | ✅ 표시    | ✅ 표시   |
| `'ROLE_GUEST'`     | ✅ 표시    | ❌ 숨김   |
| `'ROLE_USER'`      | ❌ 숨김    | ✅ 표시   |

### CustomUserDetails — getAuthorities()

```java
// DB users.role 컬럼에서 직접 읽음
@Override
public Collection<? extends GrantedAuthority> getAuthorities() {
    return Collections.singletonList(new SimpleGrantedAuthority(user.getRole()));
}
```

`UiController.extractRole()`이 이 메서드를 호출하므로 최종 role은 **DB 값 기준**.

### RBAC 계층 요약

| 레이어                             | Role 소스                     | 사용 목적                                                 |
| ---------------------------------- | ----------------------------- | --------------------------------------------------------- |
| JwtAuthenticationFilter            | JWT 클레임 `"role"`         | SecurityContext 인증 토큰 생성                            |
| CustomUserDetails.getAuthorities() | DB `users.role`             | UiController extractRole()                                |
| SecurityConfig                     | —                            | 역할 기반 URL 접근제어 미사용 (permitAll/authenticated만) |
| UiService.isAccessible()           | `ui_metadata.allowed_roles` | 화면 컴포넌트별 RBAC 필터링                               |

---

## 분석 히스토리 (2026-03-08 기준)

| 날짜       | 분석 내용                                                              | 결론                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-28 | 전체 백엔드 코드 초기 분석                                             | 위 내용 도출                                                                                                                          |
| 2026-02-28 | [P1] 보안 감사 — anyRequest().permitAll() 위험도 분석                 | 아래 섹션 참고                                                                                                                        |
| 2026-03-06 | Docker DB 포트 변경 + Flyway V1~V8 수정 완료                           | 로컬 Docker DB 섹션 참고                                                                                                              |
| 2026-03-06 | 보안 체크리스트 재확인, Redis/UiService 확인                           | P0-2 JWT role ✅ 수정됨, EXCLUDE_URLS 오타 ✅ 수정됨, ui:metadata Redis 캐시 확인됨                                                   |
| 2026-03-08 | System.out.println → SLF4J 전환 완료                                  | 11개 파일 45건 전환, 주석 블록 3건만 잔존 (비활성)                                                                                    |
| 2026-03-08 | JwtAuthenticationFilter + SecurityConfig RBAC/user role 전체 흐름 분석 | RBAC 구현 현황 상세 분석 섹션 추가. Spring Security 레벨 role-based URL 제어 미사용 확인. UiService.isAccessible()이 실질적 RBAC 담당 |
| 2026-03-08 | 관리자페이지 기획 + P0-1 `/api/execute/**` 무인증 취약점 해소 (Option B) | query_master.required_role 컬럼 추가, QueryMaster.java + CommonQueryController.java 수정 완료. V15 마이그레이션 초안 작성(.ai/). AdminController/Service Phase 1~6 구현 계획 수립. 로컬 DB 환경 기준 진행 예정 |
| 2026-03-08 | 로컬 DB 전환 + V13/V14 버그 수정 + V15 migration 폴더 배치 | application.yml 5432/testdb 전환. V13·V14 `sql_text`→`query_text` 컬럼명 오류 수정. V15 db/migration 폴더 이동 완료. 로컬 서버 실행 후 마이그레이션 적용 대기 중 |
| 2026-03-08 | 순서 1~3 완료 — 서버 기동 확인, SecurityConfig ADMIN 보호, AdminUserController/Service 신규 생성 | V12~V15 로컬 DB 적용 완료(서버 시작 로그 확인). `SecurityConfig.java:90` `/api/admin/**` → `hasRole("ADMIN")` 추가. `domain/admin/` 패키지 신규 — `AdminUserController`, `AdminUserService`, `AdminUserResponse`, `UpdateUserRoleRequest`. `UserRepository`에 `findUsersForAdmin`·`countUsersForAdmin` JPQL 쿼리 추가. |
| 2026-03-08 | 순서 4~5 완료 — V16/V17 Flyway 마이그레이션 작성 | V16: `find_users_for_admin` query_master 등록 + `GET_ADMIN_STATS` required_role 누락 수정. V17: `USER_LIST` 스크린 ui_metadata 등록 — `user_list_page`(GROUP), `user_list_header`(GROUP), `user_list_title`(TEXT), `user_list_back_btn`(BUTTON/LINK→MAIN_PAGE), `user_list_table`(ADMIN_USER_TABLE). |
| 2026-03-08 | 순서 6 완료 — Frontend ADMIN_USER_TABLE 컴포넌트 구현 | `useAdminUsers.ts` 훅(검색 query state, 체크박스 max-5, PUT 권한변경), `AdminUserTable.tsx`(기존 Pagination 재사용, 행 클릭 체크박스), `componentMap.tsx`(ADMIN_USER_TABLE 등록), `pages.css`(admin page CSS 추가). |
| 2026-03-10 | main 브랜치 AWS 배포 — 연속 5가지 오류 수정 | (1) nginx proxy 8081→8080 수정 (`/etc/nginx/sites-enabled/yerin.duckdns.org`). (2) `global.error.GlobalExceptionHandler` 삭제 — `global.exception.GlobalExceptionHandler`와 bean 이름 충돌(`ConflictingBeanDefinitionException`). (3) Flyway V1 checksum 불일치 수정 — SDUI_TD에 SDUI_LAB 값(-559520453)이 들어가 있어 main 브랜치 실제 값(-1381310958)으로 UPDATE. (4) V3 마이그레이션 `SELECT setval(...)` → `PERFORM setval(...)` — PL/pgSQL DO 블록 내에서 SELECT는 목적지 없어 오류. (5) `domain/diary/` 패키지 전체 삭제 — V7이 diary 테이블 드롭했지만 Diary.java @Entity 잔존 → `Hibernate validate: missing table [diary]`. diary→content 마이그레이션 플랜(`.ai/architect/diary_to_content_migration_plan.md`) Step 5 미완이었음. `domain/content`가 이미 완전히 구현되어 있으므로 diary 패키지 삭제. |
| 2026-03-10 | ADDITIONAL_INFO_PAGE `data:[]` 문제 분석 및 V19 마이그레이션 작성 | Vercel(`sdui-delta.vercel.app`) 접속 시 `/api/ui/ADDITIONAL_INFO_PAGE` → `data:[]` 반환. Flyway V1~V18 중 어느 파일에도 ADDITIONAL_INFO_PAGE 메타데이터 INSERT 없음(V1은 MAIN_SECTION 1건만). `backup_aws_data.sql`에 해당 화면 데이터(ui_id 1036~1039) 존재하나 SDUI_TD에 미적용 상태. V19__add_additional_info_page.sql 작성: HEADER_TEXT(TEXT), PHONE_INPUT(INPUT/ref_data_id=phone), ADDRESS_GROUP(ADDRESS_SEARCH_GROUP), SUBMIT_BTN(BUTTON/SUBMIT_ADDITIONAL_INFO) — WHERE NOT EXISTS 중복 방지. 커밋 대기 중. |
| 2026-03-10 | CONTENT_LIST DB 트리 구조 오류 발견 | V20 migration이 `component_id`(lowercase diary→content)는 변환했으나 `parent_group_id` 참조는 미변환. `CONTENT_CARD_HEADER`의 parent_group_id가 여전히 `DIARY_CARD`(존재하지 않음), `TITLE_AUTHOR_GROUP`/`list_item_date`의 parent_group_id가 `DIARY_CARD_HEADER`(존재하지 않음) → 고아 노드 발생 → rowData 없이 labelText만 표시. V21 migration으로 parent_group_id 수정 필요: `DIARY_CARD`→`CONTENT_CARD`, `DIARY_CARD_HEADER`→`CONTENT_CARD_HEADER`. |
