import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderWithProviders = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => {
    const testQueryClient = createTestQueryClient();
    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={testQueryClient}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </QueryClientProvider>
        );
    }
    return render(ui, { wrapper: Wrapper, ...options });
};

export * from '@testing-library/react';
export { renderWithProviders };