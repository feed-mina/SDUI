# Frontend Engineer — Mobile+Web Integration Plan (병행 접근 방식)

**접근 방식**: Next.js 웹 + React Native 모바일 병행 운영
**작성일**: 2026-03-01
**담당**: Frontend Engineer Agent

---

## Research Analysis (연구 분석)

### 현재 프론트엔드 아키텍처

**웹 (Next.js 16.1.3)**:
- React 19, TypeScript 5.x
- DynamicEngine: 메타데이터 기반 렌더링
- componentMap: 19개 컴포넌트
- useDeviceType: 뷰포트 감지 (현재 1000px, 표준화 필요 → 768px)
- axios: JWT Cookie 기반 인증

**핵심 파일**:
```
metadata-project/
├── components/
│   ├── DynamicEngine/DynamicEngine.tsx        # 렌더링 엔진 코어
│   ├── DynamicEngine/useDynamicEngine.tsx     # 데이터 바인딩
│   ├── constants/componentMap.tsx             # React 컴포넌트 매핑
│   └── fields/                                # 19개 컴포넌트
├── hooks/useDeviceType.tsx                    # 뷰포트 감지
├── services/axios.tsx                         # API 클라이언트
└── app/view/[...slug]/page.tsx                # CommonPage (진입점)
```

### 병행 접근 방식 분석

#### 목표
- Next.js 웹 유지 (기존 사용자 경험 보존)
- React Native 모바일 앱 개발 (네이티브 UX)
- DynamicEngine 로직 재사용 (60-70%)

#### 컴포넌트 호환성 매트릭스

| 컴포넌트 | Next.js (웹) | React Native | 변환 복잡도 |
|----------|-------------|--------------|-------------|
| INPUT | `<input>` | `<TextInput>` | 낮음 ⚪ |
| TEXT | `<span>` | `<Text>` | 낮음 ⚪ |
| BUTTON | `<button>` | `<Pressable>` | 낮음 ⚪ |
| IMAGE | `<img>` | `<Image>` | 낮음 ⚪ |
| TEXTAREA | `<textarea>` | `<TextInput multiline>` | 낮음 ⚪ |
| SELECT | `<select>` | `<Picker>` | 중간 🟡 |
| MODAL | react-modal | RN Modal | **높음 🔴** |
| DATETIME_PICKER | `<input type="date">` | @react-native-community/datetimepicker | **높음 🔴** |
| ADDRESS_SEARCH_GROUP | 다음 지도 API | React Native Maps | **매우 높음 🔴🔴** |
| EMOTION_SELECT | Custom | Custom (동일) | 낮음 ⚪ |
| TIME_SELECT | Custom | RN Picker | 중간 🟡 |
| FILTER_TOGGLE | Custom | Custom | 낮음 ⚪ |

**재작성 필요**: MODAL, DATETIME_PICKER, ADDRESS_SEARCH_GROUP, TIME_SELECT (4개)
**부분 수정 필요**: SELECT (1개)
**재사용 가능**: 나머지 14개

---

## Implementation Plan (구현 계획)

### Phase 1: Next.js 웹 플랫폼 통합 (Week 1-2)

#### 목표
- useDeviceType 768px 표준화
- axios 인터셉터 X-Platform 헤더 추가
- MetadataProvider 플랫폼 파라미터 통합
- CSS breakpoint 일치 (Designer와 협업)

#### 1.1 useDeviceType 표준화

**파일**: `metadata-project/hooks/useDeviceType.tsx`

**현재 문제**:
- breakpoint 1000px (CSS는 768px/1024px와 불일치)
- isMobile만 반환

**수정 후**:
```typescript
import { useEffect, useState } from 'react';

export type Platform = 'mobile' | 'web';

export const useDeviceType = () => {
  const [platform, setPlatform] = useState<Platform>('web');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setPlatform(width < 768 ? 'mobile' : 'web');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return {
    platform,
    isMobile: platform === 'mobile',
    isWeb: platform === 'web'
  };
};
```

