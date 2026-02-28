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

## 현재 계획 없음

아직 작성된 구현 계획이 없습니다.