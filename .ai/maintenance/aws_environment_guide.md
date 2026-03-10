# AWS 환경 구성 가이드

**작성일**: 2026-03-03
**대상**: SDUI 프로젝트 개발자 및 운영자
**목적**: AWS EC2 환경 구성 이해 및 인프라 확인 방법 제공

---

## 1. 데이터베이스 목록 및 용도

SDUI 프로젝트는 PostgreSQL 15를 사용하며, 환경별로 분리된 3개의 데이터베이스를 운영합니다.

| 데이터베이스명 | 환경 | 용도 | 접근 방법 |
|--------------|------|------|----------|
| **SDUI_TD** | Production | 프로덕션 데이터 (main 브랜치) | AWS EC2 `sdui-db` 컨테이너 |
| **SDUI_LAB** | Test/Lab | 테스트 환경 (lab/claude-dev 브랜치) | AWS EC2 `sdui-db` 컨테이너 |
| **testdb** | Local | 로컬 개발용 | `docker-compose.yml` (port 5433) |

### 데이터베이스 접속 정보

**AWS EC2 (SDUI_TD, SDUI_LAB)**:
```bash
# SSH 접속 후
docker exec -it sdui-db psql -U mina -d SDUI_TD
docker exec -it sdui-db psql -U mina -d SDUI_LAB

# 외부에서 접속 (SSH 터널링 필요)
ssh -L 5432:localhost:5432 ubuntu@43.201.237.68
psql -h localhost -U mina -d SDUI_TD
```

**로컬 (testdb)**:
```bash
# docker-compose.yml 실행 후
psql -h localhost -p 5433 -U postgres -d testdb
```

---

## 2. Docker 컨테이너 현황

AWS EC2에서 실행 중인 컨테이너 목록:

| 컨테이너명 | 이미지 | 포트 매핑 | 역할 | 연결 DB |
|-----------|--------|----------|------|---------|
| **sdui-db** | postgres:15 | 5432:5432 | PostgreSQL 데이터베이스 | - |
| **sdui-redis** | redis:latest | 6379:6379 | Redis 캐시 서버 | - |
| **sdui-backend** | {DOCKER_USERNAME}/sdui-app:main | 8080:8080 | 프로덕션 백엔드 (main) | SDUI_TD |
| **sdui-backend-lab** | {DOCKER_USERNAME}/sdui-app:lab-claude-dev | 8081:8080 | 테스트 백엔드 (lab) | SDUI_LAB |

### 컨테이너 확인 명령어

```bash
# 모든 SDUI 컨테이너 상태 확인
docker ps -a | grep sdui

# 실행 중인 컨테이너만 확인
docker ps | grep sdui

# 특정 컨테이너 상세 정보
docker inspect sdui-backend-lab

# 컨테이너 리소스 사용량
docker stats --no-stream | grep sdui
```

---

## 3. 네트워크 구성

### 외부 접근 정보

- **AWS EC2 Public IP**: 43.201.237.68
- **프로덕션 백엔드**: http://43.201.237.68:8080
- **테스트 백엔드**: http://43.201.237.68:8081
- **프론트엔드 (Vercel)**: https://sdui-delta.vercel.app

### 포트 매핑

| 포트 | 서비스 | 접근 범위 | 용도 |
|------|--------|----------|------|
| 8080 | sdui-backend (prod) | Public | 프로덕션 API |
| 8081 | sdui-backend-lab (test) | Public | 테스트 API |
| 5432 | sdui-db (PostgreSQL) | Internal (Docker network) | 데이터베이스 |
| 6379 | sdui-redis | Internal (Docker network) | Redis 캐시 |

**중요**: PostgreSQL(5432)와 Redis(6379)는 Docker 네트워크 내부에서만 접근 가능합니다. 외부 직접 접근 불가.

### Docker 네트워크

```bash
# Docker 네트워크 확인
docker network inspect sdui-network

# 네트워크 생성 (자동으로 생성되지 않은 경우)
docker network create sdui-network
```

**네트워크 타입**: Bridge
**연결된 컨테이너**: sdui-db, sdui-redis, sdui-backend, sdui-backend-lab

---

## 4. 브랜치별 환경 차이 비교

| 항목 | main 브랜치 (Production) | lab/claude-dev 브랜치 (Test) |
|------|-------------------------|------------------------------|
| **컨테이너명** | sdui-backend | sdui-backend-lab |
| **포트** | 8080 | 8081 |
| **데이터베이스** | SDUI_TD | SDUI_LAB |
| **Docker 이미지 태그** | main | lab-claude-dev |
| **배포 전략** | 수동 승인 후 배포 (신중) | 자동 배포 (테스트 목적) |
| **프론트엔드 연결** | Vercel Production | Vercel Production (API URL 전환) |
| **Flyway 마이그레이션** | 검증 완료 후 실행 | 테스트 우선 실행 |

