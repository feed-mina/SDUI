# BTS 이벤트 페이지 + SDUI 프로젝트 이슈 분석

> 작성일: 2026-03-21
> 브랜치 현황: `feature/bts-event-complete` (로컬), `main` (EC2 배포 기준)
> 분석 범위: bts-event 페이지 전체 기능 + SDUI 프로젝트 영향 범위

---

## 핵심 요약

| 구분 | 이슈 수 | 심각도 |
|------|---------|--------|
| BTS 이벤트 페이지 | 7개 | Critical 4 / Warning 3 |
| SDUI 프로젝트 | 2개 | Critical 1 / Warning 1 |

**공통 근본 원인**: `feature/bts-event-complete` 브랜치의 핵심 변경사항(SecurityConfig, AiChatController, V35 마이그레이션)이 `main` 브랜치에 미머지된 채로 EC2 배포됨.

---

## A. BTS 이벤트 페이지 이슈

### A-1. [CRITICAL] AI 채팅 완전 불가
- **증상**: 채팅 입력 후 전송 시 오류 / 응답 없음
- **원인**: `POST /api/ai/guest/chat` 엔드포인트가 `main` 브랜치의 `AiChatController`에 없음
  - feature 브랜치: `@PostMapping("/guest/chat")` + `ChatService.createGuestReply()` 존재
  - main 브랜치: `AiChatController`에 `/guest/chat` 없음 → 404 반환
- **추가 원인**: SecurityConfig(main)에 `/api/ai/guest/**` permitAll 없음 → 401 반환 (404보다 먼저 차단)
- **파일**: `SDUI-server/.../ai/controller/AiChatController.java`, `SecurityConfig.java`
- **수정 방향**: SecurityConfig + AiChatController의 guest chat 엔드포인트를 main에 반영

---

### A-2. [CRITICAL] 이미지 업로드 "로그인 필요" 오류
- **증상**: FanBoard 글쓰기 시 이미지 첨부 → "Image upload failed. Please check your connection or login status."
- **원인 1**: main 브랜치 SecurityConfig에 `/api/ai/interview/resume/upload` permitAll 없음 → 401
- **원인 2**: main 브랜치 `AiInterviewController.uploadResume()`에서 `userDetails.getUserSqno()` 호출 시 null 체크 없음 → 설령 permitAll이 있어도 NPE 발생
  - feature 브랜치: `(userDetails != null) ? userDetails.getUserSqno() : 0L` 처리됨
  - main 브랜치: `userDetails.getUserSqno()` 직접 호출 → NPE
- **파일**: `SecurityConfig.java`, `AiInterviewController.java`
- **수정 방향**: permitAll 추가 + null 체크 null-safe 처리 main 반영

---

### A-3. [CRITICAL] 음성 입력(STT) 불가
- **증상**: 마이크 버튼 녹음 후 전송 실패
- **원인 1**: main 브랜치 SecurityConfig에 `/api/ai/stt` permitAll 없음 → 401
- **원인 2**: main 브랜치 `AiSttController`에서 `userDetails.getUserSqno()` null 체크 없음 → NPE
  - feature 브랜치: `userDetails != null ? ... : "GUEST"` 처리됨
  - main 브랜치: `userDetails.getUserSqno()` 직접 호출 → NPE
- **파일**: `SecurityConfig.java`, `AiSttController.java`
- **수정 방향**: permitAll 추가 + null-safe 처리 main 반영

---

### A-4. [CRITICAL] 팬 게시판 FanBoard 데이터 조회/작성 불가
- **증상**: 게시판 목록 로딩 실패, 게시글 작성 실패
- **원인**: V35 마이그레이션이 main 브랜치에 없음 → EC2 DB에 fan_board 테이블 없음
  - `GET_FANBOARD_LIST`, `GET_FANBOARD_DETAIL`, `INSERT_FANBOARD` 쿼리도 query_master에 없음
  - `/api/execute/GET_FANBOARD_LIST` → query_master에서 sql_key 조회 실패 → 에러
- **추가 이슈**: `UPDATE_CONTENT_DETAIL` 쿼리도 V35에 없음 → 게시글 수정 기능 항상 실패
- **파일**: `V35__setup_fanboard_system.sql` (feature 브랜치에만 존재)
- **수정 방향**: V35 마이그레이션을 main에 반영 후 EC2 재배포 (단, 아래 SDUI 이슈 A4 확인 필수)

---

### A-5. [WARNING] CCTV 버튼 연결 불가 ✅ 수정 완료
- **증상**: CCTV 버튼 클릭 시 "사이트에 연결할 수 없습니다"
- **원인**: `InfoPanel.tsx`에서 `https://cctv.seoul.go.kr` 사용 → SSL 미지원 사이트
- **수정**: `http://cctv.seoul.go.kr` 으로 변경 완료 (`InfoPanel.tsx:84`)

---

### A-6. [WARNING] Vercel 환경변수 NEXT_PUBLIC_API_BASE 미설정 가능성
- **증상**: 모든 API 호출 실패 (채팅, 게시판 포함)
- **원인**: `bts-event/next.config.ts`에서 `NEXT_PUBLIC_API_BASE || "http://localhost:8080"` 사용
  - Vercel 대시보드에 이 변수가 설정 안 된 경우, 모든 API 요청이 localhost:8080으로 라우팅 → 실패
  - `.env.local`에는 localhost:8080으로 설정되어 있으나 Vercel에는 별도 설정 필요
