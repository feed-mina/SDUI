# Frontend Engineer — Mobile+Web Integration Plan (단계적 전환 방식)

**접근 방식**: Hybrid (Next.js 웹 유지 → Expo 모바일 추가 → 데이터 기반 통합 결정)
**작성일**: 2026-03-01
**담당**: Frontend Engineer Agent

---

## Research Analysis (연구 분석)

### 단계적 전환 전략

Hybrid 방식은 프론트엔드가 3단계로 진화:

```
Phase 1 (Month 1-2): Next.js 웹 플랫폼 파라미터 통합
  → useDeviceType 768px 표준화
  → axios X-Platform 헤더 추가
  → 기존 웹 서비스 무중단 운영

Phase 2 (Month 3-5): Expo 모바일 앱 개발 (웹과 병행)
  → Expo 프로젝트 생성 (expo-router)
  → DynamicEngine 포팅 (React → React Native)
  → componentMapNative 구현
  → 코드 재사용률: 85-90%

Phase 3 (Month 6): 데이터 기반 통합 결정
  → SEO 트래픽 > 30%: Next.js 유지 + Expo 병행
  → SEO 트래픽 < 10%: Expo Web 통합 (단일 코드베이스)
```

### Expo 선택 이유

1. **expo-router**: Next.js와 동일한 파일 기반 라우팅
2. **Expo Web**: react-native-web 내장 (Phase 3에서 웹 통합 가능)
3. **개발 환경**: Xcode/Android Studio 불필요
4. **OTA Updates**: 앱 재배포 없이 JS 번들 업데이트 (SDUI 철학 일치)

### 코드 재사용률

| Phase | Next.js 웹 | Expo 앱 | 재사용률 |
|-------|-----------|---------|----------|
| Phase 1 | 100% 유지 | - | - |
| Phase 2 | 100% 유지 | 85% 재사용 | 웹/앱 병행 |
| Phase 3 (통합) | Expo Web 90% | 100% | **90-95%** (단일화) |

---

## Implementation Plan (구현 계획)

### Phase 1: Next.js 웹 플랫폼 통합 (Month 1-2)

#### 목표
- Backend Engineer Phase 1 완료 후 시작
- useDeviceType 768px 표준화
- axios 인터셉터 X-Platform 헤더
- MetadataProvider 플랫폼 파라미터 통합

#### 1.1 useDeviceType 표준화

**파일**: `metadata-project/hooks/useDeviceType.tsx`

```typescript
import { useEffect, useState } from 'react';

export type Platform = 'mobile' | 'web';

export const useDeviceType = () => {
  const [platform, setPlatform] = useState<Platform>('web');

  useEffect(() => {
    const checkDevice = () => {
      setPlatform(window.innerWidth < 768 ? 'mobile' : 'web');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { platform, isMobile: platform === 'mobile' };
};
```

#### 1.2 axios 인터셉터

**파일**: `metadata-project/services/axios.tsx`

```typescript
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const platform = window.innerWidth < 768 ? 'mobile' : 'web';
    config.headers['X-Platform'] = platform;
    config.params = { ...config.params, platform };
  }
  return config;
});
```

#### 1.3 MetadataProvider

**파일**: `metadata-project/components/providers/MetadataProvider.tsx`

```typescript
export const MetadataProvider = ({ screenId, children }: Props) => {
  const { platform } = useDeviceType();

  const { data } = useQuery({
    queryKey: [`${rolePrefix}_${screenId}_${platform}`],
    queryFn: () => api.get(`/api/ui/${screenId}`, { params: { platform } }),
  });

  return <MetadataContext.Provider value={data}>{children}</MetadataContext.Provider>;
};
```

#### Phase 1 완료 기준
- ✅ useDeviceType 768px 표준화
- ✅ 모바일 뷰포트에서 platform=mobile 전송
- ✅ Redis 캐시 키 플랫폼별 분리 확인
- ✅ 웹 서비스 무중단 운영

---

### Phase 2: Expo 모바일 앱 개발 (Month 3-5)

#### 목표
- Expo 프로젝트 생성 (expo-router)
- DynamicEngine 포팅
- componentMapNative 구현
- SecureStore JWT 저장

#### 2.1 Expo 프로젝트 초기화

```bash
# Expo 프로젝트 생성
npx create-expo-app SDUI-expo-app --template tabs

cd SDUI-expo-app

# 필수 패키지 설치
npx expo install expo-router expo-secure-store
npx expo install axios @tanstack/react-query
npx expo install react-native-web react-dom  # Expo Web (Phase 3)
npx expo install @react-navigation/native
npx expo install @react-native-community/datetimepicker
npx expo install react-native-maps
```

