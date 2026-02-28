# Frontend Engineer — Plan

> 이 파일은 프론트엔드 구현 계획을 기록한다.
> 사용자의 명시적 승인("YES") 후에만 코드 작성을 시작한다.
> plan.md 인라인 메모를 최우선으로 반영한다.

---

## Plan 작성 템플릿

```markdown
## [기능 이름] 구현 계획 — {날짜}

### 배경
- 요청 출처: planner plan.md / 직접 요청
- 관련 화면: screen_id

### 영향받는 파일

| 파일 경로 | 변경 종류 | 변경 범위 |
|----------|----------|---------|
| `components/constants/componentMap.tsx` | 수정 | 신규 타입 1개 추가 |
| `components/fields/NewComponent.tsx` | 신규 | 신규 파일 생성 |
| `components/DynamicEngine/type.ts` | 수정 | props 타입 추가 |

### 접근 방식

#### Option A: [방식 이름]

**구현 방향:**
```typescript
// 핵심 코드 스니펫 (완성 코드 아님, 방향 제시)

// 1. 컴포넌트 정의
interface NewComponentProps {
  value?: string;
  onChange?: (id: string, value: string) => void;
  onAction?: (meta: Metadata, data?: any) => void;
  meta: Metadata;
}

const NewComponent: React.FC<NewComponentProps> = ({ value, onChange, meta }) => {
  return <div className={meta.cssClass}>{value}</div>;
};

// 2. componentMap 등록
const componentMap = {
  // 기존 ...
  NEW_TYPE: withRenderTrack(NewComponent),
};
```

**트레이드오프:**
- 장점: 기존 패턴 100% 재사용, DynamicEngine 수정 불필요
- 단점: 특수한 인터랙션이 있다면 onAction 콜백 범위 내에서만 처리 가능

#### Option B: [방식 이름]
- ...

### 권장안
Option A를 권장한다. 이유: ...

### TODO 리스트 (승인 후 순서대로 실행)

- [ ] 1. `components/DynamicEngine/type.ts` — 필요한 타입 필드 추가
- [ ] 2. `components/fields/NewComponent.tsx` — 컴포넌트 생성
- [ ] 3. `components/constants/componentMap.tsx` — NEW_TYPE 등록
- [ ] 4. (해당 시) `components/constants/screenMap.ts` — 화면 등록
- [ ] 5. (해당 시) `app/view/[...slug]/page.tsx` — PROTECTED_SCREENS 추가
- [ ] 6. (해당 시) `components/DynamicEngine/hook/useUserActions.tsx` — 인증 액션 추가
- [ ] 7. (해당 시) `components/DynamicEngine/hook/useBusinessActions.tsx` — 비즈니스 액션 추가
- [ ] 8. qa_engineer와 테스트 케이스 협의

### 승인 상태
[ ] 사용자 승인 대기 중
[x] 사용자 승인 완료 (날짜: ...)
[ ] 구현 완료
```

---

## [P2] JWT localStorage → Cookie 마이그레이션 + 보안 헤더 추가 계획 — 2026-02-28

### 배경
- 요청 출처: research.md `[P2] Security Audit` (2026-02-28)
- 상황: 백엔드는 이미 HttpOnly 쿠키로 토큰을 발급함. 프론트엔드만 아직 localStorage를 읽고 있어 아키텍처 불일치.
- DB 스키마 변경 없음 / 백엔드 변경 없음 — 프론트엔드 코드만 수정

---

### 수정 범위 요약

| 수정 항목 | 우선순위 | 파일 | 변경 종류 |
|----------|---------|------|---------|
| `axios.tsx` localStorage 참조 제거 | **P1** | `services/axios.tsx` | 수정 |
| `AuthContext.tsx` localStorage 잔존 여부 확인/제거 | **P1** | `context/AuthContext.tsx` | 확인 후 수정 |
| 보안 헤더 추가 (CSP 포함) | **P1** | `next.config.ts` | 수정 |

---

### FIX-1: `axios.tsx` localStorage 참조 제거 [P1 — 핵심]

#### 영향받는 파일

