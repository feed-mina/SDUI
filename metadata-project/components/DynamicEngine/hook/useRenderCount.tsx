// hooks/useRenderCount.ts
import { useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';

export const useRenderCount = (componentName: string) => {
    const count = useRef(1);
    const params = useParams();

    const screenId = params?.screenId
    // URL 파라미터에서 screenId를 추출
    useEffect(() => {
        count.current += 1;
    });

    // console.log(`[Screen: ${screenId}] ${componentName} 렌더링 횟수: ${count.current}`);
};