**디렉토리 구조**:
```
SDUI-expo-app/
├── app/                     # expo-router (파일 기반 라우팅)
│   ├── view/
│   │   └── [...slug].tsx   # 동적 라우팅 (Next.js와 유사)
│   ├── _layout.tsx         # 루트 레이아웃
│   └── index.tsx           # 홈 화면
├── components/
│   ├── DynamicEngine/
│   │   ├── DynamicEngine.tsx
│   │   └── useDynamicEngine.tsx
│   ├── constants/
│   │   └── componentMapNative.ts
│   └── fields/
│       ├── Input.native.tsx
│       ├── Modal.native.tsx
│       └── DatePicker.native.tsx
├── hooks/
│   └── usePlatform.ts
├── services/
│   └── api.ts              # SecureStore + Bearer
├── app.json
└── package.json
```

#### 2.2 DynamicEngine 포팅

**파일**: `SDUI-expo-app/components/DynamicEngine/DynamicEngine.tsx`

```typescript
import { View, StyleSheet } from 'react-native';
import { Metadata } from '../../types/metadata';
import { componentMapNative } from '../constants/componentMapNative';

export const DynamicEngine = ({ metadata, screenId }: Props) => {
  const renderNode = (node: Metadata) => {
    const Component = componentMapNative[node.componentType];

    if (!Component) {
      console.warn(`Unknown component: ${node.componentType}`);
      return null;
    }

    return (
      <View key={node.componentId} style={resolveStyle(node.cssClass)}>
        <Component meta={node} />
      </View>
    );
  };

  return (
    <View style={styles.engineContainer}>
      {metadata.map(renderNode)}
    </View>
  );
};

const styles = StyleSheet.create({
  engineContainer: {
    flex: 1,
    padding: 16,
  },
});
```

#### 2.3 componentMapNative

**파일**: `SDUI-expo-app/components/constants/componentMapNative.ts`

```typescript
import InputNative from '../fields/Input.native';
import ButtonNative from '../fields/Button.native';
import ModalNative from '../fields/Modal.native';
import DatePickerNative from '../fields/DatePicker.native';

export const componentMapNative: Record<string, React.ComponentType<any>> = {
  INPUT: InputNative,
  BUTTON: ButtonNative,
  MODAL: ModalNative,
  DATETIME_PICKER: DatePickerNative,
  // ... 19개 컴포넌트
};
```

#### 2.4 네이티브 컴포넌트 예시

**파일**: `SDUI-expo-app/components/fields/Modal.native.tsx`

```typescript
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

export default function ModalNative({ meta, onConfirm, onClose }: Props) {
  return (
    <Modal visible={true} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{meta.labelText}</Text>
          <Pressable onPress={onConfirm} style={styles.button}>
            <Text style={styles.buttonText}>확인</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});
```

#### 2.5 SecureStore JWT 저장

**파일**: `SDUI-expo-app/services/api.ts`

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: 'https://api.yourapp.com',
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['X-Platform'] = 'mobile';
  config.params = { ...config.params, platform: 'mobile' };

  return config;
});

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
};

export default api;
```

#### 2.6 expo-router 라우팅

**파일**: `SDUI-expo-app/app/view/[...slug].tsx`

```typescript
import { useLocalSearchParams } from 'expo-router';
import { MetadataProvider } from '../../components/providers/MetadataProvider';
import { DynamicEngine } from '../../components/DynamicEngine/DynamicEngine';

