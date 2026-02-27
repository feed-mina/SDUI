# SDUI (Server -Driven UI)

## 📌 프로젝트 개요

 UI의 구조와 비즈니스 로직을 데이터화하여 서버에서 제어 
### 기술스택 : Next.js, React, Spring Boot, JPA, Redis, PostgreSQL, AWS EC2, Vercel, Github Actions


**하드코딩된 UI구조**로 인해 기능 변경시 마다 클라이언트 배포가 필요한 부분을 **서버에서 UI 메타데이터로 전달**하면 클라이언트 엔진에서 이를 해석하여 화면을 그리는 구조슬 설계했습니다.

> "UI를 레고 블록을 쌓는 것처럼, 하드코딩에서 벗어나 메타데이터로 화면을 제어하는 SDUI 엔진 구축"
> 반복되는 UI 수정과 하드코딩 배포 프로세스의 비효율을 경험하며 이를 해결하기 위한 설계의 필요성을 느끼게 되었습니다.
> 과거에는 구현 속도에만 급급해 기본기를 놓쳤지만 지금은 설계부터 꼼꼼히 구현했습니다.
> 데이터와 UI를 분리해서 효율적으로 관리하는 철학을 가지고 있습니다.
---

[//]: # (## 🖼 대표 화면)

[//]: # (| 메인페이지 | 감정 일기 작성 | 일기 리스트 | 상세 보기 |)

[//]: # (|------------|----------------|--------------|------------|)

[//]: # (| ![main]&#40;./assets/main.png&#41; | ![write]&#40;./assets/0002.png&#41; | ![list]&#40;./assets/0005.png&#41; | ![detail]&#40;./assets/0010.png&#41; |)

## 🚀 주요 원칙
### ✔ Backend : No code in DB
1. ** 유저나 주요 비즈니스 로직은 도메인으로 API와 QueryDSL로로 관리 **
   -  
   -
2. ** 렌더링은 서버에서 UI 메타데이터를 내려주면 클라이언트 엔진이 이를 해석해 화면을 그리는 구조  **
   -
   -
### ✔ Frontend : Component Mapping
1. ** Dom의 태그를 필드별 관리 > 메카데이터로 관리하여 트리 구조로 렌더링  **  
   -  DynamicEngine: UI 트리 순회 및 가시성 처리 로직.
   -  MetadataProvider: React Query를 활용한 메타데이터 캐싱 및 전역 공급.
   -  Data Binding Strategy: ref_data_id를 통한 메타데이터와 실제 비즈니스 데이터의 결합 방식.
2. ** RBAC 권한별 페이지를 필터  **  
   -  
   -  

###  ✔ Data Binding
---

## 🛠 기술 스택
### Frontend (Next.js, React)
- 
-
-  

###  Backend (Spring Boot)
- Spring Security (인증 및 보안) / JWT (토큰 인증) / SMTP (이메일 인증) / OAuth 2.0 (카카오 로그인) 
- Redis
-
### DB (postgresql)
- jsonB 
-
-


### Infra (Docker, Github Actions, AWS EC2)
- CI/CD의 간편함을 느끼게 되었습니다.
-
-

--

## 📂 프로젝트 구조
```
SDUI
 
```

---

## 📌 API 명세
### 🔑 사용자 인증 API
| Method | Endpoint | 설명 |
|--------|------------------------|--------------------------------|
| POST   | `/api/auth/register`   | 일반 회원가입 (이메일 인증 포함) |
| POST   | `/api/auth/login`      | 일반 로그인 (JWT 발급) |
| GET    | `/api/auth/verify-email?token=xxx` | 이메일 인증 확인 |
| POST   | `/api/kakao/login`     | 카카오 로그인 |

[//]: # (### 📝 일기장 API)
[//]: # (| Method | Endpoint | 설명 |)
[//]: # (|--------|----------------------------|------------------|)

[//]: # (| POST   | `/api/diary/addDiaryList`  | 일기 작성 |)

[//]: # (| GET    | `/api/diary/viewDiarylist` | 일기 목록 조회 | )

### ✔ ui_metadata 구조
```json
```

### ✔ query_master 구조
```json
```

### ✔ RBAC 구조
```json
```
---

## 🛠 "레이아웃을 전역적으로 (Provider) 크기에 따라 className에 pc와 mobile로 분리"
```typescript
```
---

## 🛠 "리피터(Repeater) 컴포넌트 내에서 복잡한 계층 구조를 렌더링할 때의 성능 최적화 방법"
```typescript
```
---

## 🛠 "프로젝트를 구현하면서 규모가 커짐에 따라  Action 핸들러를 User와 Business, Base로 분리"
```typescript
```
---

## 🛠 "서버 데이터 타입과 클라이언트 컴포넌트 Props 간의 타입 안전성 확보 방법"
```typescript
```
---

```java
```

---

## 🚀 프로젝트 장점
- "JSON 기반 메타데이터 설계를 통해, 단순 UI 변경 시 클라이언트 코드 수정 없이 서버 설정만으로 화면의 80% 이상 제어 가능하도록 구현"
- "컴포넌트 매핑 구조를 통해 신규 컴포넌트 추가 시 엔진 수정 없이 설정 등록만으로 즉시 렌더링 지원"

## 배포 진행중에 있습니다.

[//]: # (https://justsaying.co.kr 접속 시 정상 동작 여부 확인중)

[//]: # (백엔드: http:/15.165.179.197:8080)

[//]: # (프론트엔드: http://web-2025-version1.s3-website.ap-northeast-2.amazonaws.com)
---

## 🔧 추가 기능 개선 아이디어
- 리액트네이티브로 App 개발로 확장
- 권한별 렌더링 기능을 비즈니스 서비스 반영 고민

 
---

## 📜 라이선스
이 프로젝트는 **MIT 라이선스**를 따릅니다.
 