#### 1.2 axios 인터셉터 (X-Platform 헤더)

**파일**: `metadata-project/services/axios.tsx`

**추가 내용**:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true, // Cookie 전송
  timeout: 10000,
});

// Request 인터셉터: X-Platform 헤더 + platform 파라미터 추가
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    const platform = width < 768 ? 'mobile' : 'web';

    config.headers['X-Platform'] = platform;
    config.params = {
      ...config.params,
      platform, // ?platform=mobile 또는 ?platform=web
    };
  }

  return config;
});

// Response 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized: 로그아웃 처리
      window.location.href = '/view/LOGIN_PAGE';
    }

    if (error.response?.status === 429) {
      // Too Many Requests
      console.error('Rate limit exceeded. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;
```

#### 1.3 MetadataProvider 통합

**파일**: `metadata-project/components/providers/MetadataProvider.tsx`

**수정 내용**:
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/services/axios';
import { useDeviceType } from '@/hooks/useDeviceType';

export const MetadataProvider = ({ screenId, children }: Props) => {
  const { platform } = useDeviceType();

  // React Query 캐시 키: {rolePrefix}_{screenId}_{platform}
  const { data, isLoading, error } = useQuery({
    queryKey: [`${rolePrefix}_${screenId}_${platform}`],
    queryFn: () => api.get(`/api/ui/${screenId}`, {
      params: { platform } // axios 인터셉터에서도 추가되지만 명시
    }),
    staleTime: 1000 * 60 * 5, // 5분
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading metadata</div>;

  return (
    <MetadataContext.Provider value={data}>
      {children}
    </MetadataContext.Provider>
  );
};
```

#### 1.4 DynamicEngine CSS 클래스 적용

**파일**: `metadata-project/components/DynamicEngine/DynamicEngine.tsx`

**추가**: css_class_overrides 지원

```typescript
export const DynamicEngine = ({ metadata, screenId }: Props) => {
  const { platform } = useDeviceType();

  const resolveClassName = (node: Metadata) => {
    // css_class_overrides 우선 적용
    if (node.cssClassOverrides && node.cssClassOverrides[platform]) {
      return node.cssClassOverrides[platform];
    }

    // 기본 css_class
    return node.cssClass || '';
  };

  return (
    <div className="engine-container">
      {metadata.map((node) => (
        <div key={node.componentId} className={resolveClassName(node)}>
          {renderComponent(node)}
        </div>
      ))}
    </div>
  );
};
```

---

### Phase 2: React Native 앱 개발 (Week 3-10)

#### 목표
- React Native CLI 프로젝트 초기화
- DynamicEngine 포팅 (React → React Native)
- componentMapNative 구현 (네이티브 컴포넌트)
- SecureStore JWT 저장
- React Navigation 통합

#### 2.1 프로젝트 초기화

```bash
# React Native CLI 방식
npx react-native init SDUIMobileApp --template react-native-template-typescript

cd SDUIMobileApp

# 필수 패키지 설치
npm install axios @tanstack/react-query
npm install expo-secure-store  # JWT 저장
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-community/datetimepicker
npm install react-native-maps  # 주소 검색 (Google Maps)
```

**디렉토리 구조**:
```
SDUIMobileApp/
├── src/
│   ├── components/
│   │   ├── DynamicEngine/
│   │   │   ├── DynamicEngine.tsx            # React Native 버전
│   │   │   └── useDynamicEngine.tsx         # 웹에서 복사
│   │   ├── constants/
│   │   │   └── componentMapNative.ts        # React Native 컴포넌트 매핑
│   │   └── fields/
│   │       ├── InputNative.tsx
│   │       ├── ModalNative.tsx
│   │       ├── DatePickerNative.tsx
│   │       └── AddressSearchNative.tsx
│   ├── screens/
│   │   ├── CommonScreen.tsx                 # page.tsx 대응
│   │   └── LoginScreen.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx                 # React Navigation
│   ├── services/
│   │   └── api.ts                           # SecureStore + Bearer
│   └── types/
│       └── metadata.ts                      # 웹에서 복사
├── ios/
├── android/
└── App.tsx
```

#### 2.2 DynamicEngine 포팅

**파일**: `SDUIMobileApp/src/components/DynamicEngine/DynamicEngine.tsx`

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Metadata } from '../../types/metadata';
import { componentMapNative } from '../constants/componentMapNative';

interface Props {
  metadata: Metadata[];
  screenId: string;
  pageData?: Record<string, any>;
  formData?: Record<string, any>;
}

export const DynamicEngine = ({ metadata, screenId, pageData, formData }: Props) => {
  const renderNode = (node: Metadata) => {
    const Component = componentMapNative[node.componentType];

    if (!Component) {
      console.warn(`Unknown component type: ${node.componentType}`);
      return null;
    }

    return (
      <View key={node.componentId} style={resolveStyle(node.cssClass)}>
        <Component
          meta={node}
          pageData={pageData}
          formData={formData}
          screenId={screenId}
        />
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
    backgroundColor: '#fff',
  },
});

function resolveStyle(cssClass?: string) {
  // CSS 클래스명 → StyleSheet 매핑 (Designer와 협업)
  // 예: 'flex-col-layout' → { flexDirection: 'column' }
  if (!cssClass) return {};

  const styleMap: Record<string, any> = {
    'flex-col-layout': { flexDirection: 'column' },
    'flex-row-layout': { flexDirection: 'row' },
    'engine-container': { padding: 16 },
  };

  return styleMap[cssClass] || {};
}
```

#### 2.3 componentMapNative

**파일**: `SDUIMobileApp/src/components/constants/componentMapNative.ts`

```typescript
import InputNative from '../fields/InputNative';
import TextNative from '../fields/TextNative';
import ButtonNative from '../fields/ButtonNative';
import ImageNative from '../fields/ImageNative';
import ModalNative from '../fields/ModalNative';
import DatePickerNative from '../fields/DatePickerNative';
import AddressSearchNative from '../fields/AddressSearchNative';
import SelectNative from '../fields/SelectNative';
import TextAreaNative from '../fields/TextAreaNative';

export const componentMapNative: Record<string, React.ComponentType<any>> = {
  INPUT: InputNative,
  TEXT: TextNative,
  BUTTON: ButtonNative,
  IMAGE: ImageNative,
  TEXTAREA: TextAreaNative,
  SELECT: SelectNative,
  MODAL: ModalNative,
  DATETIME_PICKER: DatePickerNative,
  ADDRESS_SEARCH_GROUP: AddressSearchNative,
  EMOTION_SELECT: EmotionSelectNative,
  TIME_SELECT: TimeSelectNative,
  FILTER_TOGGLE: FilterToggleNative,
  // ... 19개 전체
};
```

#### 2.4 네이티브 컴포넌트 예시

**파일**: `SDUIMobileApp/src/components/fields/InputNative.tsx`

```typescript
import React from 'react';
import { TextInput, StyleSheet, Text, View } from 'react-native';
import { Metadata } from '../../types/metadata';

interface Props {
  meta: Metadata;
  formData?: Record<string, any>;
}

export default function InputNative({ meta, formData }: Props) {
  const [value, setValue] = React.useState('');

  const handleChange = (text: string) => {
    setValue(text);
    // formData 업데이트 로직 (useDynamicEngine과 통합)
  };

  return (
    <View style={styles.container}>
      {meta.labelText && <Text style={styles.label}>{meta.labelText}</Text>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        placeholder={meta.placeholder}
        secureTextEntry={meta.componentProps?.type === 'password'}
        keyboardType={meta.componentProps?.type === 'email' ? 'email-address' : 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    minHeight: 48, // 터치 타겟 (Designer 표준)
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});
```

**파일**: `SDUIMobileApp/src/components/fields/ModalNative.tsx`

```typescript
import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

export default function ModalNative({ meta, onConfirm, onClose }: Props) {
  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{meta.labelText}</Text>

          {meta.children && (
            <View style={styles.body}>
              {/* children 렌더링 */}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmText}>확인</Text>
            </Pressable>
          </View>
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
  body: {
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**파일**: `SDUIMobileApp/src/components/fields/DatePickerNative.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DatePickerNative({ meta }: Props) {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      {meta.labelText && <Text style={styles.label}>{meta.labelText}</Text>}

      <Pressable onPress={() => setShow(true)} style={styles.input}>
        <Text style={styles.dateText}>
          {date.toLocaleDateString('ko-KR')}
        </Text>
      </Pressable>

      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
});
```

#### 2.5 SecureStore JWT 저장

**파일**: `SDUIMobileApp/src/services/api.ts`

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const api = axios.create({
  baseURL: 'https://api.yourapp.com', // 프로덕션 URL
  timeout: 10000,
});

// Request 인터셉터: Bearer 토큰 + X-Platform 헤더
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['X-Platform'] = 'mobile';
  config.params = {
    ...config.params,
    platform: 'mobile',
  };

  return config;
});

// Response 인터셉터: 401 시 토큰 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', { refreshToken });
          const newAccessToken = response.data.accessToken;

          await SecureStore.setItemAsync('accessToken', newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh 실패 → 로그아웃
          await clearTokens();
          // Navigate to login screen
        }
      }
    }

    return Promise.reject(error);
  }
);

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
};

