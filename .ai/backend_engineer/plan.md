# Backend Engineer — Plan

> 이 파일은 백엔드 구현 계획을 기록한다.
> 사용자의 명시적 승인("YES") 후에만 코드 작성을 시작한다.
> 구현 순서: Entity → Repository → Service → Controller (계층 방향 준수)

---

## Plan 작성 템플릿

```markdown
## [기능 이름] 구현 계획 — {날짜}

### 배경
- 요청 출처: planner plan.md / 직접 요청
- 관련 화면: screen_id

### DB 스키마 변경안

```sql
-- 신규 테이블 또는 컬럼 추가
CREATE TABLE new_table (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_sqno BIGINT NOT NULL,
    -- 필드 목록
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_sqno) REFERENCES users(user_sqno)
);

-- 또는 기존 테이블에 컬럼 추가
ALTER TABLE ui_metadata ADD COLUMN new_field VARCHAR(50);
```

### API 스펙

#### 엔드포인트
```
POST /api/{domain}/{action}

Request Body:
{
  "fieldA": "string",
  "fieldB": 123
}

Response (성공):
{
  "code": "SUCCESS",
  "message": "성공",
  "data": {
    "id": 1,
    "fieldA": "value"
  }
}

Response (실패):
{
  "code": "DOMAIN_001",
  "message": "에러 메시지"
}
```

### 영향받는 파일

| 파일 경로 | 변경 종류 | 변경 범위 |
|----------|----------|---------|
| `domain/{new}/domain/{New}.java` | 신규 | 엔티티 생성 |
| `domain/{new}/domain/{New}Repository.java` | 신규 | JPA Repository |
| `domain/{new}/service/{New}Service.java` | 신규 | 비즈니스 로직 |
| `domain/{new}/controller/{New}Controller.java` | 신규 | REST 엔드포인트 |
| `global/config/SecurityConfig.java` | 수정 | 공개/보호 엔드포인트 추가 |
| `global/error/ErrorCode.java` | 수정 | 에러 코드 추가 |

### 접근 방식

#### Option A: [방식 이름]

```java
// 핵심 서비스 로직 스니펫 (방향 제시)
@Service
@RequiredArgsConstructor
public class NewService {
    private final NewRepository repository;
    private final UserInfoHelper userInfoHelper;

    @Transactional
    public NewResponse create(NewRequest request) {
        Long userSqno = userInfoHelper.getCurrentUserSqno();
        New entity = New.of(userSqno, request);
        return NewResponse.from(repository.save(entity));
    }
}
```

**트레이드오프:**
- 장점: 기존 계층 패턴 재사용, UserInfoHelper로 인증 정보 추출
- 단점: ...

#### Option B: ...

### 보안 체크리스트
- [ ] SecurityConfig에서 엔드포인트 접근 권한 설정
- [ ] SQL Injection 방지 (JPA 파라미터 바인딩 또는 PreparedStatement)
- [ ] 인증 사용자 소유 데이터만 접근 가능한가? (userSqno 검증)
- [ ] CORS 허용 Origin 확인

### query_master 쿼리 (해당 시)
```sql
-- sql_key: 'NEW_QUERY'
-- 삽입 스크립트:
INSERT INTO query_master (sql_key, query_text)
VALUES ('NEW_QUERY', 'SELECT * FROM new_table WHERE user_sqno = :userSqno LIMIT :pageSize OFFSET :offset');
```

### TODO 리스트 (승인 후 순서대로 실행)
- [ ] 1. DB 스키마 변경 (DDL 실행)
- [ ] 2. `domain/{new}/domain/{New}.java` — 엔티티 생성
- [ ] 3. `domain/{new}/domain/{New}Repository.java` — Repository 생성
- [ ] 4. `domain/{new}/service/{New}Service.java` — Service 구현
- [ ] 5. `domain/{new}/controller/{New}Controller.java` — Controller 구현
- [ ] 6. `global/config/SecurityConfig.java` — 엔드포인트 권한 추가
- [ ] 7. (해당 시) `global/error/ErrorCode.java` — 에러 코드 추가
- [ ] 8. (해당 시) query_master INSERT 스크립트 실행
- [ ] 9. `./gradlew test` 통과 확인

### 승인 상태
[ ] 사용자 승인 대기 중
[x] 사용자 승인 완료 (날짜: ...)
[ ] 구현 완료
```

---

## 현재 계획 없음

아직 작성된 구현 계획이 없습니다.