export default function CommonPage() {
  const { slug } = useLocalSearchParams<{ slug: string[] }>();
  const screenId = Array.isArray(slug) ? slug[0] : slug;

  return (
    <MetadataProvider screenId={screenId}>
      <DynamicEngine />
    </MetadataProvider>
  );
}
```

#### Phase 2 완료 기준
- ✅ Expo 앱 iOS/Android 빌드 성공
- ✅ DynamicEngine 렌더링 확인
- ✅ 19개 컴포넌트 중 15개 호환, 4개 재작성
- ✅ SecureStore JWT 저장 확인
- ✅ 로그인 → 리스트 → 상세 플로우 테스트

---

### Phase 3: 데이터 기반 통합 결정 (Month 6)

#### 3.1 SEO 트래픽 분석

**측정 도구**: Google Analytics 4

```
측정 항목:
- 유기적 검색 트래픽 비율
- 직접 방문 vs 검색 유입
- 핵심 화면 SEO 전환율
```

**의사결정 기준**:

| SEO 트래픽 | 결정 | 작업 |
|-----------|------|------|
| > 30% | Next.js 유지 + Expo 병행 | 2개 코드베이스 유지 |
| 10-30% | 랜딩만 Next.js | 마케팅 페이지만 Next.js |
| < 10% | **Expo Web 통합** | 단일 코드베이스 |

#### 3.2 Expo Web 통합 (SEO 낮을 경우)

**목표**: Next.js 폐기, Expo로 웹+모바일 단일화

**마이그레이션 작업**:
```
Next.js → Expo 포팅:
1. app/view/[...slug]/page.tsx → app/view/[...slug].tsx (이미 완료)
2. components/fields/*.tsx → Platform.select 적용
3. CSS → StyleSheet 변환
```

**Platform.select 예시**:
```typescript
// components/constants/componentMap.ts
import { Platform } from 'react-native';
import ModalWeb from '../fields/Modal.web';
import ModalNative from '../fields/Modal.native';

export const componentMap = {
  MODAL: Platform.select({
    web: ModalWeb,
    native: ModalNative,
  }),
  // ...
};
```

**Expo Web 빌드**:
```bash
# 웹 빌드
npx expo export:web

# 정적 파일 생성 (dist/)
# Vercel/Netlify에 배포
```

#### 3.3 Next.js 병행 유지 (SEO 높을 경우)

**공통 로직 추출**:
```
packages/
├── web/              # Next.js
├── mobile/           # Expo
└── shared/           # 타입, 액션 핸들러
```

#### Phase 3 완료 기준
- ✅ SEO 데이터 수집 (3개월)
- ✅ 최종 아키텍처 결정
- ✅ 통합 작업 완료 또는 병행 구조 확정

---

## Security Considerations (보안 고려사항)

### 1. JWT 저장 위치

| Platform | Storage | 보안 수준 |
|----------|---------|----------|
| Next.js Web | HttpOnly Cookie | ✅ 높음 |
| Expo Mobile | SecureStore (Keychain) | ✅ 높음 |
| Expo Web | Cookie | ✅ 높음 |

### 2. Certificate Pinning (Expo)

```typescript
// Expo Custom Development Build 필요
// app/_layout.tsx
import * as Network from 'expo-network';

useEffect(() => {
  // SSL Pinning 설정
}, []);
```

---

## Test Plan (테스트 계획)

### Phase 1 테스트 (Next.js 웹)

```typescript
test('sends mobile platform when width < 768px', async () => {
  global.innerWidth = 375;
  render(<MetadataProvider screenId="LOGIN_PAGE" />);

  await waitFor(() => {
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('?platform=mobile')
    );
  });
});
```

### Phase 2 테스트 (Expo 앱)

```typescript
import { render } from '@testing-library/react-native';

test('renders native components', () => {
  const metadata = [{ componentType: 'INPUT', componentId: 'email' }];
  const { getByTestId } = render(<DynamicEngine metadata={metadata} />);

  expect(getByTestId('input-email')).toBeTruthy();
});
```

### E2E 테스트 (Detox)

```typescript
describe('Login Flow', () => {
  it('should login and store token', async () => {
    await element(by.id('emailInput')).typeText('test@example.com');
    await element(by.id('passwordInput')).typeText('password123');
    await element(by.id('loginBtn')).tap();

    await waitFor(element(by.id('diaryListScreen'))).toBeVisible();
  });
});
```

---

## Dependencies (의존성)

### Depends on
- Architect: JSONB 스키마
- Backend Engineer (Phase 1): API 배포
- Designer: CSS → StyleSheet 변환 가이드

### Blocks
- QA Engineer: 프론트엔드 완료 후 E2E 테스트

---

## Timeline (타임라인)

```
Month 1-2: Phase 1 (Next.js 웹)
  Week 1-2: useDeviceType + axios 통합

Month 3-5: Phase 2 (Expo 앱)
  Week 3-4:  Expo 프로젝트 초기화
  Week 5-7:  DynamicEngine 포팅
  Week 8-10: componentMapNative 구현

Month 6: Phase 3 (데이터 기반 결정)
  Week 11-12: SEO 분석 + 통합/병행 확정
```

---

**다음 단계**: Planner plan.md 작성 (component_props 설계)
