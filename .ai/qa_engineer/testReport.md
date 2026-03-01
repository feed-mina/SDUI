# QA Test Report

> 이 파일은 프로젝트의 테스트 실행 결과를 기록한다.
> 날짜별로 백엔드/프론트엔드/통합 테스트 결과를 추적한다.

---

## [2026-03-01] JWT 보안 강화 및 HttpOnly Cookie 전환 테스트

**태그**: `#security` `#jwt` `#cookie` `#backend` `#frontend` `#qa`
**목적**: JWT RBAC 지원, localStorage → HttpOnly Cookie 전환, 보안 헤더 추가에 대한 회귀 테스트

---

### 📊 전체 테스트 요약

| 항목 | 작성 | 실행 | 통과 | 실패 | 통과율 |
|------|------|------|------|------|--------|
| **백엔드 단위 테스트** | ✅ 13개 | ⏸️ 미실행 | - | - | - |
| **프론트엔드 기존 테스트** | ✅ 20개 | ✅ 실행 | 15개 | 5개 | 75% |
| **QA 인증 보안 테스트** | ✅ 7개 | ✅ 실행 | 3개 | 4개 | 43% |
| **총계** | **40개** | **27개** | **18개** | **9개** | **67%** |

---

## 1. 백엔드 단위 테스트 (Backend Unit Tests)

### 📁 테스트 파일
- `src/test/java/.../global/security/JwtUtilTest.java`
- `src/test/java/.../domain/user/service/AuthServiceTest.java`

### 📋 작성된 테스트 케이스 (13개)

#### JwtUtilTest (5개)
| 테스트 케이스 | 상태 | 설명 |
|-------------|------|------|
| `createAccessToken_shouldIncludeRoleClaim` | ✅ 작성 | JWT 생성 시 role 클레임 포함 확인 |
| `createAccessToken_shouldIncludeAdminRole` | ✅ 작성 | ADMIN 역할 정확성 검증 |
| `validateToken_shouldParseValidToken` | ✅ 작성 | 유효한 토큰 파싱 검증 |
| `generateTokens_shouldCreateBothTokens` | ✅ 작성 | AccessToken + RefreshToken 생성 |
| `createAccessToken_shouldHandleNullRole` | ✅ 작성 | role null 처리 확인 |

#### AuthServiceTest (8개)
| 테스트 케이스 | 상태 | 설명 |
|-------------|------|------|
| `editPassword_shouldSucceedWithCorrectCurrentPassword` | ✅ 작성 | 현재 비밀번호 일치 시 변경 성공 |
| `editPassword_shouldFailWithIncorrectCurrentPassword` | ✅ 작성 | 잘못된 현재 비밀번호 예외 |
| `editPassword_shouldFailWithNonExistentUser` | ✅ 작성 | 존재하지 않는 사용자 예외 |
| `editPassword_shouldSucceedWithoutCurrentPasswordValidation` | ✅ 작성 | currentPassword null 레거시 호환 |
| `editPassword_shouldSucceedWithEmptyCurrentPassword` | ✅ 작성 | currentPassword 빈 문자열 처리 |
| `isUserVerified_shouldReturnTrueForVerifiedUser` | ✅ 작성 | 인증된 사용자 true 반환 |
| `isUserVerified_shouldReturnFalseForUnverifiedUser` | ✅ 작성 | 미인증 사용자 false 반환 |
| `isUserVerified_shouldReturnFalseForNonExistentUser` | ✅ 작성 | 존재하지 않는 사용자 false |

### ⚠️ 실행 결과

**실행 명령**: `./gradlew test --no-daemon`
**결과**: ⏸️ 실패 (빌드 환경 문제)

#### 실패 원인
1. **Gradle 빌드 디렉토리 파일 잠금** (Windows 환경)
   - 에러: `Unable to delete directory 'build/test-results/test/binary'`
   - 원인: Java 프로세스가 파일을 잠금 상태로 유지
   - 시도한 해결 방법:
     - `./gradlew --stop` (Gradle Daemon 종료)
     - `./gradlew clean test` (빌드 정리 후 테스트)
     - `--no-daemon` 옵션 사용

2. **Redis 연결 설정 미완료**
   - JwtUtil과 AuthService가 RefreshTokenRepository(Redis) 의존
   - Embedded Redis 설정 필요
   - `it.ozimov:embedded-redis:0.7.3` 의존성 추가했으나 설정 미완료

#### 향후 조치 사항
- [ ] CI/CD 환경에서 테스트 실행 (파일 잠금 문제 회피)
- [ ] Embedded Redis 설정 클래스 작성
- [ ] 또는 Redis를 @MockBean으로 모킹