### 배포 워크플로우

```
개발자 로컬 (testdb)
    ↓
lab/claude-dev 브랜치 → GitHub Actions → AWS EC2 (SDUI_LAB, port 8081)
    ↓ (검증 완료 후 병합)
main 브랜치 → GitHub Actions → AWS EC2 (SDUI_TD, port 8080)
```

---

## 5. 환경 변수 및 시크릿

### GitHub Secrets 목록

GitHub Actions에서 사용하는 시크릿 (Settings → Secrets and variables → Actions):

| Secret 이름 | 용도 | 사용 위치 |
|-------------|------|----------|
| **AWS_HOST** | EC2 Public IP (43.201.237.68) | SSH 접속 |
| **AWS_USERNAME** | EC2 사용자명 (ubuntu) | SSH 접속 |
| **AWS_KEY** | EC2 SSH Private Key | SSH 접속 |
| **DOCKER_USERNAME** | Docker Hub 사용자명 | 이미지 push/pull |
| **DOCKER_PASSWORD** | Docker Hub 비밀번호 | 이미지 push/pull |
| **DB_USERNAME** | PostgreSQL 사용자명 (mina) | DB 연결 |
| **DB_PASSWORD** | PostgreSQL 비밀번호 | DB 연결 |
| **JWT_SECRET_KEY** | JWT 토큰 서명 키 | Spring Security |
| **MAIL_PASSWORD** | 이메일 발송 비밀번호 | 회원가입 인증 |

### application-prod.yml에서 사용하는 환경변수

```yaml
spring:
  datasource:
    url: ${DB_URL}  # GitHub Actions에서 주입
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  mail:
    password: ${MAIL_PASSWORD}

jwt:
  secret-key: ${JWT_SECRET_KEY}
```

**중요**: 환경변수는 GitHub Actions `.github/workflows/deploy.yml`의 `docker run` 명령어에서 `-e` 플래그로 주입됩니다.

---

## 6. 확인 명령어 모음

### 6.1 컨테이너 상태 확인

```bash
# 전체 컨테이너 목록
docker ps -a | grep sdui

# 특정 컨테이너 로그 (최근 50줄)
docker logs --tail 50 sdui-backend-lab

# 실시간 로그 스트리밍 (Ctrl+C로 중단)
docker logs -f sdui-backend-lab

# 컨테이너 재시작
docker restart sdui-backend-lab

# 컨테이너 중지/시작
docker stop sdui-backend-lab
docker start sdui-backend-lab
```

### 6.2 데이터베이스 확인

```bash
# 데이터베이스 목록 조회
docker exec sdui-db psql -U mina -d postgres -c "\l"

# 테이블 목록 확인 (SDUI_LAB)
docker exec sdui-db psql -U mina -d SDUI_LAB -c "\dt"

# Flyway 마이그레이션 히스토리
docker exec sdui-db psql -U mina -d SDUI_LAB -c "SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank;"

# 특정 테이블 데이터 개수 확인
docker exec sdui-db psql -U mina -d SDUI_LAB -c "SELECT COUNT(*) FROM content;"

# 테이블 구조 확인
docker exec sdui-db psql -U mina -d SDUI_LAB -c "\d content"
```

### 6.3 Redis 확인

```bash
# Redis 연결 테스트
docker exec sdui-redis redis-cli PING

# 캐시 키 목록 확인
docker exec sdui-redis redis-cli KEYS "*"

# 특정 키 조회
docker exec sdui-redis redis-cli GET "USER_DIARY_LIST"

# 전체 캐시 삭제 (주의!)
docker exec sdui-redis redis-cli FLUSHDB

# 특정 키 삭제
docker exec sdui-redis redis-cli DEL "USER_DIARY_LIST"
```

### 6.4 API 테스트

```bash
# EC2 내부에서 테스트 (SSH 접속 후)
curl http://localhost:8081/api/content/list

# 외부에서 테스트 (로컬 머신에서)
curl http://43.201.237.68:8081/api/content/list

# 응답 포맷 확인 (JSON pretty print)
curl -s http://43.201.237.68:8081/api/content/list | jq .

# UI 메타데이터 조회
curl http://43.201.237.68:8081/api/ui/CONTENT_LIST
```

### 6.5 네트워크 및 포트 확인

```bash
# 포트 리스닝 상태 확인
sudo ss -tuln | grep -E '8080|8081|5432|6379'

# Docker 네트워크 목록
docker network ls

# sdui-network 상세 정보
docker network inspect sdui-network

# 컨테이너 IP 주소 확인
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' sdui-backend-lab
```

### 6.6 디스크 및 리소스 확인

```bash
# 디스크 사용량
df -h

# Docker 디스크 사용량
docker system df

# 컨테이너별 리소스 사용량
docker stats --no-stream

# 사용하지 않는 이미지/컨테이너 정리
docker system prune -a
```