| 파일 경로 | 변경 종류 | 변경 내용 |
|----------|----------|---------|
| `metadata-project/services/axios.tsx` | 수정 | localStorage 3곳 제거, HttpOnly 쿠키 자동 전송으로 대체 |

#### 현재 코드 (변경 전)

```typescript
// Line 19 — 요청 인터셉터:
const token = localStorage.getItem('accessToken');
if (token) {
  config.headers['Authorization'] = `Bearer ${token}`;
}

// Line 49 — refresh 성공 시:
localStorage.setItem('accessToken', newAccessToken);

// Line 57 — 로그아웃/refresh 실패 시:
localStorage.removeItem('accessToken');
```

#### 변경 후 접근 방식

**백엔드가 HttpOnly 쿠키로 accessToken을 발급하므로, `withCredentials: true`만 설정하면 브라우저가 자동으로 쿠키를 전송한다. `Authorization: Bearer ...` 헤더 방식을 완전히 제거한다.**

```typescript
// Line 19 — 요청 인터셉터: Authorization 헤더 주입 코드 삭제
// (쿠키가 withCredentials: true로 자동 전송됨)
// 삭제할 코드:
// const token = localStorage.getItem('accessToken');
// if (token) { config.headers['Authorization'] = `Bearer ${token}`; }

// Line 49 — refresh 성공 시: localStorage.setItem 삭제
// (백엔드가 새 accessToken을 Set-Cookie로 내려줌)
// 삭제할 코드:
// localStorage.setItem('accessToken', newAccessToken);

// Line 57 — 로그아웃/refresh 실패 시: localStorage.removeItem 삭제
// 삭제할 코드:
// localStorage.removeItem('accessToken');
```

**전제 조건 확인:**
- `axios` 인스턴스에 `withCredentials: true` 설정 여부 확인 (이미 있을 가능성 높음)
- 백엔드 JwtAuthenticationFilter가 쿠키에서도 토큰을 읽는지 확인 (`JwtAuthenticationFilter.resolveToken()`)

**트레이드오프:**
- 장점: XSS 취약점 완전 제거, 아키텍처 일관성 확보
- 단점: 페이지 새로고침 시 `/api/auth/me`로 세션 복구 의존 (현재 `AuthContext.tsx`에서 이미 구현됨)

---

### FIX-2: 보안 헤더 추가 [P1]

#### 영향받는 파일

| 파일 경로 | 변경 종류 | 변경 내용 |
|----------|----------|---------|
| `metadata-project/next.config.ts` | 수정 | `headers()` 메서드 추가 |

#### 변경안

```typescript
// next.config.ts에 headers() 추가:
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",  // Next.js 인라인 스크립트 허용 필요
            "style-src 'self' 'unsafe-inline'",   // Tailwind 인라인 스타일 허용 필요
            "img-src 'self' data: blob:",
            "connect-src 'self' http://localhost:8080",
            "object-src 'none'",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    },
  ];
},
```

**주의:** `'unsafe-inline'` 허용은 XSS 방어를 약화시킴. Next.js 특성상 인라인 스크립트가 필요하므로 nonce 기반 CSP가 이상적이나 구현 복잡도가 높음. 단계적 적용 권장.

---

### 전제 조건 확인 (수정 전 체크)

수정 시작 전 다음 사항을 코드에서 직접 확인해야 함:

1. **`JwtAuthenticationFilter.java`의 `resolveToken()`** — 쿠키에서도 토큰을 읽는가?
   ```java
   // 현재 코드에서 확인:
   // Authorization 헤더만 읽는다면 → 쿠키 읽기 로직 추가 필요 (백엔드 수정 필요)
   // 이미 쿠키에서 읽는다면 → 프론트엔드만 수정해도 됨
   ```

2. **`axios.tsx`의 기존 `withCredentials` 설정** — 이미 `true`인가?
   ```typescript
   // 확인 필요: axios.create({ withCredentials: true, ... })
   ```

3. **`AuthContext.tsx`** — 로그인/로그아웃 시 localStorage 참조가 남아 있는가?

---

### 검증 방법 (수정 후)

