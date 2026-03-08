draft plan : 현재 관리자페이지를 만들 예정에 있습니다.  JwtAuthenticationFilter와 SecurityConfig 와 `GET/POST /api/execute/{sqlKey}` 부분이 어떻게 되어있는지 파악이 필요합니다.

`(/api/execute/**` → `hasRole('ADMIN')` + SecurityConfig permitAll 제거) 이 부분에 대해 수정이 먼저 필요합니다.

이후 아래 파일 3개 목록까지 확인해주세요.

기능은 페이지에서는 검색기능과 회원리스트에 체크박스 하여 권한을 바꿔줄수있는 기능과 . 권한종류는 select창에서 선택할 수 있고 넣기 전에 alert을 띄우고 회원 000의 권한을 ㅁㅁㅁ로 바꿉니다 라고 띄웁니다.

체크박스에 체크할때 5개 이하로 체크할 수 있도록 체크박스가 6개이면 alet을 울려야합니다. 회원권한을 1명 이상 ~5명 까지할수 있도록 query_master에 관한 쿼리를 작성이 필요합니다. 권한을 부여한 후 다시 리스트 페이지로 돌아올때 부여한 권한을 볼 수 있어야 합니다.

**`.ai/backend_engineer/permission_queries.sql`)**

**`.ai/architect/plan_admin_permission_page.md`**

**`.ai/frontend_engineer/Mock/mockup_admin_permissions.html`**

이 3개의 목록을 참고하여 현재 프로젝트에 맞게 적용합니다.

---

## Research 결과 (2026-03-08)

### 1. SecurityConfig.java 현황

- `/api/execute/**` → **`permitAll()`** : 인증 없이 누구나 모든 sqlKey 호출 가능
- `/api/admin/**` → **정의 없음** → `anyRequest().denyAll()` 에 걸려 403 반환
- **결론**: 드래프트 플랜의 "execute를 통째로 ADMIN으로 바꾼다"는 불가. 공개 화면(GUEST/USER)도 `/api/execute/**` 를 사용 중이기 때문에 전체를 ADMIN으로 잠그면 일반 화면이 모두 깨짐.
- **올바른 방향**: `/api/admin/**` 패턴을 새로 추가하고 `hasRole("ADMIN")` 부여 → 관리자 전용 기능은 이 경로로 분리

### 2. JwtAuthenticationFilter 현황

- JWT `role` 클레임 추출 → `SimpleGrantedAuthority(role)` 등록
- DB에 `ROLE_ADMIN` 형태로 저장 → JWT에 `ROLE_ADMIN` → Spring Security `hasRole("ADMIN")` 과 호환 (Spring이 내부적으로 `ROLE_` prefix 처리)
- `EXCLUDE_URLS`: `/api/auth/login`, `/api/auth/refresh`, `/api/kakao/**`, `/api/ui/LOGIN_PAGE` — 관리자 API는 제외 목록 없음 → JWT 필터 정상 통과

### 3. CommonQueryController (`GET/POST /api/execute/{sqlKey}`) 현황

- `Authentication` 객체를 받지만, 현재는 `userSqno`·`userId` 파라미터 주입에만 사용
- 역할 체크 로직 없음 — `sqlKey` 이름에 관계없이 모든 키가 실행됨
- `/api/execute/**` 를 건드리지 않고, 관리자 전용 컨트롤러를 신규 경로(`/api/admin/`)로 별도 구현하는 것이 안전

### 4. ⚠️ DynamicExecutor 호환성 문제 (핵심)

`permission_queries.sql`의 `update_user_roles` 쿼리가 **MyBatis `<foreach>` 문법** 사용:

```xml
WHERE user_id IN <foreach ...> #{userId} </foreach>
```

→ `DynamicExecutor`는 `NamedParameterJdbcTemplate` 기반 (`:paramName` 문법) 이므로 **호환 불가**.

추가로 `executeUpdate()`는 `List` 타입 파라미터를 **JSON 문자열로 직렬화**:

```java
if (value instanceof List ...) {
    objectMapper.writeValueAsString(value)  // "[1,2,3]" 문자열
}
```

