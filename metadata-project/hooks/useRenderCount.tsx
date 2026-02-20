// hooks/useRenderCount.ts
import { useRef, useEffect } from 'react';

export const useRenderCount = (componentName: string) => {
    const count = useRef(1);

    useEffect(() => {
        count.current += 1;
    });

    console.log(`${componentName} 렌더링 횟수: ${count.current}`);
};