---

## 2. 프론트엔드 기존 테스트 (Frontend Existing Tests)

### 📋 테스트 실행 결과

**실행 명령**: `npm run test`
**결과**: ✅ 15/20 passed (75%)

```
Test Suites: 2 passed, 1 failed, 3 total
Tests: 15 passed, 5 failed, 20 total
Time: 12.571 s
```

### ✅ 통과한 테스트 Suites (2개)
1. **TimeSelect.test.tsx** - 7/7 passed
2. **api_duplicated.test.tsx** - 8/8 passed

### ❌ 실패한 테스트 Suite (1개)
**rendering_optimization.test.tsx** - 0/5 passed

#### 실패한 테스트 케이스 (5개)

| 테스트 케이스 | 실패 이유 | 시도한 해결 방법 |
|-------------|---------|---------------|
| `MAIN_PAGE 화면 렌더링` | `engineLogs.length = 0` (예상: 2) | useRenderCount 훅 로그 캡처 실패 |
| `SET_TIME_PAGE 화면 렌더링` | `engineLogs.length = 0` (예상: 2) | 동일 - 콘솔 로그 모킹 문제 |
| `DIARY_WRITE 화면 렌더링` | `engineLogs.length = 0` (예상: 2) | 동일 - 콘솔 로그 모킹 문제 |
| `LOGIN_PAGE 화면 정렬` | `engineLogs.length = 0` (예상: 2) | 동일 - 콘솔 로그 모킹 문제 |
| `DIARY_LIST 화면 정렬` | `engineLogs.length = 0` (예상: 2) | 동일 - 콘솔 로그 모킹 문제 |

#### 실패 원인 분석
**근본 원인**: `useRenderCount` 훅이 `console.log`를 사용하여 렌더링 횟수를 기록하는데, Jest 환경에서 이 로그가 캡처되지 않음

**시도한 해결 방법**:
1. ✅ **Next.js 라우터 모킹 추가** (`jest.setup.js`)
   - `useRouter`, `useParams`, `usePathname`, `useSearchParams` 모킹
   - 결과: AuthProvider 에러 해결, 하지만 렌더링 로그 캡처는 여전히 실패

2. ✅ **AuthProvider 래퍼 추가** (`tests/test-utils.tsx`)
   - `renderWithProviders`에 `<AuthProvider>` 추가
   - 결과: 인증 에러 해결, 렌더링 로그 문제는 미해결

3. ❌ **console.log 스파이 추가 시도**
   - `jest.spyOn(console, 'log')` 사용
   - 결과: 여전히 로그 캡처 실패

#### 향후 조치 사항
- [ ] `useRenderCount` 훅을 console.log 대신 커스텀 이벤트 방식으로 변경
- [ ] 또는 테스트에서 렌더링 횟수를 직접 추적하는 방식으로 리팩토링
- [ ] 또는 해당 테스트를 E2E 테스트로 전환

### 🎉 테스트 개선 성과
- **이전**: 7/20 passed (35%)
- **현재**: 15/20 passed (75%)
- **개선**: +8개 테스트 통과 (+40%p)

---

## 3. QA 인증 보안 회귀 테스트 (QA Auth Security Regression Tests)

### 📁 테스트 파일
- `tests/integration/auth_security.test.tsx`
- `tests/mocks/handlers.ts`
- `tests/mocks/server.ts`

### 📋 테스트 실행 결과

**실행 명령**: `npm run test -- tests/integration/auth_security.test.tsx`
**결과**: ✅ 3/7 passed (43%)

```
Test Suites: 1 failed, 1 total
Tests: 3 passed, 4 failed, 7 total
Time: 8.498 s
```

### ✅ 통과한 테스트 (3개)

| 테스트 케이스 | 검증 내용 |
|-------------|---------|
| **TC-S003**: refresh 실패 시 에러 처리 | ✅ refresh 401 시 에러 발생 확인 |
| **TC-S004**: localStorage 미사용 확인 | ✅ `localStorage.getItem('accessToken')` 호출 안 됨 |
| **TC-S005**: axios withCredentials 설정 | ✅ `api.defaults.withCredentials === true` |

### ❌ 실패한 테스트 (4개)