→ `WHERE user_sqno IN (:userIds)` 에 JSON 문자열이 바인딩되어 실행 실패.

**결론**: 권한 일괄 변경(`update_user_roles`)은 query_master / DynamicExecutor 경로를 사용하지 않고, **Admin 전용 컨트롤러 + JPA `UserRepository`로 직접 처리** 필요.

`find_users_for_admin` SELECT 쿼리는 query_master로 등록 가능하지만 파라미터 문법 수정 필요:

- `${searchTerm}` → `:searchTerm`
- `LIKE '%${searchTerm}%'` → `LIKE '%' || :searchTerm || '%'`

### 5. User 엔티티 & UserRepository

- 테이블: `users`, `role` 컬럼 형식: `ROLE_USER` / `ROLE_ADMIN`
- `UserRepository`는 `JpaRepository<User, Long>` 상속 → `findAllById(List<Long>)` 기본 제공
- 벌크 role 업데이트: `@Modifying @Query` 어노테이션 메서드 추가 또는 `findAllById` 후 `setRole` + `saveAll()` 로 처리 가능

### 6. USER_LIST 스크린 현재 상태

- V12 마이그레이션(admin_users_btn)에서 `action_url = '/view/USER_LIST'` 참조
- 하지만 `USER_LIST` screen_id에 해당하는 `ui_metadata` 행이 **존재하지 않음**
- 신규 Flyway 마이그레이션으로 `USER_LIST` 스크린 메타데이터 INSERT 필요

### 7. 권한 값 일관성 확인

| 위치                                 | 형식                             |
| ------------------------------------ | -------------------------------- |
| DB `users.role`                    | `ROLE_USER`, `ROLE_ADMIN`    |
| JWT claim                            | `ROLE_ADMIN` (DB에서 가져옴)   |
| Spring Security `hasRole("ADMIN")` | 내부적으로 `ROLE_ADMIN` 체크   |
| 목업 select value                    | `USER`, `MANAGER`, `ADMIN` |

→ API PUT 요청 시 `ROLE_ADMIN` 형식으로 전달하거나, 서비스 레이어에서 `ROLE_` prefix를 붙이는 처리 필요

---

## 구현 Plan

### [P0 완료] Option B: query_master.required_role 컬럼 기반 권한 검증

`/api/execute/**` 를 `hasRole("ADMIN")` 으로 일괄 변경하면 모든 USER 화면이 깨지므로,
**각 쿼리에 required_role을 명시**하고 컨트롤러에서 검증하는 방식으로 결정.

**변경된 파일:**
- [QueryMaster.java](SDUI-server/src/main/java/com/domain/demo_backend/domain/query/domain/QueryMaster.java) — `requiredRole` 필드 추가 ✅
- [CommonQueryController.java](SDUI-server/src/main/java/com/domain/demo_backend/domain/query/controller/CommonQueryController.java) — role 검증 로직 추가 ✅
- [V15 초안](.ai/backend_engineer/V15__add_required_role_to_query_master.sql) → `SDUI-server/src/main/resources/db/migration/V15__add_required_role_to_query_master.sql` 로 이동 필요

**required_role 값 규칙:**

| 값 | 의미 |
|----|------|
| `NULL` | 누구나 실행 가능 (기존 동작 유지) |
| `ROLE_USER` | 로그인한 사용자만 실행 가능 |
| `ROLE_ADMIN` | ADMIN 권한 보유자만 실행 가능 |

**⚠️ V15 적용 전 확인:** 실제 등록된 sql_key 목록 조회 후 UPDATE 대상 확정 필요
```sql
SELECT sql_key, description FROM query_master ORDER BY sql_key;
```

---

### Phase 1: SecurityConfig.java 수정

```java
// 기존 유지 (공개 SDUI 쿼리 — required_role로 쿼리별 제어)
.requestMatchers("/api/execute/**").permitAll()

// 신규 추가
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```

파일: [SecurityConfig.java](SDUI-server/src/main/java/com/domain/demo_backend/global/config/SecurityConfig.java)