| 시나리오 | 검증 방법 | 기대 결과 |
|---------|---------|---------|
| 로그인 후 localStorage 확인 | 브라우저 DevTools > Application > Local Storage | `accessToken` 키 없음 |
| 로그인 후 Cookie 확인 | DevTools > Application > Cookies | `accessToken` HttpOnly 쿠키 있음 |
| API 요청 헤더 확인 | DevTools > Network | `Authorization` 헤더 없음, `Cookie` 헤더에 토큰 |
| 새로고침 후 로그인 유지 | 브라우저 새로고침 | 인증 상태 유지됨 |
| 보안 헤더 확인 | DevTools > Network > Response Headers | CSP, X-Frame-Options 등 있음 |

---

### TODO 리스트 (승인 후 순서대로 실행)

- [x] 1. `JwtAuthenticationFilter.java` `resolveToken()` 쿠키 읽기 여부 확인 — ✅ 이미 쿠키 지원 확인됨
- [x] 2. `services/axios.tsx` — `withCredentials: true` 설정 확인 — ✅ 이미 설정됨
- [x] 3. `services/axios.tsx` — Line 19 localStorage 및 Authorization 주석처리 완료
- [x] 4. `services/axios.tsx` — Line 49 localStorage.setItem 주석처리 완료
- [x] 5. `services/axios.tsx` — Line 57 localStorage.removeItem 주석처리 완료
- [x] 6. `context/AuthContext.tsx` — localStorage 미사용 확인 완료
- [x] 7. `next.config.ts` — `headers()` 메서드 추가 완료 (CSP 포함)
- [x] 8. `npm run build` 빌드 에러 없음 확인 — ✅ TypeScript 에러 없이 성공
- [x] 9. `npm run test` 확인 — ⚠️ 15/20 passed (5 failed는 기존 rendering_optimization 문제)
- [ ] 10. 브라우저에서 로그인 → localStorage 비어있음 + 쿠키에 토큰 확인 //[매모] 사용자 수동 테스트 필요

---

### 승인 상태
- [x] 사용자 승인 완료 (날짜: 2026-03-01)
- [x] 구현 완료 (날짜: 2026-03-01)

---

## 구현 결과 — 2026-03-01

### ✅ 완료된 수정 사항

#### 1. axios.tsx — localStorage → Cookie 전환
**파일**: `services/axios.tsx`
- Line 19: localStorage.getItem('accessToken') 주석처리
- Line 22-23: Authorization 헤더 설정 주석처리
- Line 49: localStorage.setItem 주석처리 (백엔드가 Set-Cookie로 자동 설정)
- Line 57: localStorage.removeItem 주석처리
- 모든 주석에 `[2026-03-01 보안 강화]` 태그 추가
**효과**: XSS 취약점 제거, HttpOnly Cookie로 토큰 보호

#### 2. next.config.ts — 보안 헤더 추가
**파일**: `next.config.ts`
```typescript
async headers() {
  return [{ source: '/(.*)', headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Content-Security-Policy', value: '...' }
  ]}];
}
```
**효과**: Clickjacking, MIME sniffing, XSS 등 다층 방어

#### 3. 테스트 환경 개선
**파일**: `jest.setup.js`, `tests/test-utils.tsx`
- Next.js `useRouter`, `useParams`, `usePathname`, `useSearchParams` 모킹 추가
- `AuthProvider` 래퍼 추가
**결과**: 테스트 통과율 35% → 75% 개선 (7/20 → 15/20)

### ⚠️ 남은 테스트 실패 (5개)
**파일**: `tests/rendering_optimization.test.tsx`
**원인**: `engineLogs.length` 캡처 실패 (useRenderCount 훅 문제)
**영향**: axios.tsx 수정과 무관한 기존 테스트 환경 문제

### 🔄 사용자 수동 검증 필요
브라우저에서 직접 확인:
1. 로그인 후 DevTools > Application > Local Storage → `accessToken` 키 없음
2. DevTools > Application > Cookies → `accessToken` HttpOnly 쿠키 존재
3. DevTools > Network > Request Headers → `Cookie` 헤더에 토큰 포함
4. 새로고침 후 로그인 유지 여부 확인
- 