import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: { retry: false }, // 테스트 시 재시도 방지
    },
});
// tests/test-utils.tsx

export function renderWithProviders(ui: React.ReactElement, { user = null } = {}) {
    const testQueryClient = createTestQueryClient();

    return render(
        <QueryClientProvider client={testQueryClient}>
            {/* AuthContext.Provider의 value는 AuthContextType과 일치해야 함
                user: 초기 사용자 정보
                isLoggedIn: 사용자 존재 여부에 따라 결정
                isLoading: 테스트 시에는 바로 완료된 상태인 false 부여
                updateUser: 상태 변경을 위한 빈 함수 주입
            */}
            <AuthContext.Provider value={{
                user,
                isLoggedIn: !!user,
                isLoading: false,
                updateUser: () => {}
            }}>
                {ui}
            </AuthContext.Provider>
        </QueryClientProvider>
    );
}