### Phase 2: Admin 전용 컨트롤러 + 서비스 신규 생성

**신규 파일 위치** (`.ai` 폴더에 초안 작성 후 이동):

- `.ai/backend_engineer/AdminUserController.java` → `SDUI-server/src/main/java/com/domain/demo_backend/domain/admin/controller/AdminUserController.java`
- `.ai/backend_engineer/AdminUserService.java` → `SDUI-server/src/main/java/com/domain/demo_backend/domain/admin/service/AdminUserService.java`

**엔드포인트 정의**:

| Method | URL                              | 역할                                                        |
| ------ | -------------------------------- | ----------------------------------------------------------- |
| GET    | `/api/admin/users?searchTerm=` | 회원 목록 조회 (query_master `find_users_for_admin` 실행) |
| PUT    | `/api/admin/users/roles`       | 권한 일괄 변경 (JPA 직접 처리)                              |

**PUT 요청 body**:

```json
{ "userIds": [1, 2, 3], "newRole": "ROLE_ADMIN" }
```

**서비스 레이어 검증 규칙**:

1. `userIds.size() < 1` → `BadRequestException("최소 1명을 선택해야 합니다.")`
2. `userIds.size() > 5` → `BadRequestException("최대 5명까지 변경 가능합니다.")`
3. `newRole` 값이 `ROLE_USER`, `ROLE_ADMIN` 중 하나가 아니면 거부

### Phase 3: Flyway 마이그레이션 — query_master 등록

신규 마이그레이션 파일: `.ai/` 초안 → `SDUI-server/src/main/resources/db/migration/V16__admin_user_query.sql`

```sql
INSERT INTO query_master (sql_key, query_text, return_type, description, created_at, updated_at)
VALUES (
  'find_users_for_admin',
  'SELECT user_sqno, user_id, email, role
   FROM users
   WHERE del_yn = ''N''
     AND (:searchTerm = '''' OR LOWER(user_id) LIKE ''%'' || LOWER(:searchTerm) || ''%''
       OR LOWER(email) LIKE ''%'' || LOWER(:searchTerm) || ''%'')
   ORDER BY created_at DESC',
  'MULTI',
  '관리자 전용 회원 목록 조회 (searchTerm 빈 문자열이면 전체)',
  NOW(), NOW()
);
```

→ `update_user_roles`는 DynamicExecutor 미호환으로 **query_master 미등록**, JPA로 처리

### Phase 4: Flyway 마이그레이션 — USER_LIST 스크린 ui_metadata

신규 마이그레이션 파일: `.ai/` 초안 → `SDUI-server/src/main/resources/db/migration/V16__user_list_screen.sql`

- `screen_id = 'USER_LIST'`, `allowed_roles = 'ROLE_ADMIN'`
- 검색 INPUT + 검색 BUTTON 그룹
- 권한 SELECT + 변경 BUTTON 그룹
- 회원 테이블 (ADMIN_USER_TABLE 신규 컴포넌트 타입으로 등록 예정)

### Phase 5: UserRepository 메서드 추가 (필요 시)

```java
// 벌크 update 쿼리 (옵션 A — @Modifying 사용)
@Modifying
@Query("UPDATE User u SET u.role = :newRole WHERE u.userSqno IN :userIds")
int updateRoleByIds(@Param("userIds") List<Long> userIds, @Param("newRole") String newRole);
```

또는 `findAllById(userIds)` + 반복 `setRole` + `saveAll()` (더티 체킹, 건수 적으므로 성능 문제 없음)



### `query_master`에 `required_role` 컬럼 추가 

```sql
ALTER TABLE query_master ADD COLUMN required_role VARCHAR(50) DEFAULT NULL;
-- NULL = 누구나, ROLE_USER = 로그인 필요, ROLE_ADMIN = 관리자만
```

`CommonQueryController`에서 체크:

```java
String requiredRole = queryMaster.getRequiredRole();
if (requiredRole != null) {
    if (authentication == null) return 401;
    boolean hasRole = authentication.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals(requiredRole));
    if (!hasRole) return 403;
}
```


