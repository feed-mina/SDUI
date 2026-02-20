import { useRenderCount } from "@/hooks/useRenderCount";
import React from 'react';

export function withRenderTrack<P extends object>(
    Component: React.ComponentType<P>,
    componentName: string
) {
    // 1. 익명 함수 대신 이름을 가진 함수를 정의해
    const WrappedComponent = (props: P) => {
        useRenderCount(componentName);
        return <Component {...props} />;
    };

    // 2. @@@@ 핵심: DevTools에 표시될 이름을 설정해 (에러 해결 지점) [cite: 2025-12-28]
    WrappedComponent.displayName = `WithRenderTrack(${componentName})`;
    return WrappedComponent;
}