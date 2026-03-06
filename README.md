# SDUI (Server-Driven UI) Engine

> **"하드코딩 배포 없이, 서버 컨트롤만으로 화면의 80%를 제어하는 동적 UI 아키텍처"**

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?logo=spring-boot&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)

## 📌 1. 프로젝트 개요

SDUI는 반복되는 프론트엔드 UI 수정과 하드코딩 배포 프로세스의 비효율을 해결하기 위해 기획된 **서버 중심 메타데이터 렌더링 엔진**입니다. 
UI의 구조(Component, Layout, Action)와 비즈니스 로직을 데이터베이스(`ui_metadata`)로 추상화하여, **단순 화면 변경 시 클라이언트 배포 없이 서버 설정만으로 즉각적인 런타임 업데이트가 가능**하도록 구현했습니다.

* **🎯 목표:** "UI를 레고 블록처럼" 조합하여 B2B 어드민/백오피스 확장에 유연한 아키텍처 구축
* **💡 철학:** 프론트엔드는 렌더링 코어 로직만 갖추고, 비즈니스 흐름과 레이아웃 제어권은 백엔드에 위임 (No Code in DB)

---

## 🏗 2. 시스템 아키텍처 (Architecture & Data Flow)

### 🔄 핵심 렌더링 파이프라인
메타데이터 로딩 파이프라인에서 발생하는 RDBMS 부하를 막기 위해 **Redis 캐싱 계층**을 두어 Cache Hit 비율을 극대화했습니다.

```text
[ Client (Browser) ]
      │
      ▼ (URL 진입: /view/{screenId})
[ Next.js Middleware & Provider ] ──( 1. GET /api/ui/{screenId} 호출 )──▶ [ Spring Boot API ]
      │                                                                        │
      │                                    ┌──(Cache Hit)── [ Redis Cache (TTL 1hr) ]
      │                                    │
      │                                    └──(Cache Miss)─ [ PostgreSQL ui_metadata ]
      │
      ▼ (2. UI 트리 및 비즈니스 데이터 Fetch)
[ DynamicEngine.tsx ]
      │ 3. 컴포넌트 매핑 (ComponentMap.tsx)
      │ 4. 데이터 바인딩 (ref_data_id 연결)
      ▼
[ 동적 화면 렌더링 완료 렌더링 ]
```

---

## 🔥 3. 핵심 기술 의사결정 (Tech Reasoning)

### ① 데이터와 UI의 완벽한 분리 및 바인딩 (`ref_data_id`)
* 클라이언트 엔진(`DynamicEngine`)과 서버 데이터(`query_master`)를 강결합하지 않고, `ref_data_id`라는 식별자로 느슨하게 바인딩했습니다.
* 레이아웃 메타데이터 수정만으로 모바일/PC 반응형 뷰(`group_direction: ROW/COLUMN`)를 즉각 전환할 수 있습니다.

### ② 리피터(Repeater) 패턴을 통한 재귀 렌더링 성능 최적화
* 게시판이나 리스트뷰처럼 동일 구조가 반복되는 UI를 그릴 때, 배열 안의 모든 자식을 DB에 하드맵핑하지 않습니다.
* `ref_data_id`가 배열 타입일 경우, Engine 레벨에서 **단일 자식 템플릿 그룹(Parent Group)을 요소 개수만큼 동적 복제하여 렌더링**하도록 최적화했습니다.

### ③ Action Handler 분리를 통한 확장성 보장 (OCP)
* 애플리케이션 규모 확장에 대비해 이벤트를 분산시켰습니다.
* 사용자의 액션을 `usePageHook`이 가로채어, 보안/인증 로직은 `useUserActions`로, 일반 조회/작성 비즈니스 로직은 `useBusinessActions`로 라우팅하는 구조를 채택했습니다.

---

## 🛠 4. 기술 스택 (Tech Stack)

### Frontend Engine (`metadata-project`)
* **Core:** Next.js (App Router), React 19, TypeScript
* **State & Data Fetching:** Zustand, React Query
* **Testing:** Jest, React Testing Library, Playwright (E2E)

### Backend Service (`SDUI-server`)
* **Core:** Java 17, Spring Boot 3.x, Spring Security
* **Auth:** JWT Token, OAuth 2.0 (Kakao) 
* **Database & Cache:** PostgreSQL (JSONB 활용), Redis (TTL 전략 적용)

### Infra & DevOps
* **CI/CD:** GitHub Actions -> AWS S3 & Vercel (Frontend), EC2 (Backend)
* **Container:** Docker Compose (로컬 통합 인프라)

---

## 🤖 5. AI-Assisted Development Workflow

본 프로젝트는 1인 풀스택 환경의 한계를 극복하고 개발 생산성을 끌어올리기 위해 **코드 레벨의 아키텍처는 직접 설계하되, 반복 작업과 에러 디버깅은 AI(Claude Code) 서브에이전트에게 위임(Delegation)**하는 하이브리드 워크플로우를 채택했습니다.

