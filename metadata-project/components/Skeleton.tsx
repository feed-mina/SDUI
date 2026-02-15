// components/Skeleton.tsx
import React from 'react';

// Props 타입 정의: 가로, 세로 길이를 유연하게 받음
interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    className?: string; // 추가적인 마진 등을 위해
}

const Skeleton = ({width = "100%", height = "20px", className = ""}: SkeletonProps) => {
    // 스타일 객체로 동적으로 크기 조절
    const style = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    return <div className={`skeleton-box ${className}`} style={style}/>;
};

export default Skeleton;