export default api;
```

#### 2.6 React Navigation 통합

**파일**: `SDUIMobileApp/src/navigation/AppNavigator.tsx`

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CommonScreen from '../screens/CommonScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="CommonScreen">
        <Stack.Screen
          name="CommonScreen"
          component={CommonScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**파일**: `SDUIMobileApp/src/screens/CommonScreen.tsx`

```typescript
import { useRoute } from '@react-navigation/native';
import { View } from 'react-native';
import { MetadataProvider } from '../components/providers/MetadataProvider';
import { DynamicEngine } from '../components/DynamicEngine/DynamicEngine';

export default function CommonScreen() {
  const route = useRoute();
  const screenId = route.params?.screenId || 'LOGIN_PAGE';

  return (
    <View style={{ flex: 1 }}>
      <MetadataProvider screenId={screenId}>
        <DynamicEngine />
      </MetadataProvider>
    </View>
  );
}
```

---

### Phase 3: 공통 로직 추출 (Week 11-12)

#### 목표
- Yarn Workspaces 모노레포 구성
- 타입, 유틸, 액션 핸들러 공유

#### 3.1 Monorepo 구조

```
SDUI/
├── packages/
│   ├── web/                 # Next.js (기존 metadata-project/)
│   ├── mobile/              # React Native (SDUIMobileApp/)
│   └── shared/              # 공통 로직
│       ├── types/
│       │   └── metadata.ts
│       ├── utils/
│       │   └── dataBinding.ts
│       └── actions/
│           └── useUserActions.ts
├── package.json             # Yarn Workspaces 루트
└── tsconfig.base.json       # 공통 TypeScript 설정
```

**파일**: `SDUI/package.json`

```json
{
  "name": "sdui-monorepo",
  "private": true,
  "workspaces": [
    "packages/web",
    "packages/mobile",
    "packages/shared"
  ],
  "scripts": {
    "web:dev": "yarn workspace @sdui/web dev",
    "mobile:ios": "yarn workspace @sdui/mobile ios",
    "mobile:android": "yarn workspace @sdui/mobile android"
  }
}
```

**파일**: `packages/shared/types/metadata.ts`

```typescript
export interface Metadata {
  componentId: string;
  componentType: string;
  labelText: string;
  placeholder?: string;
  componentProps: Record<string, any>;
  cssClass?: string;
  cssClassOverrides?: Record<string, string>;
  actionType?: string;
  groupDirection?: 'ROW' | 'COLUMN';
  refDataId?: string;
  children?: Metadata[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

**파일**: `packages/shared/actions/useUserActions.ts`

```typescript
export const useUserActions = (platform: 'web' | 'mobile') => {
  const handleLogin = async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    }, {
      headers: { 'X-Platform': platform },
    });

    if (platform === 'web') {
      // Cookie 자동 저장
    } else {
      // SecureStore 저장
      await saveTokens(
        response.data.accessToken,
        response.data.refreshToken
      );
    }

    return response.data;
  };

  return { handleLogin };
};
```

---

## Security Considerations (보안 고려사항)

### 1. JWT 저장

| Platform | Storage | XSS | 루팅 |
|----------|---------|-----|------|
| Next.js Web | HttpOnly Cookie | ✅ 안전 | N/A |
| React Native | SecureStore (Keychain) | ✅ 안전 | ⚠️ 루팅 시 위험 |

**완화**: Root Detection 라이브러리 추가
```bash
npm install react-native-root-detection
```

### 2. Certificate Pinning

**파일**: `SDUIMobileApp/src/config/security.ts`

```typescript
import { setCustomCA } from 'react-native-ssl-pinning';

export const enableCertificatePinning = () => {
  setCustomCA({
    certs: ['sha256/YOUR_CERT_HASH'],
    hostname: 'api.yourapp.com',
  });
};
```

### 3. 코드 난독화

```bash
# Android ProGuard
npx react-native bundle --platform android --dev false --minify true

# iOS Bitcode
# Xcode Build Settings → Enable Bitcode
```

---

## Test Plan (테스트 계획)

### Web 테스트 (Jest + RTL)

**파일**: `metadata-project/tests/platform_detection.test.tsx`

```typescript
test('sends mobile platform when viewport < 768px', async () => {
  global.innerWidth = 375;
  global.dispatchEvent(new Event('resize'));

  render(<MetadataProvider screenId="LOGIN_PAGE"><DynamicEngine /></MetadataProvider>);

  await waitFor(() => {
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('?platform=mobile'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Platform': 'mobile' })
      })
    );
  });
});
```

### Mobile 테스트 (Jest + RNTL)

**파일**: `SDUIMobileApp/__tests__/DynamicEngine.test.tsx`

```typescript
import { render } from '@testing-library/react-native';
import DynamicEngine from '../src/components/DynamicEngine/DynamicEngine';

test('renders native DatePicker', () => {
  const metadata = [
    { componentType: 'DATETIME_PICKER', componentId: 'date1' }
  ];

  const { getByTestId } = render(<DynamicEngine metadata={metadata} />);
  expect(getByTestId('native-date-picker')).toBeTruthy();
});
```

### E2E 테스트 (Detox)

```typescript
describe('Login Flow (Mobile)', () => {
  it('should login with SecureStore token', async () => {
    await element(by.id('emailInput')).typeText('test@example.com');
    await element(by.id('passwordInput')).typeText('password123');
    await element(by.id('loginBtn')).tap();

    await waitFor(element(by.id('diaryListScreen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

---

## Dependencies (의존성)

### Depends on
- Architect: JSONB 스키마
- Backend Engineer: API 배포
- Designer: CSS 클래스 정의

### Blocks
- QA Engineer: 프론트엔드 완료 후 E2E 테스트

---

## Timeline (타임라인)

```
Week 1-2:  Next.js 웹 플랫폼 통합
Week 3-6:  React Native 프로젝트 초기화 + DynamicEngine 포팅
Week 7-9:  componentMapNative 구현 (네이티브 컴포넌트)
Week 10:   SecureStore + React Navigation
Week 11-12: 공통 로직 추출 (Monorepo)
```

---

**다음 단계**: QA Engineer plan.md 작성 및 E2E 테스트 전략 수립