* [x] V15 마이그레이션 초안 작성 (.ai 폴더) — query_master required_role 컬럼 추가 ✅
* [x] QueryMaster.java — requiredRole 필드 추가 ✅
* [x] CommonQueryController.java — role 검증 로직 추가 ✅
* [x] march_8_관리자페이지.md — Plan 업데이트 ✅

---

## 현재 구현 현황 (2026-03-08 기준, 로컬 환경 진행 중)

### ✅ 완료

| 항목 | 파일 |
|------|------|
| P0 — QueryMaster.requiredRole 필드 추가 | `QueryMaster.java` |
| P0 — CommonQueryController required_role 검증 로직 추가 | `CommonQueryController.java:46-59` |
| V15 → migration 폴더 배치 + 로컬 DB 적용 완료 | `V15__add_required_role_to_query_master.sql` |
| V13, V14 `sql_text` → `query_text` 컬럼명 버그 수정 | `V13__admin_stats_query.sql`, `V14__admin_logs_query.sql` |
| application.yml → 로컬 PostgreSQL(5432/testdb) 전환 | `application.yml` |
| 어드민 URL 라우팅 `/view/admin/{screenId}` 패턴 도입 | `MetadataProvider.tsx` |
| USER_LIST PROTECTED_SCREENS 추가 (로그인 필수) | `page.tsx` |
| 순서 1 — 서버 실행 + V12~V15 Flyway 마이그레이션 로컬 DB 적용 | `./gradlew bootRun` 로그 확인 |
| 순서 2 — SecurityConfig `/api/admin/**` hasRole("ADMIN") 추가 | `SecurityConfig.java:90` |
| 순서 3 — AdminUserController + AdminUserService 신규 생성 | `domain/admin/controller/AdminUserController.java`, `domain/admin/service/AdminUserService.java`, `domain/admin/dto/AdminUserResponse.java`, `domain/admin/dto/UpdateUserRoleRequest.java`, `UserRepository.java` (findUsersForAdmin 추가) |

---

### 🚀 로컬 실행 체크리스트

#### 사전 조건
- [ ] Redis 실행 확인: `redis-cli ping` → `PONG` 응답
- [ ] 로컬 PostgreSQL(5432/testdb) 실행 확인

#### 서버 실행
```bash
cd SDUI-server
./gradlew bootRun
```

#### 실행 후 확인
- [ ] Flyway 마이그레이션 성공 로그 확인 (`Successfully applied N migrations to schema "public"`)
- [ ] V12~V15 순서대로 오류 없이 적용됐는지 확인 (오류 시 해당 버전 로그 상세 확인)
- [ ] sql_key 목록 확인 — V15 UPDATE 적용 여부 검증:
  ```sql
  SELECT sql_key, required_role FROM query_master ORDER BY sql_key;
  ```
  → `GET_MY_GOAL_TIME`, `GET_GOAL_LIST`, `GET_CONTENT_LIST`, `GET_MY_CONTENT` → `ROLE_USER`
  → `GET_SYSTEM_LOGS` → `ROLE_ADMIN`
  → 나머지 → `NULL`

---

### ⏳ 다음 구현 순서

| 순서 | 작업 | 파일 | 상태 |
| ---- | ---- | ---- | ---- |
| 1 | 서버 실행 + V12~V15 Flyway 마이그레이션 로컬 DB 적용 | `./gradlew bootRun` | ✅ |
| 2 | SecurityConfig에 `/api/admin/**` hasRole("ADMIN") 추가 | `SecurityConfig.java` | ✅ |
| 3 | AdminUserController + AdminUserService 신규 생성 | `domain/admin/controller`, `service` | ✅ |
| 4 | V16 마이그레이션 — `find_users_for_admin` query_master 등록 + `GET_ADMIN_STATS` required_role 수정 | `V16__admin_user_query.sql` | ✅ |
| 5 | V17 마이그레이션 — USER_LIST 스크린 ui_metadata | `V17__user_list_screen.sql` | ⬜ |
| 6 | Frontend — 관리자 action 핸들러 추가 | `useBusinessActions.tsx` 또는 신규 컴포넌트 | ⬜ |