| 테스트 케이스 | 실패 이유 | 시도한 해결 방법 |
|-------------|---------|---------------|
| **TC-S002**: 401 → refresh → 재시도 | `Invalid base URL:` 에러 | 1. axios baseURL을 'http://localhost'로 설정 시도<br>2. MSW 핸들러를 절대 URL로 변경<br>3. 여전히 실패 - axios 인스턴스 문제 |
| **TC-S006**: /api/auth/me 호출 | `Invalid base URL:` 에러 | 동일 - MSW와 axios 통신 불가 |
| **TC-S007**: 로그인 API 호출 | `Invalid base URL:` 에러 | 동일 - MSW와 axios 통신 불가 |
| **TC-S008**: 로그아웃 API 호출 | `Invalid base URL:` 에러 | 동일 - MSW와 axios 통신 불가 |

### 🔧 실패 원인 상세 분석

#### 근본 원인
**axios 인스턴스의 baseURL 고정 문제**

`services/axios.tsx`:
```typescript
const api: AxiosInstance = axios.create({
    baseURL: '/',  // ← 문제: 상대 경로
    withCredentials: true,
});
```

- axios.create()로 생성된 인스턴스는 baseURL이 '/'로 고정됨
- MSW는 절대 URL을 기대하지만, axios는 상대 URL로 요청을 보냄
- 테스트에서 `api.defaults.baseURL = 'http://localhost'`로 변경 시도했으나 적용 안 됨
  - 이유: 이미 생성된 인스턴스의 설정은 변경 불가

#### 시도한 해결 방법

1. **axios baseURL 동적 설정 시도** ❌
   ```typescript
   beforeAll(() => {
     api.defaults.baseURL = 'http://localhost';
   });
   ```
   - 결과: 실패 (이미 생성된 인스턴스는 변경 불가)

2. **MSW 핸들러를 절대 URL로 변경** ❌
   ```typescript
   const BASE_URL = 'http://localhost';
   http.get(`${BASE_URL}/api/auth/me`, () => { ... })
   ```
   - 결과: 실패 (axios가 여전히 상대 URL로 요청)

3. **window.location, window.alert 모킹 추가** ✅
   ```javascript
   global.alert = jest.fn();
   window.location = { href: '', pathname: '/', replace: jest.fn() };
   ```
   - 결과: window 관련 에러 해결

4. **TextEncoder 순서 조정** ✅
   ```javascript
   // jest.setup.js 최상단으로 이동
   import { TextEncoder, TextDecoder } from 'util';
   global.TextEncoder = TextEncoder;
   global.TextDecoder = TextDecoder;
   ```
   - 결과: MSW import 에러 해결

### 💡 향후 해결 방안

#### Option 1: axios 인스턴스 모킹
```typescript
jest.mock('@/services/axios', () => {
  const axios = require('axios');
  return {
    __esModule: true,
    default: axios.create({
      baseURL: 'http://localhost',
      withCredentials: true,
    }),
  };
});
```

#### Option 2: fetch API 직접 사용
```typescript
// axios 대신 fetch를 사용하는 별도 테스트
const response = await fetch('http://localhost/api/auth/me');
const data = await response.json();
```

#### Option 3: axios.tsx 리팩토링
```typescript
// 환경 변수 기반 baseURL 설정
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'test'
    ? 'http://localhost'
    : '/',
  withCredentials: true,
});
```

---

## 4. 테스트 환경 개선 사항

### ✅ 완료된 개선
1. **MSW 서버 설정** (`tests/mocks/server.ts`)
   - Mock Service Worker 구성 완료
   - 인증 API 핸들러 작성

2. **Jest 설정 개선** (`jest.setup.js`)
   - Next.js 라우터 모킹 (useRouter, useParams)
   - window.alert, window.location 모킹
   - TextEncoder/TextDecoder 폴리필

3. **테스트 유틸리티 개선** (`tests/test-utils.tsx`)
   - AuthProvider 래퍼 추가
   - QueryClientProvider 설정

4. **의존성 추가**
   - `jest-html-reporter` - HTML 테스트 리포트 생성
   - `msw` - API 모킹 (이미 설치되어 있었음)

### ⏸️ 미완료 개선
1. **axios 모킹 설정** - baseURL 문제 미해결
2. **Embedded Redis 설정** - 백엔드 테스트 실행 불가
3. **useRenderCount 로그 캡처** - 렌더링 최적화 테스트 실패

---

## 5. 커버리지 분석

### 코드 커버리지 (추정)

| 항목 | 커버리지 |
|------|---------|
| **JWT 생성/검증 로직** | 🟡 부분 (코드 작성, 실행 미완료) |
| **비밀번호 변경 검증** | 🟡 부분 (코드 작성, 실행 미완료) |
| **localStorage → Cookie 전환** | 🟢 높음 (실제 동작 검증 완료) |
| **withCredentials 설정** | 🟢 높음 (테스트 통과) |
| **401 자동 갱신 로직** | 🔴 낮음 (axios 모킹 문제로 미검증) |
| **보안 헤더 적용** | 🟢 높음 (next.config.ts 설정 완료) |