### 👤 Human Tasks (직접 설계 및 통제)
* **아키텍처/데이터베이스 모델링**: `ui_metadata`와 `query_master` 간의 관계 설정, N+1 쿼리 최적화 정책, Redis Caching 아키텍처 기획.
* **코어 비즈니스 로직**: `DynamicEngine` 트리의 재귀적 컴포넌트 렌더링 방식 및 인증/인가(Spring Security) 파이프라인 뼈대 작성.
* **최종 코드 리뷰 및 병합(Merge)**: 에이전트가 작성한 코드가 초기 설계 원칙(OCP, 단일 책임 원칙 등)에 위배되지 않는지 검수.

### 🤖 AI Agent Tasks (Claude 위임)
* **단순 보일러플레이트 작성**: 정의해 둔 컴포넌트 맵(`ComponentMap`)을 바탕으로 다량의 폼(Input, Button 등) 렌더링 코드 반복 생성.
* **복잡한 설정 및 오류 트러블슈팅**: Vercel 배포 시 나타나는 CSP(CSP Policy) 난독화 오류, DOM 속성 충돌(DOM Props Warning), React-Query 캐시 불일치 등의 프론트엔드 파편화 이슈를 프롬프트 로그 기반으로 주입하여 수 분 단위로 해결 방안 도출 및 수정 리포트(`march_2_final_fix.md` 등) 추출. 

> *"AI는 코드를 짜주지 않습니다. 명확한 아키텍처와 도메인 규칙을 주입했을 때, 비로소 강력한 서브엔지니어 도구로 동작합니다."*

---

## 📋 6. DB 엔티티 설계 고찰

### ✔ `ui_metadata` 핵심 구조
동적 화면을 구성하는 가장 기본이 되는 설계 테이블입니다.
* `screen_id`: 그룹화된 특정 화면 단위 식별 키
* `component_type`: React 컴포넌트와 1:1 매핑 타겟 (`INPUT`, `BUTTON`, `MODAL` 등)
* `parent_group_id`: 부모-자식 컴포넌트 간 트리 계층 구조 형성
* `action_type`: 컴포넌트 클릭 시 트리거될 상수화된 이벤트 키 (`LOGIN_SUBMIT` 등)

---

### 전체 흐름

```
URL /view/{screenId}
    ↓
[MetadataProvider] (components/providers/MetadataProvider.tsx)
    React Query: GET /api/ui/{screenId}
    캐시 키: {rolePrefix}_{screenId}  stale: 5분
    제공값: screenId, refId, menuTree
    ↓
[CommonPage] (app/view/[...slug]/page.tsx)
    usePageMetadata(screenId, currentPage, isOnlyMine, refId)
      → metadata, pageData, totalCount, loading
    usePageHook(screenId, metadata, pageData)
      → formData, handleChange, handleAction, activeModal, closeModal
    combineData = { ...pageData, ...formData }  ← formData가 pageData 덮어씀
    ↓
[DynamicEngine] (components/DynamicEngine/DynamicEngine.tsx)
    useDynamicEngine(metadata, pageData, formData) → treeData, getComponentData
    useDeviceType() → deviceClass ("is-pc" | "is-mobile")
    ↓
    renderNodes(treeData)   ← 재귀 순회
    renderModals(treeData)  ← MODAL 전용 별도 렌더링
```

---

### renderNodes 분기 로직 (DynamicEngine.tsx:26)

```
노드 하나 수신
  │
  ├── isVisible === false  →  null 반환 (렌더링 제외)
  │
  ├── children 있음 (Group 노드)
  │    │  className: "group-{componentId} {cssClass} flex-row/col-layout"
  │    │
  │    ├── refDataId 있음 → Repeater
  │    │    pageData[refId] 배열을 .map() 순회
  │    │    각 item을 rowData로 전달하며 renderNodes(children, item) 재귀
  │    │
  │    └── refDataId 없음 → 일반 Group
  │         <div className={combinedClassName}>
  │           renderNodes(children, rowData) 재귀
  │         </div>
  │
  └── children 없음 (Leaf 노드)
       typeKey = componentType.toUpperCase()
       Component = componentMap[typeKey]
       Component 없거나 typeKey === "DATA_SOURCE" → null
       finalData = getComponentData(node, rowData)
       <Component id meta data onChange onAction {...rest} />
```

---

### 데이터 바인딩 우선순위 (useDynamicEngine.tsx:11)

```typescript
getComponentData(node, rowData):

1순위  formData[refId]      // 사용자가 현재 입력 중인 값 (입력 즉시 반영)
2순위  rowData              // 리피터 안 개별 행 데이터 (목록 페이지)
3순위  pageData[refId]      // 서버에서 가져온 데이터 (상세/조회 페이지)
         └─ 단일 컴포넌트인데 배열로 왔을 때 → [0] 추출
4순위  pageData 전체        // fallback
```


### Provider 계층 (app/layout.tsx)

```
ReactQueryProvider
  └── AuthProvider
        └── MetadataProvider
              └── AppShell
                    └── {children}  ← CommonPage → DynamicEngine
```

---


## 🚀 6. 로컬 실행 방법 (Getting Started)

### 의존성 인프라 실행 (DB, Redis)
```bash
docker-compose up -d
```

### Spring Boot 실행
```bash
cd SDUI-server
./gradlew bootRun
```

### Next.js 실행
```bash
cd metadata-project
npm install
npm run dev
```

---
*Developed by Min Yerin (2년 차 풀스택/백엔드 개발자)* 
*Contacts: dbdlstltm94@gmail.com*
