// app/view/[screenId]/page.tsx
'use client'; // 상태 관리와 이벤트를 위해 클라이언트 컴포넌트로 설정합니다.

import React, { useEffect, useState } from "react";
import axios from "@/api/axios";
import { useParams, useRouter } from "next/navigation"; // Next.js 전용으로 변경
import DynamicEngine from "@/components/DynamicEngine";
import Pagination from "@/components/Pagination";
import FilterToggle from "@/components/FilterToggle";
import {usePageMetadata} from "@/hooks/usePageMetadata";
import { usePageActions } from "@/hooks/usePageActions";
export default function CommonPage() {
    const {screenId} = useParams() as{ screenId :  string}; // 타입 캐스팅으로 에러 방지
    const router = useRouter(); // window.location.href 대신 사용

// 1. 상태 선언을 훅 호출보다 위로 올림 (중요!)
    const [currentPage, setCurrentPage] = useState(1);
    const [isOnlyMine, setIsOnlyMine] = useState(false);

    // 훅 호출
    // 2. 데이터 조회 관련 훅 호출
    const { metadata, pageData, loading, totalCount, isLoggedIn } = usePageMetadata(screenId, currentPage, isOnlyMine);

    // 3. 사용자 액션 관련 훅 호출
    const {handleChange, handleAction, showPassword, pwType} = usePageActions(metadata);

    const handleToggleMine = () => {
        setIsOnlyMine(prev => !prev);
        setCurrentPage(1);
    };

    const filtedMetadata = metadata.map((item: any) => {
        if(item.componentId === "pw_toggle_btn"){
            return { ...item, labelText: showPassword ? "숨기기" : "보이기" };
        }
        return item;
    }).filter((item:any) => {
        if (item.componentId === "go_login_btn" || item.componentId === "go_tutorial_btn")
            return !isLoggedIn;
        if (item.componentId === "go_diary_btn" || item.componentId === "go_tutorial_btn")
            return isLoggedIn;
        return true;
    });



    if (loading) return <div>화면 정보를 읽어오는 중입니다...</div>;

    return (
        <div className={`page-wrap ${screenId}`}>
            {screenId === "DIARY_LIST" && (
                <FilterToggle isOnlyMine={isOnlyMine} onToggle={handleToggleMine} />
            )}
            <DynamicEngine
                metadata={filtedMetadata}
                onChange={handleChange}
                onAction={handleAction}
                pageData={pageData}
                pwType={pwType}
                showPassword={showPassword}
            />

            {screenId === "DIARY_LIST"  && (
                <Pagination
                    totalCount={totalCount}
                    pageSize={5}
                    currentPage={currentPage}
                    onPageChange={(page) => {
                        setCurrentPage(page);
                        console.log(`[페이지 변경] 현재 페이지: ${currentPage}, 변경된 페이지: ${page}`);
                    }}
                />
            )}
        </div>
    );
}