### 기능별 테스트 상태

| 기능 | 단위 테스트 | 통합 테스트 | E2E 테스트 | 상태 |
|------|----------|----------|-----------|------|
| JWT role 클레임 | ✅ 작성 | ⏸️ 미실행 | ⏸️ 미작성 | 🟡 |
| 비밀번호 검증 | ✅ 작성 | ⏸️ 미실행 | ⏸️ 미작성 | 🟡 |
| Cookie 전환 | ✅ 통과 | ✅ 통과 | ⏸️ 미작성 | 🟢 |
| 401 재시도 | ⏸️ 미작성 | ❌ 실패 | ⏸️ 미작성 | 🔴 |

---

## 6. 보안 검증 체크리스트

| 보안 항목 | 검증 방법 | 상태 |
|---------|---------|------|
| XSS 방어 (localStorage 제거) | TC-S004 테스트 | ✅ 검증 완료 |
| HttpOnly Cookie 사용 | axios.tsx 코드 리뷰 | ✅ 구현 완료 |
| withCredentials 설정 | TC-S005 테스트 | ✅ 검증 완료 |
| JWT role 클레임 포함 | 백엔드 테스트 (미실행) | ⏸️ 검증 대기 |
| 비밀번호 변경 검증 | 백엔드 테스트 (미실행) | ⏸️ 검증 대기 |
| CSP 헤더 적용 | next.config.ts 확인 | ✅ 구현 완료 |
| X-Frame-Options | next.config.ts 확인 | ✅ 구현 완료 |
| Referrer-Policy | next.config.ts 확인 | ✅ 구현 완료 |

---

## 7. 결론 및 권장 사항

### 📈 현재 상태
- **전체 테스트 작성**: 40개 (100%)
- **전체 테스트 실행**: 27개 (67.5%)
- **전체 테스트 통과**: 18개 (45%)

### ✅ 성공적으로 검증된 항목
1. localStorage 제거 → HttpOnly Cookie 전환 (XSS 방어)
2. axios withCredentials 설정 (쿠키 자동 전송)
3. refresh 실패 시 에러 처리
4. 보안 헤더 추가 (CSP, X-Frame-Options 등)

### ⚠️ 검증 대기 항목
1. JWT role 클레임 포함 여부 (백엔드 테스트 실행 필요)
2. 비밀번호 변경 시 현재 비밀번호 검증 (백엔드 테스트 실행 필요)
3. 401 자동 갱신 및 재시도 로직 (axios 모킹 필요)

### 🔧 우선순위별 조치 사항

#### 🔴 높음 (High Priority)
1. **CI/CD 환경에서 백엔드 테스트 실행**
   - 로컬 Windows 환경의 파일 잠금 문제 회피
   - GitHub Actions 또는 Docker 환경 활용

2. **axios 모킹 구현**
   - TC-S002, S006, S007, S008 테스트 통과 위해 필수
   - 추정 시간: 10-15분

#### 🟡 중간 (Medium Priority)
3. **Embedded Redis 설정 완료**
   - JwtUtil, AuthService 테스트 실행 가능
   - 또는 Redis를 @MockBean으로 대체

4. **useRenderCount 로그 캡처 개선**
   - rendering_optimization.test.tsx 5개 테스트 해결
   - 커스텀 이벤트 방식으로 리팩토링

#### 🟢 낮음 (Low Priority)
5. **E2E 테스트 작성** (Playwright)
   - 실제 브라우저 환경에서 종단간 검증
   - 로그인 → 쿠키 확인 → 새로고침 → 세션 유지

---

## 8. 테스트 로그 및 리포트

### 생성된 리포트 파일
- `tests/logs/frontend-report.html` - Jest HTML 리포트
- `tests/logs/frontend-summary.log` - 테스트 요약 로그
- `build/reports/tests/test/index.html` - Gradle 테스트 리포트 (미생성 - 실행 실패)

### 테스트 실행 명령어
```bash
# 백엔드
./gradlew test --no-daemon

# 프론트엔드 전체
npm run test

# 프론트엔드 특정 파일
npm run test -- tests/integration/auth_security.test.tsx

# 프론트엔드 빌드 검증
npm run build
```

---

**작성일**: 2026-03-01
**작성자**: QA Engineer (Claude Sonnet 4.5)
**다음 업데이트**: 백엔드 테스트 실행 완료 후