- **수정 방향**: Vercel 대시보드 → bts-gwanghwamun 프로젝트 → Environment Variables에서
  `NEXT_PUBLIC_API_BASE = https://yerin.duckdns.org` 설정 확인/추가

---

### A-7. [WARNING] GuestChat.tsx 미커밋 변경사항
- **증상**: 마이크 녹음 후 자동 전송 기능이 Vercel에 미반영
- **원인**: `bts-event/components/Chat/GuestChat.tsx`에 uncommitted changes 존재
  - `handleVoiceToText()` 에서 `setInput(data.data.text)` → `handleSend(data.data.text)` 자동 전송으로 변경됨
  - 현재 main/feature 어디에도 커밋되지 않은 상태
- **수정 방향**: 현재 변경사항 커밋 후 배포

---

## B. SDUI 프로젝트 이슈 (이벤트 배포 영향)

### B-1. [CRITICAL] 콘텐츠 목록 페이지(CONTENT_LIST) 오작동
- **증상**: 로그인한 사용자의 콘텐츠 목록에서 **비공개(private) 게시물이 사라짐**
- **원인**: V35 마이그레이션이 기존 `GET_CONTENT_LIST_PAGE` 쿼리를 수정함
  ```sql
  -- V35에서 추가된 필터
  AND d.is_private = FALSE  ← 이 조건이 기존 쿼리에 없었음
  ```
  - 기존 쿼리: 로그인한 사용자의 모든 콘텐츠(공개+비공개) 표시
  - 수정 후: `is_private = FALSE`인 공개 게시물만 표시 → 비공개 포스트 전부 숨겨짐
  - 추가로 사용자 필터(`user_id = :userId` 조건)가 없어 전체 공개 게시물이 표시될 수 있음
- **파일**: `query_master` 테이블의 `GET_CONTENT_LIST_PAGE` row (DB에 직접 반영됨)
- **수정 방향**: 승인 후 수정
  ```sql
  -- 수정안: 기존 사용자별 필터 복원 + is_private 조건 제거 (또는 사용자 본인 private 허용)
  WHERE d.del_yn = 'N'
    AND (d.is_private = FALSE OR d.user_id = :userId)
    AND (:filterId IS NULL OR :filterId = '' OR d.day_tag1 = :filterId)
  ```
  > ⚠️ 기존 GET_CONTENT_LIST_PAGE 원본 쿼리 확인 필요

---

### B-2. [WARNING] SDUI CORS — bts-gwanghwamun.vercel.app 미등록
- **증상**: bts-event 페이지에서 API를 직접 호출하는 경우 CORS 오류 가능성
- **원인**: `SecurityConfig.corsConfigurationSource()`의 allowedOrigins에 `https://bts-gwanghwamun.vercel.app` 없음
  - 현재 허용: `sdui-delta.vercel.app`, `localhost:3000`, `yerin.duckdns.org` 등
  - bts-event는 Next.js 서버사이드 프록시(rewrites)를 사용하므로 일반 API 호출은 영향 없음
  - 단, 클라이언트 사이드 직접 호출(WebSocket 등) 시 문제 가능
- **수정 방향**: CORS allowedOrigins에 `https://bts-gwanghwamun.vercel.app` 추가 (SecurityConfig.java)

---

## 수정 우선순위 로드맵

### 즉시 수정 (BTS 이벤트 페이지 — 승인 없이 진행)
| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | ✅ CCTV URL 수정 (http) | `bts-event/components/InfoPanel.tsx` |
| 2 | SecurityConfig: 3개 permitAll 추가 | `SDUI-server/.../SecurityConfig.java` |
| 3 | AiSttController null-safe 처리 | `SDUI-server/.../AiSttController.java` |
| 4 | AiInterviewController null-safe 처리 | `SDUI-server/.../AiInterviewController.java` |
| 5 | GuestChat.tsx 변경사항 반영 상태 확인 | `bts-event/components/Chat/GuestChat.tsx` |
| 6 | Vercel 환경변수 NEXT_PUBLIC_API_BASE 확인 | Vercel 대시보드 |

### 승인 후 수정 (SDUI 프로젝트)
| 순서 | 작업 | 영향 범위 |
|------|------|----------|
| 1 | GET_CONTENT_LIST_PAGE 쿼리 복원 | SDUI 콘텐츠 목록 (is_private 필터 제거) |
| 2 | CORS allowedOrigins에 bts-gwanghwamun 추가 | SecurityConfig.java |

### EC2 재배포 필요 사항
- SecurityConfig 수정 후 `./gradlew bootRun` 재시작
- V35 마이그레이션 → Flyway 자동 적용 (fan_board 테이블 생성)
- query_master UPDATE는 V35에 포함 → 재배포 시 자동 실행

---

## 배포 현황 확인 필요 사항

1. **EC2 현재 브랜치**: main vs feature/bts-event-complete 중 어느 것?
2. **V35 실행 여부**: EC2 DB에 `fan_board` 테이블 존재 여부 → `SELECT * FROM flyway_schema_history WHERE version='35';`
3. **Vercel bts-event 환경변수**: NEXT_PUBLIC_API_BASE 값 확인