---

## 7. 일반적인 인프라 작업

### 7.1 새 데이터베이스 생성

```bash
# PostgreSQL 접속
docker exec -it sdui-db psql -U mina -d postgres

# 데이터베이스 생성
CREATE DATABASE "SDUI_NEW";

# 권한 부여
GRANT ALL PRIVILEGES ON DATABASE "SDUI_NEW" TO mina;

# 확인
\l

# 종료
\q
```

### 7.2 스키마 복사 (테스트 환경 초기화)

```bash
# SDUI_TD의 스키마를 SDUI_LAB로 복사 (데이터 제외)
docker exec sdui-db pg_dump -U mina -d SDUI_TD --schema-only | \
docker exec -i sdui-db psql -U mina -d SDUI_LAB
```

### 7.3 데이터베이스 백업 및 복원

```bash
# 백업 (전체 덤프)
docker exec sdui-db pg_dump -U mina -d SDUI_TD > backup_$(date +%Y%m%d).sql

# 복원
cat backup_20260303.sql | docker exec -i sdui-db psql -U mina -d SDUI_TD
```

### 7.4 컨테이너 재배포 (수동)

```bash
# 최신 이미지 pull
docker pull {DOCKER_USERNAME}/sdui-app:lab-claude-dev

# 기존 컨테이너 중지 및 제거
docker stop sdui-backend-lab
docker rm sdui-backend-lab

# 새 컨테이너 시작
docker run -d --name sdui-backend-lab \
  -p 8081:8080 \
  --network sdui-network \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://sdui-db:5432/SDUI_LAB \
  -e SPRING_DATASOURCE_USERNAME=mina \
  -e SPRING_DATASOURCE_PASSWORD={YOUR_PASSWORD} \
  -e SPRING_DATA_REDIS_HOST=sdui-redis \
  -e SPRING_MAIL_PASSWORD={YOUR_MAIL_PASSWORD} \
  -e JWT_SECRET_KEY={YOUR_JWT_SECRET} \
  {DOCKER_USERNAME}/sdui-app:lab-claude-dev

# 로그 확인
docker logs -f sdui-backend-lab
```

---

## 8. 보안 및 주의사항

### 8.1 접근 제어

- **SSH 키 관리**: AWS_KEY는 GitHub Secrets에만 저장, 로컬 보관 금지
- **데이터베이스**: 외부 직접 접근 불가, SSH 터널링 필수
- **Redis**: 인증 없음, Docker 네트워크 내부에서만 접근 가능

### 8.2 보안 그룹 설정 (AWS Console)

현재 인바운드 규칙:

| Type | Protocol | Port | Source | 용도 |
|------|----------|------|--------|------|
| SSH | TCP | 22 | My IP | SSH 접속 |
| Custom TCP | TCP | 8080 | 0.0.0.0/0 | 프로덕션 API |
| Custom TCP | TCP | 8081 | 0.0.0.0/0 | 테스트 API |

**중요**: PostgreSQL(5432)와 Redis(6379)는 인바운드 규칙에 추가하지 마세요. 보안 위험!

### 8.3 데이터베이스 암호 변경 시

```bash
# 1. PostgreSQL 암호 변경
docker exec -it sdui-db psql -U mina -d postgres
ALTER USER mina WITH PASSWORD 'new_password';
\q

# 2. GitHub Secrets 업데이트
# GitHub → Settings → Secrets → DB_PASSWORD 수정

# 3. 컨테이너 재배포
# GitHub Actions 워크플로우 재실행 또는 수동 재배포
```

---

## 9. 모니터링 및 알림

### 9.1 헬스 체크

```bash
# 백엔드 헬스 체크 (Spring Boot Actuator)
curl http://43.201.237.68:8081/actuator/health

# 예상 응답: {"status":"UP"}
```

### 9.2 로그 모니터링

```bash
# 에러 로그만 필터링
docker logs sdui-backend-lab 2>&1 | grep -i "error\|exception"

# Flyway 로그 확인
docker logs sdui-backend-lab 2>&1 | grep -i "flyway"

# API 요청 로그 (Spring Boot 기본 로거)
docker logs sdui-backend-lab 2>&1 | grep -i "GET\|POST\|PUT\|DELETE"
```

---

## 10. 참고 자료

- **배포 체크리스트**: `.ai/maintenance/deployment_checklist.md`
- **DB 변경 가이드**: `.ai/maintenance/database_change_guide.md`
- **트러블슈팅**: `.ai/maintenance/troubleshooting_guide.md`
- **Flyway 가이드**: `.ai/backend_engineer/deployment_and_migration_guide.md`
- **GitHub Actions**: `.github/workflows/deploy.yml`

---

**문서 관리**:
- 작성자: Claude Sonnet 4.5
- 최종 업데이트: 2026-03-03
- 다음 리뷰 예정일: 2026-04-03 (1개월 후)
